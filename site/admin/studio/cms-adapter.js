/* ============================================================
 * cms-adapter.js — Jerry CMS 线上编辑共享适配层（后台页 / 前台可视化编辑器共用）
 * 职责：
 *  - 持有 Supabase 客户端单例（管理员会话）
 *  - 劫持 fetch：把本地 CMS 风格的 /api/* 调用转接到 /api/cms（GitHub 提交 → Vercel 部署）
 * 本地环境（localhost）无需安装：接口由本地 server.js 直接提供。
 * ============================================================ */
(function () {
  'use strict';
  if (window.JerryCmsAdapter) return;

  var SUPABASE_URL = 'https://ytvhanawoaepwfsgqqnzs.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_EfxYndz6uTCRevj2YyCO0A_936qng6d';

  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);

  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (window.supabase) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('登录组件加载失败')); };
      document.head.appendChild(s);
    });
  }

  var _client = null;
  function getClient() {
    if (_client) return Promise.resolve(_client);
    return loadSdk().then(function () {
      _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { persistSession: true });
      return _client;
    });
  }

  // 仅看本地是否存在会话痕迹（不加载 SDK、不发网络请求），供前台访客页面零成本判断
  function hasSessionTrace() {
    try {
      var key = Object.keys(localStorage).find(function (k) {
        return k.indexOf('sb-') === 0 && k.indexOf('auth-token') !== -1;
      });
      if (!key) return false;
      var raw = localStorage.getItem(key);
      return !!(raw && raw.indexOf('access_token') !== -1);
    } catch (e) { return false; }
  }

  function installAdapter(client) {
    if (window.__jerryAdapterInstalled) return;
    window.__jerryAdapterInstalled = true;
    var origFetch = window.fetch.bind(window);
    var stageQueue = []; // 设置页暂存队列（线上保存在页面内存）

    async function token() {
      var s = await client.auth.getSession();
      return s.data.session ? s.data.session.access_token : '';
    }
    async function cms(doWhat, payload, method) {
      var t = await token();
      var r = await origFetch('/api/cms?do=' + doWhat, {
        method: method || 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(payload || {})
      });
      if (r.status === 401) { location.reload(); throw new Error('登录已过期，请重新登录'); }
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '操作失败');
      return d;
    }
    function jsonResp(obj) {
      return Promise.resolve(new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    async function staticJson(url, fallback, wrap) {
      try {
        var r = await origFetch(url);
        if (!r.ok) return jsonResp(wrap ? { ok: true, config: fallback, queue: [] } : fallback);
        var j = await r.json();
        if (wrap) return jsonResp({ ok: true, config: j, queue: stageQueue });
        return jsonResp({ ok: true, config: j });
      } catch (e) { return jsonResp({ ok: true, config: fallback }); }
    }

    var POST_MAP = [
      [['/api/post/save', '/api/posts/save'], 'post-save'],
      [['/api/post/delete'], 'post-delete'],
      [['/api/collection/save'], 'collection-save'],
      [['/api/collection/delete'], 'collection-delete'],
      [['/api/layout/config'], 'layout-save'],
      [['/api/pet/packs'], 'pet-save'],
      [['/api/comments/delete'], 'comments-delete'],
      [['/api/admin/posts'], 'admin-posts'],
      [['/api/admin/collection'], 'admin-collection']
    ];
    var LOCAL_ONLY = {
      '/api/notion/config': 'Notion 同步仅本地编辑器可用',
      '/api/notion/preview': 'Notion 同步仅本地编辑器可用',
      '/api/notion/sync': 'Notion 同步仅本地编辑器可用',
      '/api/deploy/publish': '线上保存即自动发布，无需手动发布（约 1-2 分钟生效）',
      '/api/deploy/init': '部署配置仅本地编辑器可用',
      '/api/deploy/check': '部署配置仅本地编辑器可用',
      '/api/deploy/adopt': '部署配置仅本地编辑器可用',
      '/api/package/upload': '网站包（zip/html）与大文件请用后台「大文件上传」面板（GitHub 网页拖拽，无大小限制）',
      '/api/picbed/probe': '图床探针仅本地编辑器可用',
      '/api/picbed/upload': '图床上传仅本地编辑器可用',
      '/api/bg/rebuild': '背景重建仅本地编辑器可用',
      '/api/view': '线上浏览量由静态统计提供',
      '/api/comments/save': '线上评论请使用 Gitalk'
    };

    window.fetch = async function (input, init) {
      var reqUrl = typeof input === 'string' ? input : (input && input.url) || '';
      var u;
      try { u = new URL(reqUrl, location.origin); } catch (e) { return origFetch(input, init); }
      if (u.origin !== location.origin || u.pathname.indexOf('/api/') !== 0) return origFetch(input, init);

      var p = u.pathname;
      var method = (init && init.method || 'GET').toUpperCase();
      var body = {};
      if (init && init.body) { try { body = JSON.parse(init.body); } catch (e) {} }

      // ---- GET：线上没有的只读接口转静态文件 / cms ----
      if (method === 'GET') {
        if (p === '/api/layout/config') return staticJson('/data/layout_config.json', null);
        if (p === '/api/pet/packs') return staticJson('/data/pet_packs.json', { format: 'jerry-pet-pack/v1', settings: { aiChat: false }, packs: [] });
        if (p === '/api/config') return staticJson('/site.config.json', {}, true);
        if (p === '/api/deploy/config') return jsonResp({ ok: true, config: { repoUrl: '', branch: 'main', siteUrl: location.origin, online: true } });
        if (p === '/api/packages') { var pk = await cms('packages', {}, 'GET'); return jsonResp(pk); }
        if (p === '/api/comments/all') { var cc = await cms('admin-collection', { name: 'comments' }); return jsonResp({ ok: true, items: cc.items || [] }); }
        return origFetch(input, init); // posts/post/collections 等线上已有函数
      }

      // ---- 设置暂存队列（内存模拟本地行为）----
      if (p === '/api/config/stage') {
        stageQueue = stageQueue.filter(function (o) { return o.section !== body.section; });
        stageQueue.push({ id: 'op_' + Date.now().toString(36), section: body.section, label: body.label || body.section, data: body.data, time: '' });
        return jsonResp({ ok: true, queue: stageQueue });
      }
      if (p === '/api/config/stage/remove') {
        stageQueue = stageQueue.filter(function (o) { return o.id !== body.id; });
        return jsonResp({ ok: true, queue: stageQueue });
      }
      if (p === '/api/config/stage/clear') { stageQueue = []; return jsonResp({ ok: true, queue: [] }); }
      if (p === '/api/config/apply') {
        var d = await cms('config-apply', { ops: stageQueue });
        stageQueue = []; return jsonResp(d);
      }

      // ---- 上传 ----
      if (p === '/api/upload') { var du = await cms('upload', { base64: body.base64, filename: body.filename, dir: body.dir || 'images/posts' }); return jsonResp(du); }
      if (p === '/api/attachment/upload') { var da = await cms('upload', { base64: body.base64, filename: body.filename, dir: 'files/posts' }); return jsonResp(da); }

      // ---- 本地专属功能：友好提示 ----
      if (LOCAL_ONLY[p]) return jsonResp({ ok: false, error: LOCAL_ONLY[p] });

      // ---- 写接口映射 ----
      for (var i = 0; i < POST_MAP.length; i++) {
        if (POST_MAP[i][0].indexOf(p) !== -1) {
          var dd = await cms(POST_MAP[i][1], body);
          return jsonResp(dd);
        }
      }
      return origFetch(input, init);
    };

    // 管理员状态条
    var bar = document.createElement('div');
    bar.id = 'aa-online-bar';
    bar.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:10px;' +
      'padding:8px 14px;border-radius:999px;background:rgba(20,16,40,.92);border:1px solid rgba(92,225,230,.4);' +
      'color:#cfeee9;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:var(--mono,monospace)';
    bar.innerHTML = '<span style="color:#7ff0d6">●</span><span>线上编辑模式</span>' +
      '<a href="/admin/index.html" style="color:#cfeee9;text-decoration:none;margin-left:4px">控制台</a>' +
      '<a href="javascript:void(0)" id="aa-logout" style="color:#ff9db4;text-decoration:none;margin-left:4px">退出</a>';
    function mountBar() { if (!document.getElementById('aa-online-bar')) document.body.appendChild(bar); }
    if (document.body) mountBar(); else document.addEventListener('DOMContentLoaded', mountBar);
    bar.querySelector('#aa-logout').addEventListener('click', async function () {
      await client.auth.signOut(); location.reload();
    });
  }

  window.JerryCmsAdapter = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON: SUPABASE_ANON,
    isLocal: isLocal,
    loadSdk: loadSdk,
    getClient: getClient,
    hasSessionTrace: hasSessionTrace,
    install: installAdapter
  };
})();
