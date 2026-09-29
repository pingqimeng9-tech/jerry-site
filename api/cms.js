// /api/cms.js — 线上 CMS 写接口（静态站的“在线后台”）
// 原理：校验管理员 Supabase 会话 → 通过 GitHub API 把改动提交回仓库 → Vercel 自动部署
//
// 必需环境变量：
//   GITHUB_TOKEN                 fine-grained PAT，仅授权本仓库 Contents 读写
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   用于验证登录会话
// 可选：
//   GITHUB_REPO                  默认 pingqimeng9-tech/jerry-site
//   GITHUB_BRANCH                默认 main
//   ADMIN_EMAIL                  默认 zengaihua008@gmail.com（多个逗号分隔）
//
// 安全要点：
//   1) 每个请求都用 auth.getUser(token) 向 Supabase 实时验票，不信任前端传来的任何身份信息
//   2) 邮箱白名单在服务端强制；非白名单一律 403
//   3) GITHUB_TOKEN 只存在于环境变量，前端永远接触不到
//   4) 写入路径全部白名单，防路径穿越；单文件 ≤ 4MB（Serverless 请求体限制）
const { createClient } = require('@supabase/supabase-js');

const REPO = process.env.GITHUB_REPO || 'pingqimeng9-tech/jerry-site';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
// 管理员白名单只从环境变量 ADMIN_EMAIL 读取，代码库里不写死任何邮箱
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const MAX_FILE_BYTES = 4 * 1024 * 1024;

// 站点内容全部在仓库 site/ 目录（Vercel Output Directory），仓库路径统一加前缀
const RP = p => 'site/' + p;
const COLLECTION_FILES = {
  moments: RP('data/moments.json'), friends: RP('data/friends.json'),
  projects: RP('data/projects.json'), albums: RP('data/albums.json'), comments: RP('data/comments.json')
};
// 上传目录白名单（前端传入的相对路径，不含 site/ 前缀；写仓库时由 RP() 统一加）
const UPLOAD_DIRS = {
  'images/posts': true, 'images/albums': true, 'images/bg': true, 'images/pet': true,
  'videos/posts': true, 'files/posts': true
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); } }
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
function nowStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
function slugify(s) {
  return (s || 'post').toString().trim().toLowerCase()
    .replace(/[\s　]+/g, '-').replace(/[^\w一-龥-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 48);
}

// ---------- 鉴权 ----------
async function authenticate(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) { res.status(401).json({ ok: false, error: '未登录或登录已过期' }); return null; }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ ok: false, error: '登录服务未配置' }); return null;
  }
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ ok: false, error: '登录无效，请重新登录' }); return null; }
  if (!ADMIN_EMAILS.length) { res.status(503).json({ ok: false, error: 'CMS 未配置 ADMIN_EMAIL' }); return null; }
  const email = (data.user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) { res.status(403).json({ ok: false, error: '该账号没有管理权限' }); return null; }
  return data.user;
}

// ---------- GitHub 仓库即数据库 ----------
async function gh(pathname, options) {
  const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + pathname + '?ref=' + BRANCH, {
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'jerry-cms',
      'X-GitHub-Api-Version': '2022-11-28'
    }, ...(options || {})
  });
  return r;
}
async function readRepoJson(relPath) {
  const r = await gh(relPath);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('读取仓库文件失败 ' + relPath + ': ' + r.status);
  const j = await r.json();
  return { json: JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')), sha: j.sha };
}
// 多文件一次提交（Git Database API，原子事务：要么全部成功要么不提交）
async function commitFiles(changes, message) {
  if (!process.env.GITHUB_TOKEN) throw new Error('线上保存未配置 GITHUB_TOKEN 环境变量');
  const H = {
    Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json', 'User-Agent': 'jerry-cms',
    'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json'
  };
  const api = (p, opt) => fetch('https://api.github.com/repos/' + REPO + p, { headers: H, ...opt }).then(async r => {
    if (!r.ok) throw new Error('GitHub API ' + p + ' 失败: ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
  });
  const ref = await api('/git/ref/heads/' + BRANCH);
  const baseCommit = await api('/git/commits/' + ref.object.sha);
  const tree = [];
  for (const ch of changes) {
    if (ch.deleted) { tree.push({ path: ch.path, mode: '100644', type: 'blob', sha: null }); continue; }
    const blob = await api('/git/blobs', { method: 'POST', body: JSON.stringify({ content: ch.contentBase64, encoding: 'base64' }) });
    tree.push({ path: ch.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await api('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }) });
  const newCommit = await api('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] })
  });
  await api('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
  return newCommit.sha;
}
const b64 = obj => Buffer.from(JSON.stringify(obj, null, 2), 'utf8').toString('base64');

// ---------- 业务操作（与本地 server.js 行为一致） ----------
async function opPostSave(body) {
  const data = (await readRepoJson(RP('data/posts.json'))) || { json: { posts: [] } };
  const store = data.json;
  let id = (body.id || '').trim();
  let post = store.posts.find(x => x.id === id);
  if (!post) {
    const slug = slugify(body.title) || 'post';
    id = id || (slug + '_' + Date.now().toString(36));
    post = { id, views: 0, createdAt: nowStr() };
    store.posts.push(post);
  }
  post.title = (body.title || '').trim();
  post.category = (body.category || '未分类').trim();
  post.excerpt = (body.excerpt || body.summary || '').trim();
  post.cover = (body.cover || '').trim();
  post.tags = Array.isArray(body.tags) ? body.tags : [];
  post.mood = (body.mood || '').trim();
  post.markdown = body.markdown || '';
  post.status = body.status === 'draft' ? 'draft' : 'published';
  if (body.date) post.date = body.date; else if (!post.date) post.date = nowStr().split(' ')[0];
  post.updatedAt = nowStr();
  post.syncedAt = '';
  if (body.thumb) post.thumb = (body.thumb || '').trim();
  store.posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  await commitFiles([{ path: RP('data/posts.json'), contentBase64: b64(store) }], 'CMS: 保存文章 ' + post.title);
  return { id: post.id, status: post.status };
}
async function opPostDelete(body) {
  const data = await readRepoJson(RP('data/posts.json'));
  if (!data) throw new Error('posts.json 不存在');
  data.json.posts = data.json.posts.filter(x => x.id !== body.id);
  await commitFiles([{ path: RP('data/posts.json'), contentBase64: b64(data.json) }], 'CMS: 删除文章 ' + body.id);
  return {};
}
async function opCollectionSave(body) {
  const file = COLLECTION_FILES[body.name];
  if (!file) throw new Error('未知集合: ' + body.name);
  const data = (await readRepoJson(file)) || { json: { items: [] } };
  let item = data.json.items.find(x => x.id === (body.item && body.item.id));
  if (!item) {
    item = { id: body.name.slice(0, 3) + '_' + Date.now().toString(36), createdAt: nowStr() };
    data.json.items.unshift(item);
  }
  Object.assign(item, body.item, { id: item.id, updatedAt: nowStr() });
  await commitFiles([{ path: file, contentBase64: b64(data.json) }], 'CMS: 更新' + body.name);
  return { item };
}
async function opCollectionDelete(body) {
  const file = COLLECTION_FILES[body.name];
  if (!file) throw new Error('未知集合: ' + body.name);
  const data = await readRepoJson(file);
  if (!data) return {};
  data.json.items = data.json.items.filter(x => x.id !== body.id);
  await commitFiles([{ path: file, contentBase64: b64(data.json) }], 'CMS: 删除' + body.name + '条目');
  return {};
}
async function opLayoutSave(body) {
  if (body.format !== 'jerry-layout/v1' || !body.pages) throw new Error('布局配置格式错误');
  await commitFiles([{ path: RP('data/layout_config.json'), contentBase64: b64(body) }], 'CMS: 更新页面布局');
  return {};
}
async function opPetSave(body) {
  if (body.format !== 'jerry-pet-pack/v1' || !Array.isArray(body.packs)) throw new Error('桌宠配置格式错误');
  await commitFiles([{ path: RP('data/pet_packs.json'), contentBase64: b64(body) }], 'CMS: 更新桌宠动作包');
  return {};
}
// 公开设置：密钥字段一律剔除，绝不允许写进仓库里的 site.config.json
const SECRET_KEYS = {
  aiCat: ['apiKey', 'apiBase'], picBed: ['token'], gitalk: ['clientSecret']
};
async function opConfigApply(body) {
  const ops = Array.isArray(body.ops) ? body.ops : [];
  if (!ops.length) throw new Error('暂存队列是空的');
  const data = (await readRepoJson(RP('site.config.json'))) || { json: {} };
  const cfg = data.json;
  for (const op of ops) {
    const sectionData = JSON.parse(JSON.stringify(op.data || {}));
    if (SECRET_KEYS[op.section]) SECRET_KEYS[op.section].forEach(k => delete sectionData[k]);
    cfg[op.section] = sectionData;
  }
  await commitFiles([{ path: RP('site.config.json'), contentBase64: b64(cfg) }], 'CMS: 更新站点设置');
  return { applied: ops.map(o => o.label || o.section) };
}
async function opUpload(body) {
  const dir = body.dir || 'images/posts';
  if (!UPLOAD_DIRS[dir]) throw new Error('不允许的上传目录: ' + dir);
  const safeName = (body.filename || 'file').split(/[\\/]/).pop().replace(/[^\w.一-龥-]/g, '_');
  const m = /^data:([^;]+);base64,(.*)$/s.exec(body.base64 || '');
  const raw = m ? m[2] : (body.base64 || '');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length === 0) throw new Error('文件为空');
  if (buf.length > MAX_FILE_BYTES) throw new Error('线上单文件不能超过 4MB，大文件（视频/压缩包/EXE）请在本地编辑或使用图床');
  const name = Date.now().toString(36) + '_' + safeName;
  const relPath = RP(dir + '/' + name);
  await commitFiles([{ path: relPath, contentBase64: raw }], 'CMS: 上传 ' + safeName);
  return { url: '/' + relPath, name: safeName, size: buf.length };
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const doWhat = (req.query && req.query.do) || '';
  // 只读类：管理端全量数据（含草稿），同样需要登录
  const user = await authenticate(req, res);
  if (!user) return;
  try {
    const body = req.method === 'POST' ? await readBody(req) : {};
    let result = {};
    switch (doWhat) {
      case 'admin-posts': {
        const d = await readRepoJson(RP('data/posts.json'));
        result = { posts: d ? d.json.posts : [] }; break;
      }
      case 'admin-collection': {
        const f = COLLECTION_FILES[body.name];
        if (!f) throw new Error('未知集合');
        const d = await readRepoJson(f);
        result = { items: d ? d.json.items : [] }; break;
      }
      case 'config-get': {
        const d = await readRepoJson(RP('site.config.json'));
        result = { config: d ? d.json : {} }; break;
      }
      case 'packages': {
        // 列 packages/ 下每个演示包的 meta.json
        const list = [];
        const rr = await gh(RP('packages'));
        if (rr.ok) {
          const dirs = await rr.json();
          for (const dir of Array.isArray(dirs) ? dirs : []) {
            if (dir.type !== 'dir') continue;
            const m = await readRepoJson(RP('packages/' + dir.name + '/meta.json'));
            if (m) list.push({ id: dir.name, ...m.json });
          }
        }
        result = { packages: list }; break;
      }
      case 'post-save': result = await opPostSave(body); break;
      case 'post-delete': result = await opPostDelete(body); break;
      case 'collection-save': result = await opCollectionSave(body); break;
      case 'collection-delete': result = await opCollectionDelete(body); break;
      case 'layout-save': result = await opLayoutSave(body); break;
      case 'pet-save': result = await opPetSave(body); break;
      case 'config-apply': result = await opConfigApply(body); break;
      case 'upload': result = await opUpload(body); break;
      case 'comments-delete': result = await opCollectionDelete({ name: 'comments', id: body.id }); break;
      default: return res.status(404).json({ ok: false, error: '未知 CMS 操作: ' + doWhat });
    }
    res.status(200).json({ ok: true, ...result, deployedIn: '约 1-2 分钟后线上生效' });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
};
