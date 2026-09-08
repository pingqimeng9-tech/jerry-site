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
const DATA_DIR = path.join(ROOT, 'data');
const STORE = path.join(DATA_DIR, 'posts.json');
const DEPLOY_CFG = path.join(DATA_DIR, 'deploy_config.json');
const UPLOAD_DIR = path.join(ROOT, 'images', 'posts');
const PORT = process.env.PORT || 5858;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mov': 'video/quicktime', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.zip': 'application/zip'
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
           excerpt: p.excerpt || p.summary || '', views: p.views || 0, cover: p.cover || null };
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
    return send(res, 200, { ok: true, posts: readStore().posts });
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
    const dir = isVideo ? path.join(ROOT, 'videos', 'posts') : UPLOAD_DIR;
    const name = Date.now().toString(36) + '_' + safeName;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), Buffer.from(b64, 'base64'));
    const url = isVideo ? '/videos/posts/' + name : '/images/posts/' + name;
    return send(res, 200, { ok: true, url, kind: isVideo ? 'video' : 'image' });
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
    const pkgDir = path.join(ROOT, 'packages', id);
    const siteDir = path.join(pkgDir, 'site');
    fs.mkdirSync(siteDir, { recursive: true });
    let entry = 'index.html';
    if (isHtml) {
      fs.writeFileSync(path.join(siteDir, 'index.html'), Buffer.from(body.base64, 'base64'));
    } else {
      const zipPath = path.join(pkgDir, 'pkg.zip');
      fs.writeFileSync(zipPath, Buffer.from(body.base64, 'base64'));
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
    const dir = path.join(ROOT, 'packages');
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
    const cfg = readDeployConfig();
    const repoUrl = (cfg.repoUrl || '').trim();
    const branch = (cfg.branch || 'main').trim();
    const msg = (cfg.commitMsg || 'Update pages & posts via Jerry CMS').replace(/"/g, '');
    if (!repoUrl) return send(res, 200, { ok: false, error: '未配置仓库地址，请先在设置页填写并保存' });
    const log = [];
    let r = await gitRun('rev-parse --is-inside-work-tree');
    if (!(r.code === 0 && r.out === 'true')) {
      return send(res, 200, { ok: false, error: '该目录还不是 Git 仓库，请先点「初始化仓库」', log: [r.out] });
    }
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
      if (/denied/i.test(r.out)) {
        return send(res, 200, { ok: false, error: '推送被拒：当前凭据没有该仓库的写权限。可改用「首次接管远端」或检查令牌/协作者权限', log });
      }
      return send(res, 200, { ok: false, error: '推送失败：' + r.out, log });
    }
    return send(res, 200, { ok: true, upToDate: /Everything up-to-date/i.test(r.out), log });
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

  return send(res, 404, { ok: false, error: '未知接口 ' + pathname });
}

// ---------- 静态文件 ----------
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found: ' + rel); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
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

server.listen(PORT, '127.0.0.1', () => {
  console.log('==========================================');
  console.log('  Jerry CMS 本地服务已启动');
  console.log('  整站   : http://127.0.0.1:' + PORT + '/');
  console.log('  控制台 : http://127.0.0.1:' + PORT + '/admin/index.html');
  console.log('  发布设置: http://127.0.0.1:' + PORT + '/admin/settings.html');
  console.log('==========================================');
});
