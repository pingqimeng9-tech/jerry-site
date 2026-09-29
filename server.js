// ============================================================
// Jerry CMS 本地服务（零依赖，纯 Node http）
// 启动：node server.js   或   双击 start-jerry-cms.bat
// 职责：托管整站 + 文章接口 + 媒体/网站包上传 + Git 一键推送
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');   // 站点发布根：访客可见的页面/资源/数据/后台全部在此目录
const DATA_DIR = path.join(SITE, 'data');
const STORE = path.join(DATA_DIR, 'posts.json');
const DEPLOY_CFG = path.join(DATA_DIR, 'deploy_config.json');
const SITE_CFG = path.join(DATA_DIR, 'site_config.json');          // 全量设置（含密钥，仅本地）
const SITE_CFG_PUBLIC = path.join(SITE, 'site.config.json');       // 对外公开子集（静态文件，线上也能读）
const QUEUE_STORE = path.join(DATA_DIR, 'staging_queue.json');     // 操作暂存队列
const NOTION_CFG = path.join(DATA_DIR, 'notion_config.json');     // Notion 同步配置（含 token，仅本地，已 gitignore）
const UPLOAD_DIR = path.join(SITE, 'images', 'posts');
const PORT = process.env.PORT || 5858;

// 各内容模块的 JSON 存储文件（data/<name>.json，{items:[]} 结构）
const COLLECTIONS = {
  moments:  { file: 'moments.json',  label: '说说' },
  friends:  { file: 'friends.json',  label: '友链' },
  projects: { file: 'projects.json', label: '项目' },
  albums:   { file: 'albums.json',   label: '相册' },
  comments: { file: 'comments.json', label: '评论' }
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mov': 'video/quicktime', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.zip': 'application/zip',
  // 附件常见类型
  '.7z': 'application/x-7z-compressed', '.rar': 'application/vnd.rar',
  '.gz': 'application/gzip', '.tar': 'application/x-tar',
  '.exe': 'application/vnd.microsoft.portable-executable', '.msi': 'application/x-ms-installer',
  '.apk': 'application/vnd.android.package-archive', '.iso': 'application/x-iso9660-image',
  '.dmg': 'application/x-apple-diskimage', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

// ---------- 数据读写 ----------
function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); }
  catch (e) { return { posts: [] }; }
}
function writeStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(store, null, 2), 'utf8');
}
function readDeployConfig() {
  const def = { repoUrl: '', branch: 'main', commitMsg: 'Update pages & posts via Jerry CMS', siteUrl: 'https://callmiruko.cc' };
  try { return { ...def, ...JSON.parse(fs.readFileSync(DEPLOY_CFG, 'utf8')) }; }
  catch (e) { return def; }
}
function nowStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function slugify(s) {
  return (s || 'post').toString().trim().toLowerCase()
    .replace(/[\s\u3000]+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 48);
}
function publicPost(p) {
  return { id: p.id, title: p.title, date: p.date, category: p.category,
           excerpt: p.excerpt || p.summary || '', views: p.views || 0, cover: p.cover || null, thumb: p.thumb || null };
}
function readBody(req, limit) {
  limit = limit || 8e6;
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > limit) req.destroy(); });
    req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { rej(e); } });
    req.on('error', rej);
  });
}
function send(res, code, obj) {
  res.writeHead(code, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function run(cmd, cwd, timeoutMs) {
  return new Promise(res => {
    exec(cmd, { cwd: cwd || ROOT, windowsHide: true, timeout: timeoutMs || 120000, maxBuffer: 2e6 }, (err, stdout, stderr) => {
      res({ code: err ? (err.code || 1) : 0, out: ((stdout || '') + (stderr || '')).trim() });
    });
  });
}
function gitRun(cmd, timeoutMs) { return run('git ' + cmd, ROOT, timeoutMs); }
function readNotionConfig() {
  try { return JSON.parse(fs.readFileSync(NOTION_CFG, 'utf8').replace(/^﻿/, '')); }
  catch (e) { return { token: '', databaseId: '' }; }
}
function writeNotionConfig(cfg) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(NOTION_CFG, JSON.stringify({ token: (cfg.token || '').trim(), databaseId: (cfg.databaseId || '').trim() }, null, 2), 'utf8');
}
// 调 scripts/notion-sync.mjs 子进程（mode: preview | sync），解析结果 JSON
function runNotionSync(mode, timeoutMs) {
  return new Promise(resolve => {
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'notion-sync.mjs'), '--mode=' + mode], {
      cwd: SITE, windowsHide: true, env: process.env
    });
    let out = '', err = '';
    const timer = setTimeout(() => { try { child.kill(); } catch (e) {} resolve({ ok: false, error: '同步超时（超过 ' + Math.round(timeoutMs / 1000) + ' 秒）' }); }, timeoutMs);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => {
      clearTimeout(timer);
      const line = out.split(/\r?\n/).find(l => l.startsWith('__NOTION_SYNC_RESULT__'));
      if (!line) return resolve({ ok: false, error: '同步脚本没有返回结果', log: (err + out).slice(-2000) });
      try { resolve(JSON.parse(line.slice('__NOTION_SYNC_RESULT__'.length))); }
      catch (e) { resolve({ ok: false, error: '解析同步结果失败: ' + e.message, log: (err + out).slice(-2000) }); }
    });
    child.on('error', e => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}
// Git 发布核心（路由与 Notion 同步后自动发布共用）
async function publishToGit() {
  const cfg = readDeployConfig();
  const repoUrl = (cfg.repoUrl || '').trim();
  const branch = (cfg.branch || 'main').trim();
  const msg = (cfg.commitMsg || 'Update pages & posts via Jerry CMS').replace(/"/g, '');
  if (!repoUrl) return { ok: false, error: '未配置仓库地址，请先在设置页填写并保存' };
  const log = [];
  let r = await gitRun('rev-parse --is-inside-work-tree');
  if (!(r.code === 0 && r.out === 'true')) return { ok: false, error: '该目录还不是 Git 仓库，请先点「初始化仓库」', log: [r.out] };
  log.push('> git add -A');
  r = await gitRun('add -A'); log.push(r.out || '(done)');
  log.push('> git commit -m "' + msg + '"');
  r = await gitRun('commit -m "' + msg + '"');
  log.push(r.out || '(done)');
  log.push('> git remote 同步 origin');
  const hasRemote = await gitRun('remote get-url origin');
  r = hasRemote.code === 0 ? await gitRun('remote set-url origin "' + repoUrl + '"') : await gitRun('remote add origin "' + repoUrl + '"');
  log.push(r.out || '(done)');
  log.push('> git push origin HEAD:' + branch);
  r = await gitRun('push origin HEAD:' + branch, 600000);
  log.push(r.out || '(ok)');
  if (r.code !== 0 && !/Everything up-to-date/i.test(r.out)) {
    if (/denied/i.test(r.out)) return { ok: false, error: '推送被拒：当前凭据没有该仓库的写权限', log };
    return { ok: false, error: '推送失败：' + r.out, log };
  }
  const syncStore = readStore();
  const syncTime = nowStr();
  syncStore.posts.forEach(function (p) { if (p.status === 'published') p.syncedAt = syncTime; });
  writeStore(syncStore);
  return { ok: true, upToDate: /Everything up-to-date/i.test(r.out), log };
}

// ---------- 站点设置（site_config）与暂存队列 ----------
function defaultSiteConfig() {
  return {
    profile: {
      siteName: 'JERRY.DEV', navAfter: '', authorName: 'Jerry', bio: '',
      avatarUrl: '', defaultPostCover: '',
      social: { github: '', gitee: '', email: '', qq: '', wechat: '', bilibili: '' },
      navigation: [
        { label: '说说', href: '/moments.html' },
        { label: '时间线', href: '/timeline.html' },
        { label: '友链', href: '/friends.html' },
        { label: '项目', href: '/projects.html' },
        { label: '照片墙', href: '/photowall.html' }
      ]
    },
    background: { useGradient: true, bgImages: [], effect: 'none' }, // effect: none|sakura|snow|fireflies
    danmaku: { enabled: false, texts: [], speed: 12, opacity: 0.5 },
    aiCat: {
      enabled: true, name: '小猫', greeting: '喵？找我什么事~',
      provider: 'gemini', apiBase: '', apiKey: '', model: 'gemini-2.0-flash',
      systemPrompt: '你是博主Jerry的猫娘助理，回答亲切可爱，偶尔带"喵"。不知道的问题就撒娇卖萌。'
    },
    comment: { provider: 'local', gitalk: { clientID: '', clientSecret: '', repo: '', owner: '' } },
    picBed: { type: 'local', apiBase: 'https://7bu.top', token: '' }, // type: local|lsky
    music: { enabled: true, playerTitle: 'BGM', songIds: [], defaultVolume: 0.5 },
    footer: { text: '© JERRY.DEV · 用热爱发电', links: [], beian: '' },
    gallery: { intro: '用镜头记录生活的碎片', columns: 3 }
  };
}
// 公开子集：绝不含 apiKey / token，写成静态 site.config.json 供线上静态站读取
// 注意：Gitalk 的 clientSecret 必须在前端使用（Gitalk 本身的设计），予以保留
function publicConfig(cfg) {
  const p = JSON.parse(JSON.stringify(cfg));
  if (p.aiCat) { delete p.aiCat.apiKey; delete p.aiCat.apiBase; }
  if (p.picBed) delete p.picBed.token;
  return p;
}
function readSiteConfig() {
  try { return { ...defaultSiteConfig(), ...JSON.parse(fs.readFileSync(SITE_CFG, 'utf8')) }; }
  catch (e) { return defaultSiteConfig(); }
}
function writeSiteConfig(cfg) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SITE_CFG, JSON.stringify(cfg, null, 2), 'utf8');
  fs.writeFileSync(SITE_CFG_PUBLIC, JSON.stringify(publicConfig(cfg), null, 2), 'utf8');
}
function readQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_STORE, 'utf8')); }
  catch (e) { return { ops: [] }; }
}
function writeQueue(q) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_STORE, JSON.stringify(q, null, 2), 'utf8');
}

// ---------- 通用集合存储（moments/friends/projects/albums/comments）----------
function readCollection(name) {
  const def = COLLECTIONS[name];
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, def.file), 'utf8')); }
  catch (e) { return { items: [] }; }
}
function writeCollection(name, store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, COLLECTIONS[name].file), JSON.stringify(store, null, 2), 'utf8');
}

// 用 https 上传图床 / 调 AI（零依赖版 fetch，纯 JSON 请求）
function httpsJson(method, urlStr, headers, body, timeoutMs) {
  return new Promise((res, rej) => {
    const u = new URL(urlStr);
    const mod = u.protocol === 'http:' ? require('http') : require('https');
    const data = body == null ? null : (typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
    const req = mod.request({ hostname: u.hostname, port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search, method: method || 'GET',
      headers: { ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } },
      r => {
        let b = '';
        r.on('data', c => { b += c; if (b.length > 4e6) r.destroy(); });
        r.on('end', () => res({ status: r.statusCode, text: b }));
      });
    req.on('error', rej);
    req.setTimeout(timeoutMs || 30000, () => { req.destroy(new Error('请求超时')); });
    if (data) req.write(data);
    req.end();
  });
}
// 构造 multipart/form-data（Lsky Pro 图床上传用）
function multipartBody(fields, fileField, filename, fileBuf, mime) {
  const B = '----jerryboundary' + Date.now().toString(16);
  const parts = [];
  for (const [k, v] of Object.entries(fields || {})) {
    parts.push(Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${mime || 'application/octet-stream'}\r\n\r\n`));
  parts.push(fileBuf, Buffer.from(`\r\n--${B}--\r\n`));
  return { body: Buffer.concat(parts), contentType: 'multipart/form-data; boundary=' + B };
}

// ---------- API ----------
async function handleApi(req, res, pathname) {
  // 公开列表（仅已发布，供 blog.html）
  if (req.method === 'GET' && pathname === '/api/posts') {
    const store = readStore();
    return send(res, 200, { ok: true, posts: store.posts.filter(p => p.status === 'published').map(publicPost) });
  }
  // 单篇
  if (req.method === 'GET' && pathname === '/api/post') {
    const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
    const p = readStore().posts.find(x => x.id === id);
    if (!p) return send(res, 200, { ok: false, error: '文章不存在' });
    return send(res, 200, { ok: true, post: { id: p.id, title: p.title, date: p.date, category: p.category,
      views: p.views || 0, cover: p.cover || null, excerpt: p.excerpt || '', status: p.status,
      markdown: p.markdown || '', tags: p.tags || [], mood: p.mood || '' } });
  }
  // 管理端全量列表
  if (req.method === 'POST' && pathname === '/api/admin/posts') {
    return send(res, 200, { ok: true, posts: readStore().posts.map(p => ({ ...p, syncedAt: p.syncedAt || '', thumb: p.thumb || '' })) });
  }

  // 页面布局配置：读取 / 保存（data/layout_config.json，随仓库上线，不含密钥）
  const LAYOUT_CFG = path.join(DATA_DIR, 'layout_config.json');
  if (req.method === 'GET' && pathname === '/api/layout/config') {
    try { return send(res, 200, { ok: true, config: JSON.parse(fs.readFileSync(LAYOUT_CFG, 'utf8')) }); }
    catch (e) { return send(res, 200, { ok: true, config: null }); }
  }
  if (req.method === 'POST' && pathname === '/api/layout/config') {
    const body = await readBody(req).catch(() => ({}));
    if (!body || typeof body !== 'object') return send(res, 400, { ok: false, error: '配置格式错误' });
    if (body.format !== 'jerry-layout/v1') return send(res, 400, { ok: false, error: 'format 必须为 jerry-layout/v1' });
    if (!body.pages || typeof body.pages !== 'object') return send(res, 400, { ok: false, error: 'pages 必须是对象' });
    for (const [pk, pc] of Object.entries(body.pages)) {
      if (!Array.isArray(pc.modules)) return send(res, 400, { ok: false, error: '页面 ' + pk + ' 的 modules 必须是数组' });
      for (const m of pc.modules) if (!m.id) return send(res, 400, { ok: false, error: '页面 ' + pk + ' 存在缺少 id 的模块' });
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LAYOUT_CFG, JSON.stringify(body, null, 2), 'utf8');
    return send(res, 200, { ok: true });
  }

  // 桌宠动作包：读取 / 保存（data/pet_packs.json，随仓库上线，不含密钥）
  const PET_PACKS = path.join(DATA_DIR, 'pet_packs.json');
  if (req.method === 'GET' && pathname === '/api/pet/packs') {
    try { return send(res, 200, { ok: true, config: JSON.parse(fs.readFileSync(PET_PACKS, 'utf8')) }); }
    catch (e) { return send(res, 200, { ok: true, config: { format: 'jerry-pet-pack/v1', settings: { aiChat: false }, packs: [] } }); }
  }
  if (req.method === 'POST' && pathname === '/api/pet/packs') {
    const body = await readBody(req).catch(() => ({}));
    if (!body || typeof body !== 'object') return send(res, 400, { ok: false, error: '配置格式错误' });
    if (body.format !== 'jerry-pet-pack/v1') return send(res, 400, { ok: false, error: 'format 必须为 jerry-pet-pack/v1' });
    if (!Array.isArray(body.packs)) return send(res, 400, { ok: false, error: 'packs 必须是数组' });
    // 轻量校验：每个 action 至少有 id 和 frames
    for (const p of body.packs) {
      for (const a of (p.actions || [])) {
        if (!a.id) return send(res, 400, { ok: false, error: '存在缺少 id 的动作' });
        if (a.frames != null && !Array.isArray(a.frames)) return send(res, 400, { ok: false, error: '动作 ' + a.id + ' 的 frames 必须是数组' });
      }
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PET_PACKS, JSON.stringify(body, null, 2), 'utf8');
    return send(res, 200, { ok: true });
  }
  // 浏览量 +1
  if (req.method === 'POST' && pathname === '/api/view') {
    const body = await readBody(req).catch(() => ({}));
    const store = readStore();
    const p = store.posts.find(x => x.id === body.id);
    if (!p) return send(res, 200, { ok: false, error: '文章不存在' });
    p.views = (p.views || 0) + 1;
    writeStore(store);
    return send(res, 200, { ok: true, views: p.views });
  }
  // 保存（新建 / 更新）
  if (req.method === 'POST' && (pathname === '/api/post/save' || pathname === '/api/posts/save')) {
    const body = await readBody(req).catch(() => ({}));
    const store = readStore();
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
    post.syncedAt = '';   // 内容变更，标记待推送
    if (body.thumb) post.thumb = (body.thumb || '').trim();
    store.posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    writeStore(store);
    return send(res, 200, { ok: true, id: post.id, status: post.status });
  }
  // 删除
  if (req.method === 'POST' && pathname === '/api/post/delete') {
    const body = await readBody(req).catch(() => ({}));
    const store = readStore();
    store.posts = store.posts.filter(x => x.id !== body.id);
    writeStore(store);
    return send(res, 200, { ok: true });
  }
  // 媒体上传（图片→images/posts/，视频→videos/posts/）
  if (req.method === 'POST' && pathname === '/api/upload') {
    const body = await readBody(req, 120e6).catch(() => ({}));
    if (!body.base64 || !body.filename) return send(res, 400, { ok: false, error: '缺少文件' });
    const safeName = path.basename(body.filename).replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
    const m = /^data:([^;]+);base64,(.*)$/s.exec(body.base64);
    const b64 = m ? m[2] : body.base64;
    const isVideo = /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(safeName);
    // dir 参数：允许上传到 images/posts、images/albums、images/bg（白名单，防路径穿越）
    const allowedDirs = { 'images/posts': UPLOAD_DIR, 'images/albums': path.join(SITE, 'images', 'albums'), 'images/bg': path.join(SITE, 'images', 'bg'), 'images/pet': path.join(SITE, 'images', 'pet') };
    let dir = isVideo ? path.join(SITE, 'videos', 'posts') : (allowedDirs[body.dir] || UPLOAD_DIR);
    const relDir = isVideo ? 'videos/posts' : (allowedDirs[body.dir] ? body.dir : 'images/posts');
    const name = Date.now().toString(36) + '_' + safeName;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), Buffer.from(b64, 'base64'));
    const url = '/' + relDir + '/' + name;
    return send(res, 200, { ok: true, url, kind: isVideo ? 'video' : 'image' });
  }
  // 附件上传（任意格式：zip/exe/7z/pdf/图片/文档… → files/posts/，供文章内下载）
  if (req.method === 'POST' && pathname === '/api/attachment/upload') {
    const body = await readBody(req, 300e6).catch(() => ({}));
    if (!body.base64 || !body.filename) return send(res, 400, { ok: false, error: '缺少文件' });
    const safeName = path.basename(body.filename).replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
    const m = /^data:([^;]+);base64,(.*)$/s.exec(body.base64);
    const b64 = m ? m[2] : body.base64;
    const dir = path.join(SITE, 'files', 'posts');
    fs.mkdirSync(dir, { recursive: true });
    const name = Date.now().toString(36) + '_' + safeName;
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(path.join(dir, name), buf);
    const ext = path.extname(safeName).toLowerCase().replace(/^\./, '');
    const fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
    return send(res, 200, { ok: true, url: '/files/posts/' + name, name: safeName, size: buf.length, sizeText: fmtSize(buf.length), ext });
  }
  // 网站包上传（zip 解压 或 单个 html，供文章内实时预览）
  if (req.method === 'POST' && pathname === '/api/package/upload') {
    const body = await readBody(req, 160e6).catch(() => ({}));
    if (!body.base64 || !body.filename) return send(res, 400, { ok: false, error: '缺少文件' });
    const isZip = /\.zip$/i.test(body.filename);
    const isHtml = /\.(html|htm)$/i.test(body.filename);
    if (!isZip && !isHtml) return send(res, 400, { ok: false, error: '只支持 .zip 网站包或单个 .html 文件' });
    const safeName = path.basename(body.filename).replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
    const id = 'pkg_' + Date.now().toString(36);
    const pkgDir = path.join(SITE, 'packages', id);
    const siteDir = path.join(pkgDir, 'site');
    fs.mkdirSync(siteDir, { recursive: true });
    let entry = 'index.html';
    const pkgM = /^data:([^;]+);base64,(.*)$/s.exec(body.base64);
    const pkgB64 = pkgM ? pkgM[2] : body.base64;
    if (isHtml) {
      fs.writeFileSync(path.join(siteDir, 'index.html'), Buffer.from(pkgB64, 'base64'));
    } else {
      const zipPath = path.join(pkgDir, 'pkg.zip');
      fs.writeFileSync(zipPath, Buffer.from(pkgB64, 'base64'));
      let r = await run('tar -xf "' + zipPath + '" -C "' + siteDir + '"');
      if (r.code !== 0) {
        const ps = 'Expand-Archive -LiteralPath "' + zipPath + '" -DestinationPath "' + siteDir + '" -Force';
        r = await run('powershell -NoProfile -Command "' + ps + '"');
      }
      if (r.code !== 0) return send(res, 200, { ok: false, error: '解压失败: ' + r.out });
      entry = null;
      (function scan(dir, depth, rel) {
        if (entry || depth > 4) return;
        for (const f of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          if (f.isDirectory()) scan(path.join(dir, f.name), depth + 1, rel + f.name + '/');
          else if (/\.html?$/i.test(f.name)) { if (!entry || (f.name.toLowerCase() === 'index.html' && depth <= 1)) entry = rel + f.name; }
        }
      })(siteDir, 0, '');
      if (!entry) { fs.rmSync(pkgDir, { recursive: true, force: true }); return send(res, 200, { ok: false, error: '压缩包里没有找到任何 HTML 文件' }); }
    }
    const name = safeName.replace(/\.(zip|html|htm)$/i, '');
    const meta = { name, entry: '/packages/' + id + '/site/' + entry,
      zip: isZip ? '/packages/' + id + '/pkg.zip' : '', kind: isZip ? 'zip' : 'html', date: nowStr() };
    fs.writeFileSync(path.join(pkgDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
    return send(res, 200, { ok: true, id, ...meta });
  }
  // 已有网站包列表
  if (req.method === 'GET' && pathname === '/api/packages') {
    const dir = path.join(SITE, 'packages');
    const out = [];
    if (fs.existsSync(dir)) {
      for (const d of fs.readdirSync(dir)) {
        try { out.push({ id: d, ...JSON.parse(fs.readFileSync(path.join(dir, d, 'meta.json'), 'utf8')) }); } catch (e) {}
      }
    }
    return send(res, 200, { ok: true, packages: out });
  }

  // ---- Git 推送 ----
  if (pathname === '/api/deploy/config' && req.method === 'GET') {
    return send(res, 200, { ok: true, config: readDeployConfig() });
  }
  if (pathname === '/api/deploy/config' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    const cfg = {
      repoUrl: (body.repoUrl || '').trim(),
      branch: ((body.branch || '').trim() || 'main'),
      commitMsg: (body.commitMsg || '').trim() || 'Update pages & posts via Jerry CMS',
      siteUrl: (body.siteUrl || '').trim() || 'https://callmiruko.cc'
    };
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DEPLOY_CFG, JSON.stringify(cfg, null, 2), 'utf8');
    return send(res, 200, { ok: true });
  }
  if (pathname === '/api/deploy/check' && req.method === 'POST') {
    const isGit = await gitRun('rev-parse --is-inside-work-tree');
    const inside = isGit.code === 0 && isGit.out === 'true';
    const remote = inside ? await gitRun('remote get-url origin') : { code: 1, out: '' };
    const branch = inside ? await gitRun('rev-parse --abbrev-ref HEAD') : { code: 1, out: '' };
    const status = inside ? await gitRun('status --porcelain') : { code: 1, out: '' };
    const files = status.out ? status.out.split('\n').filter(Boolean).map(l => ({ x: l.slice(0, 2), f: l.slice(3).trim() })) : [];
    return send(res, 200, { ok: true, git: inside, hasRemote: remote.code === 0,
      remoteUrl: remote.out, currentBranch: branch.out,
      pendingChanges: files.length, pendingFiles: files });
  }
  if (pathname === '/api/deploy/init' && req.method === 'POST') {
    const cfg = readDeployConfig();
    const repoUrl = (cfg.repoUrl || '').trim();
    if (!repoUrl) return send(res, 200, { ok: false, error: '请先填写仓库地址并保存' });
    const log = [];
    let r = await gitRun('init');
    log.push('> git init'); log.push(r.out || '(ok)');
    if (r.code !== 0) return send(res, 200, { ok: false, error: 'git init 失败', log });
    const hasRemote = await gitRun('remote get-url origin');
    r = hasRemote.code === 0 ? await gitRun('remote set-url origin "' + repoUrl + '"') : await gitRun('remote add origin "' + repoUrl + '"');
    log.push('> git remote 绑定 origin'); log.push(r.out || '(ok)');
    return send(res, 200, { ok: r.code === 0, error: r.code === 0 ? '' : r.out, log });
  }
  if (pathname === '/api/deploy/publish' && req.method === 'POST') {
    const result = await publishToGit();
    return send(res, 200, result);
  }

  // ==================== Notion 同步 ====================
  // 读取配置（token 只回传掩码，不明文下发）
  if (pathname === '/api/notion/config' && req.method === 'GET') {
    const cfg = readNotionConfig();
    const token = cfg.token || '';
    return send(res, 200, {
      ok: true,
      configured: !!(token && cfg.databaseId),
      databaseId: cfg.databaseId || '',
      tokenMask: token ? token.slice(0, 6) + '••••••' + token.slice(-4) : ''
    });
  }
  // 保存配置（token 留空表示不修改）
  if (pathname === '/api/notion/config' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    const cfg = readNotionConfig();
    if (body.databaseId !== undefined) cfg.databaseId = String(body.databaseId).trim();
    if (body.token) cfg.token = String(body.token).trim();
    if (!cfg.token || !cfg.databaseId) return send(res, 200, { ok: false, error: 'Token 和数据库 ID 都不能为空' });
    writeNotionConfig(cfg);
    return send(res, 200, { ok: true });
  }
  // 预览变更（不拉正文不下载，通常几秒）
  if (pathname === '/api/notion/preview' && req.method === 'POST') {
    const cfg = readNotionConfig();
    if (!cfg.token || !cfg.databaseId) return send(res, 200, { ok: false, error: '请先填写并保存 Notion Token 与数据库 ID' });
    const result = await runNotionSync('preview', 180000);
    return send(res, 200, result);
  }
  // 正式同步；{publish:true} 同步成功后自动发布上线
  if (pathname === '/api/notion/sync' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    const cfg = readNotionConfig();
    if (!cfg.token || !cfg.databaseId) return send(res, 200, { ok: false, error: '请先填写并保存 Notion Token 与数据库 ID' });
    const result = await runNotionSync('sync', 900000);
    if (result.ok === false) return send(res, 200, result);
    if (body.publish && result.synced > 0) {
      result.publish = await publishToGit();
    } else if (body.publish) {
      result.publish = { ok: true, upToDate: true, skipped: true, log: ['没有内容变化，跳过发布'] };
    }
    return send(res, 200, result);
  }
  if (pathname === '/api/deploy/adopt' && req.method === 'POST') {
    const cfg = readDeployConfig();
    const repoUrl = (cfg.repoUrl || '').trim();
    const branch = (cfg.branch || 'main').trim();
    if (!repoUrl) return send(res, 200, { ok: false, error: '未配置仓库地址，请先在上方填写并保存' });
    const log = [];
    let r = await gitRun('rev-parse --is-inside-work-tree');
    if (!(r.code === 0 && r.out === 'true')) { r = await gitRun('init'); log.push('> git init'); log.push(r.out || '(ok)'); }
    const head = await gitRun('rev-parse --verify HEAD');
    if (head.code !== 0) {
      log.push('> git add -A + 首次提交');
      await gitRun('add -A');
      r = await gitRun('commit -m "Initial import via Jerry CMS"');
      log.push(r.out || '(ok)');
    }
    log.push('> git remote 绑定 origin');
    const hasRemote = await gitRun('remote get-url origin');
    r = hasRemote.code === 0 ? await gitRun('remote set-url origin "' + repoUrl + '"') : await gitRun('remote add origin "' + repoUrl + '"');
    log.push(r.out || '(ok)');
    log.push('> git fetch origin');
    r = await gitRun('fetch origin', 600000);
    log.push(r.out || '(ok)');
    if (r.code !== 0) return send(res, 200, { ok: false, error: 'fetch 失败：请检查仓库地址、网络与 SSH Key', log });
    const remoteHas = await gitRun('rev-parse --verify --quiet origin/' + branch);
    if (remoteHas.code !== 0) {
      log.push('远端分支 ' + branch + ' 为空，走普通首推');
      await gitRun('add -A');
      r = await gitRun('commit -m "Take over remote: sync local new version via Jerry CMS"');
      log.push(r.out || '(nothing to commit)');
      log.push('> git push -u origin HEAD:' + branch);
      r = await gitRun('push -u origin HEAD:' + branch, 600000);
      log.push(r.out || '(ok)');
      if (r.code !== 0 && !/Everything up-to-date/i.test(r.out)) return send(res, 200, { ok: false, error: '首推失败：' + r.out, log });
      return send(res, 200, { ok: true, mode: 'initial', log });
    }
    log.push('> git reset --mixed origin/' + branch + '（保留远端历史，以本地文件为准）');
    r = await gitRun('reset --mixed origin/' + branch);
    log.push(r.out || '(ok)');
    log.push('> git add -A');
    await gitRun('add -A');
    log.push('> git commit（差异 = 新版 vs 旧版）');
    r = await gitRun('commit -m "Take over remote: sync local new version via Jerry CMS"');
    log.push(r.out || '(nothing to commit)');
    if (r.code !== 0 && !/nothing to commit/i.test(r.out)) return send(res, 200, { ok: false, error: '提交失败：' + r.out, log });
    log.push('> git push origin HEAD:' + branch);
    r = await gitRun('push origin HEAD:' + branch, 600000);
    log.push(r.out || '(ok)');
    if (r.code !== 0 && !/Everything up-to-date/i.test(r.out)) return send(res, 200, { ok: false, error: '推送失败：' + r.out, log });
    return send(res, 200, { ok: true, mode: 'adopt', log });
  }

  // ==================== 站点设置 + 暂存队列 ====================
  // 管理端读全量配置 + 队列
  if (req.method === 'GET' && pathname === '/api/config') {
    return send(res, 200, { ok: true, config: readSiteConfig(), queue: readQueue().ops });
  }
  // 暂存一个分区操作：{section, label, data}
  if (req.method === 'POST' && pathname === '/api/config/stage') {
    const body = await readBody(req).catch(() => ({}));
    if (!body.section || !body.data) return send(res, 400, { ok: false, error: '缺少 section/data' });
    const q = readQueue();
    // 同一分区重复暂存 → 覆盖旧操作（队列里每个分区只保留最新意图）
    q.ops = q.ops.filter(o => o.section !== body.section);
    q.ops.push({ id: 'op_' + Date.now().toString(36), section: body.section,
      label: body.label || body.section, data: body.data, time: nowStr() });
    writeQueue(q);
    return send(res, 200, { ok: true, queue: q.ops });
  }
  // 撤销一条 / 清空队列
  if (req.method === 'POST' && pathname === '/api/config/stage/remove') {
    const body = await readBody(req).catch(() => ({}));
    const q = readQueue();
    q.ops = q.ops.filter(o => o.id !== body.id);
    writeQueue(q);
    return send(res, 200, { ok: true, queue: q.ops });
  }
  if (req.method === 'POST' && pathname === '/api/config/stage/clear') {
    writeQueue({ ops: [] });
    return send(res, 200, { ok: true, queue: [] });
  }
  // 更新本地：把队列里所有操作合并进 site_config.json，并生成公开 site.config.json
  if (req.method === 'POST' && pathname === '/api/config/apply') {
    const q = readQueue();
    if (!q.ops.length) return send(res, 200, { ok: false, error: '暂存队列是空的' });
    const cfg = readSiteConfig();
    const applied = [];
    for (const op of q.ops) {
      cfg[op.section] = op.data;
      applied.push(op.label + '（' + op.section + '）');
    }
    writeSiteConfig(cfg);
    writeQueue({ ops: [] });
    return send(res, 200, { ok: true, applied, queue: [] });
  }

  // ==================== 内容集合：moments / friends / projects / albums / comments ====================
  // 公开列表
  if (req.method === 'GET' && /^\/api\/(moments|friends|projects|albums)$/.test(pathname)) {
    const name = pathname.split('/')[2];
    const store = readCollection(name);
    return send(res, 200, { ok: true, items: store.items });
  }
  // 管理端全量（将来若有草稿态可在此扩展）
  if (req.method === 'POST' && pathname === '/api/admin/collection') {
    const body = await readBody(req).catch(() => ({}));
    const name = body.name;
    if (!COLLECTIONS[name]) return send(res, 400, { ok: false, error: '未知集合' });
    return send(res, 200, { ok: true, items: readCollection(name).items });
  }
  // 保存（新建/更新）
  if (req.method === 'POST' && pathname === '/api/collection/save') {
    const body = await readBody(req, 30e6).catch(() => ({}));
    const name = body.name;
    if (!COLLECTIONS[name]) return send(res, 400, { ok: false, error: '未知集合' });
    const store = readCollection(name);
    let item = store.items.find(x => x.id === body.item?.id);
    if (!item) {
      item = { id: name.slice(0, 3) + '_' + Date.now().toString(36), createdAt: nowStr() };
      store.items.unshift(item);
    }
    Object.assign(item, body.item, { id: item.id, updatedAt: nowStr() });
    writeCollection(name, store);
    return send(res, 200, { ok: true, item });
  }
  // 删除
  if (req.method === 'POST' && pathname === '/api/collection/delete') {
    const body = await readBody(req).catch(() => ({}));
    const name = body.name;
    if (!COLLECTIONS[name]) return send(res, 400, { ok: false, error: '未知集合' });
    const store = readCollection(name);
    store.items = store.items.filter(x => x.id !== body.id);
    writeCollection(name, store);
    return send(res, 200, { ok: true });
  }
  // 评论：按 target 取（target 形如 post:<id> / moment:<id> / site:guestbook）
  if (req.method === 'GET' && pathname === '/api/comments') {
    const target = new URL(req.url, 'http://x').searchParams.get('target') || '';
    const store = readCollection('comments');
    return send(res, 200, { ok: true, items: store.items.filter(c => c.target === target) });
  }
  if (req.method === 'GET' && pathname === '/api/comments/all') {
    return send(res, 200, { ok: true, items: readCollection('comments').items });
  }
  if (req.method === 'POST' && pathname === '/api/comments/save') {
    const body = await readBody(req).catch(() => ({}));
    if (!body.target || !(body.text || '').trim()) return send(res, 400, { ok: false, error: '缺少评论内容' });
    const store = readCollection('comments');
    const item = { id: 'cmt_' + Date.now().toString(36), target: body.target,
      name: (body.name || '匿名').trim().slice(0, 24), text: body.text.trim().slice(0, 2000), date: nowStr() };
    store.items.unshift(item);
    writeCollection('comments', store);
    return send(res, 200, { ok: true, item });
  }
  if (req.method === 'POST' && pathname === '/api/comments/delete') {
    const body = await readBody(req).catch(() => ({}));
    const store = readCollection('comments');
    store.items = store.items.filter(x => x.id !== body.id);
    writeCollection('comments', store);
    return send(res, 200, { ok: true });
  }

  // ==================== 图床（Lsky Pro / 去不图床）====================
  // 探针测试 Token
  if (req.method === 'POST' && pathname === '/api/picbed/probe') {
    const cfg = readSiteConfig().picBed || {};
    if (cfg.type !== 'lsky' || !cfg.apiBase || !cfg.token) return send(res, 200, { ok: false, error: '请先把图床类型设为 Lsky Pro 并填写 API 地址与 Token' });
    try {
      const r = await httpsJson('GET', cfg.apiBase.replace(/\/$/, '') + '/api/v1/profile', { Authorization: 'Bearer ' + cfg.token });
      const j = JSON.parse(r.text || '{}');
      return send(res, 200, { ok: r.status === 200 && j.status, msg: j.message || ('HTTP ' + r.status), data: j.data ? { name: j.data.name, capacity: j.data.capacity } : null });
    } catch (e) { return send(res, 200, { ok: false, error: e.message }); }
  }
  // 上传到图床（失败可回退本地）：{base64, filename}
  if (req.method === 'POST' && pathname === '/api/picbed/upload') {
    const body = await readBody(req, 40e6).catch(() => ({}));
    if (!body.base64 || !body.filename) return send(res, 400, { ok: false, error: '缺少文件' });
    const cfg = readSiteConfig().picBed || {};
    const m = /^data:([^;]+);base64,(.*)$/s.exec(body.base64);
    const b64 = m ? m[2] : body.base64;
    const buf = Buffer.from(b64, 'base64');
    if (cfg.type !== 'lsky' || !cfg.apiBase || !cfg.token) {
      // 未配置图床 → 回退本地存储，行为与 /api/upload 一致
      const safeName = path.basename(body.filename).replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
      const name = Date.now().toString(36) + '_' + safeName;
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      return send(res, 200, { ok: true, url: '/images/posts/' + name, kind: 'image', via: 'local' });
    }
    try {
      const mp = multipartBody({ strategy_id: '' }, 'file', path.basename(body.filename), buf, m ? m[1] : 'image/png');
      const r = await httpsJson('POST', cfg.apiBase.replace(/\/$/, '') + '/api/v1/upload',
        { Authorization: 'Bearer ' + cfg.token, 'Content-Type': mp.contentType }, mp.body, 60000);
      const j = JSON.parse(r.text || '{}');
      if (r.status === 200 && j.status && j.data && j.data.url) return send(res, 200, { ok: true, url: j.data.url, kind: 'image', via: 'picbed' });
      return send(res, 200, { ok: false, error: '图床返回错误：' + (j.message || 'HTTP ' + r.status) });
    } catch (e) { return send(res, 200, { ok: false, error: e.message }); }
  }

  // ==================== AI 猫助理（Gemini / OpenAI 兼容）====================
  const assistDo = (new URL(req.url, 'http://x').searchParams.get('do')) || '';
  if (req.method === 'GET' && pathname === '/api/assist' && assistDo === 'ping') {
    const ai = readSiteConfig().aiCat || {};
    return send(res, 200, { ok: true, chatReady: !!(ai.enabled && ai.apiKey), musicReady: true });
  }
  if (req.method === 'POST' && (pathname === '/api/chat' || (pathname === '/api/assist' && assistDo === 'chat'))) {
    const body = await readBody(req, 2e6).catch(() => ({}));
    const ai = readSiteConfig().aiCat || {};
    if (!ai.enabled) return send(res, 200, { ok: false, error: 'AI 猫未开启' });
    const msgs = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const sys = ai.systemPrompt || '你是博主的猫娘助理。';
    try {
      let reply = '';
      if (ai.provider === 'gemini') {
        if (!ai.apiKey) return send(res, 200, { ok: false, error: '未配置 Gemini API Key（设置 → AI 猫）' });
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + (ai.model || 'gemini-2.0-flash') + ':generateContent?key=' + encodeURIComponent(ai.apiKey);
        const r = await httpsJson('POST', url, { 'Content-Type': 'application/json' }, {
          system_instruction: { parts: [{ text: sys }] },
          contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }))
        }, 45000);
        const j = JSON.parse(r.text || '{}');
        reply = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
        if (!reply) return send(res, 200, { ok: false, error: j.error?.message || ('Gemini 返回异常 HTTP ' + r.status) });
      } else {
        const base = (ai.apiBase || 'https://api.openai.com/v1').replace(/\/$/, '');
        if (!ai.apiKey) return send(res, 200, { ok: false, error: '未配置 API Key（设置 → AI 猫）' });
        const r = await httpsJson('POST', base + '/chat/completions', { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ai.apiKey }, {
          model: ai.model || 'gpt-4o-mini',
          messages: [{ role: 'system', content: sys }, ...msgs.map(m => ({ role: m.role, content: String(m.content || '') }))]
        }, 45000);
        const j = JSON.parse(r.text || '{}');
        reply = j.choices?.[0]?.message?.content || '';
        if (!reply) return send(res, 200, { ok: false, error: j.error?.message || ('接口返回异常 HTTP ' + r.status) });
      }
      return send(res, 200, { ok: true, reply });
    } catch (e) { return send(res, 200, { ok: false, error: e.message }); }
  }

  // ==================== 网易云音乐元数据代理 ====================
  if (req.method === 'GET' && (pathname === '/api/music' || (pathname === '/api/assist' && assistDo === 'music'))) {
    const ids = (new URL(req.url, 'http://x').searchParams.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return send(res, 200, { ok: true, songs: [] });
    try {
      const r = await httpsJson('GET', 'https://music.163.com/api/song/detail/?id=' + ids[0] + '&ids=' + encodeURIComponent('[' + ids.join(',') + ']'),
        { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com' }, null, 15000);
      const j = JSON.parse(r.text || '{}');
      const songs = (j.songs || []).map(s => ({
        id: s.id, name: s.name, artists: (s.artists || []).map(a => a.name).join(' / '),
        album: s.album?.name || '', pic: s.album?.blurPicUrl || s.album?.picUrl || '',
        url: 'https://music.163.com/song/media/outer/url?id=' + s.id + '.mp3'
      }));
      return send(res, 200, { ok: true, songs });
    } catch (e) { return send(res, 200, { ok: false, error: e.message, songs: [] }); }
  }

  // 背景图上传后自动重建 manifest（站点背景轮播读这个文件）
  if (req.method === 'POST' && pathname === '/api/bg/rebuild') {
    const dir = path.join(SITE, 'images', 'bg');
    const out = [];
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (/\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(f)) out.push(f);
      }
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(out, null, 2), 'utf8');
    return send(res, 200, { ok: true, count: out.length, files: out });
  }

  return send(res, 404, { ok: false, error: '未知接口 ' + pathname });
}

// ---------- 静态文件 ----------
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = path.normalize(path.join(SITE, rel));
  if (!filePath.startsWith(SITE)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found: ' + rel); }
    const ext = path.extname(filePath).toLowerCase();
    // 对 HTML 页面：自动注入 bridge.js（仅本地管理入口，线上无此逻辑）
    if (ext === '.html' || ext === '.htm') {
      let html = data.toString('utf8');
      // 不给 admin/ 页面注入（避免递归）
      if (!rel.startsWith('/admin/')) {
        const bridgeTag = '<script src="/admin/bridge.js"></script>';
        if (html.includes('</body>')) {
          html = html.replace('</body>', bridgeTag + '\n</body>');
        } else {
          html += bridgeTag;
        }
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] });
      return res.end(html, 'utf8');
    }
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // /files/ 下为文章附件：强制浏览器下载（PDF/图片等也不直接打开），文件名支持中文
    if (rel.startsWith('/files/')) {
      const baseName = path.basename(filePath).replace(/^[a-z0-9]+_/i, '');  // 去掉上传时加的时间戳前缀
      headers['Content-Disposition'] = "attachment; filename=\"" + encodeURIComponent(baseName).replace(/['()*]/g, '') + "\"; filename*=UTF-8''" + encodeURIComponent(baseName);
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    handleApi(req, res, u.pathname).catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }
  serveStatic(req, res, u.pathname);
});


// ---------- data/ 目录自动初始化（本地启动保障） ----------
(function initDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE)) writeStore({ posts: [] });
  if (!fs.existsSync(QUEUE_STORE)) writeQueue({ ops: [] });
  if (!fs.existsSync(DEPLOY_CFG)) {
    fs.writeFileSync(DEPLOY_CFG, JSON.stringify({
      repoUrl: '', branch: 'main',
      commitMsg: 'Jerry CMS: update', siteUrl: ''
    }, null, 2), 'utf8');
  }
  // site_config: 如果 data/ 里面没有，从根目录 site.config.json 复制一份
  if (!fs.existsSync(SITE_CFG) && fs.existsSync(SITE_CFG_PUBLIC)) {
    try {
      const pub = JSON.parse(fs.readFileSync(SITE_CFG_PUBLIC, 'utf8'));
      writeSiteConfig({ ...defaultSiteConfig(), ...pub });
    } catch (e) { writeSiteConfig(defaultSiteConfig()); }
  }
  // 其他集合文件
  for (const [name, def] of Object.entries(COLLECTIONS)) {
    const p = path.join(DATA_DIR, def.file);
    if (!fs.existsSync(p)) writeCollection(name, { items: [] });
  }
})();
server.listen(PORT, '0.0.0.0', () => {
  console.log('==========================================');
  console.log('  Jerry CMS 本地服务已启动');
  console.log('  整站   : http://127.0.0.1:' + PORT + '/');
  console.log('  控制台 : http://127.0.0.1:' + PORT + '/admin/index.html');
  console.log('  发布设置: http://127.0.0.1:' + PORT + '/admin/settings.html');
  console.log('==========================================');
});
