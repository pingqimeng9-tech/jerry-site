/* ============================================================
 * admin-auth.js — Jerry CMS 后台门禁 + 线上编辑适配层
 * 1) 本地（localhost/127.0.0.1）：完全放行，接口由本地 server.js 提供
 * 2) 线上：必须用管理员邮箱验证码登录（Supabase 会话），白名单由服务端强制；
 *    登录后自动把后台原本调本地的 /api/* 写接口转接到 /api/cms（GitHub 提交 → Vercel 自动部署）
 * ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://ytvhanawoaepwfsgqqnzs.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_EfxYndz6uTCRevj2YyCO0A_936qng6d';
  // 注意：管理员邮箱白名单只存在于服务端（环境变量 ADMIN_EMAIL），前端不写死任何邮箱，
  // 避免查看页面源码就能知道站长邮箱；非白名单邮箱在发码环节就会被服务端拒绝。

  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  if (isLocal) return; // 本地环境信任，不做任何拦截

  // ---------- 动态加载 Supabase SDK ----------
  function loadSdk(cb) {
    if (window.supabase) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = cb;
    s.onerror = function () { document.getElementById('aa-msg') && (document.getElementById('aa-msg').textContent = '登录组件加载失败，请检查网络后刷新'); };
    document.head.appendChild(s);
  }

  // ---------- 登录遮罩 UI ----------
  function showGate(client, onSuccess) {
    document.body.style.overflow = 'hidden';
    var mask = document.createElement('div');
    mask.id = 'aa-mask';
    mask.innerHTML =
      '<style>' +
      '#aa-mask{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;' +
      'background:radial-gradient(1200px 600px at 50% -10%,rgba(177,140,255,.18),transparent),#0b0918;font-family:inherit}' +
      '.aa-card{width:min(420px,92vw);padding:38px 34px 30px;border-radius:22px;background:rgba(255,255,255,.05);' +
      'border:1px solid rgba(177,140,255,.35);box-shadow:0 30px 80px rgba(0,0,0,.55);text-align:center}' +
      '.aa-logo{font-size:40px;margin-bottom:10px}.aa-card h2{margin:0 0 6px;font-size:21px;color:#f3efff}' +
      '.aa-sub{color:#a99fce;font-size:12.5px;line-height:1.7;margin-bottom:24px}' +
      '.aa-card input{width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.14);' +
      'background:rgba(0,0,0,.28);color:#fff;font-size:14px;outline:none;margin-bottom:12px}' +
      '.aa-card input:focus{border-color:#b18cff}' +
      '.aa-card button{width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;font-size:14px;font-weight:700;margin-bottom:10px}' +
      '#aa-send{background:linear-gradient(120deg,#b18cff,#5ce1e6);color:#fff}' +
      '#aa-verify{background:#fff;color:#241d3d}' +
      '#aa-verify:disabled,#aa-send:disabled{opacity:.55;cursor:not-allowed}' +
      '#aa-msg{min-height:20px;font-size:12.5px;line-height:1.6;margin-top:4px;color:#ff9db4}' +
      '#aa-msg.ok{color:#7ff0d6}' +
      '</style>' +
      '<div class="aa-card">' +
      '<div class="aa-logo">🔐</div>' +
      '<h2>Jerry CMS 管理员登录</h2>' +
      '<div class="aa-sub">线上后台仅对站长开放。<br>请输入管理员邮箱，收取一次性验证码登录。</div>' +
      '<input id="aa-email" type="email" autocomplete="email" placeholder="管理员邮箱">' +
      '<button id="aa-send">发送验证码</button>' +
      '<input id="aa-code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="输入邮箱收到的 6 位验证码" style="display:none;letter-spacing:4px">' +
      '<button id="aa-verify" style="display:none">验证并进入后台</button>' +
      '<div id="aa-msg"></div>' +
      '</div>';
    document.body.appendChild(mask);

    var msgEl = mask.querySelector('#aa-msg');
    function msg(t, ok) { msgEl.textContent = t; msgEl.className = ok ? 'ok' : ''; }
    var sendBtn = mask.querySelector('#aa-send'), verBtn = mask.querySelector('#aa-verify');
    var codeInput = mask.querySelector('#aa-code'), emailInput = mask.querySelector('#aa-email');

    sendBtn.addEventListener('click', async function () {
      var email = emailInput.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg('请输入有效的邮箱地址');
      sendBtn.disabled = true; sendBtn.textContent = '发送中…'; msg('');
      try {
        var r = await fetch('/api/assist?do=send-code', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email })
        });
        var d = await r.json();
        if (!d.ok) throw new Error(d.error || '发送失败');
        codeInput.style.display = 'block'; verBtn.style.display = 'block';
        msg('验证码已发送至 ' + email + '，' + (d.ttl || 10) + ' 分钟内有效', true);
        var left = 60; sendBtn.textContent = '重新发送（' + left + 's）';
        var timer = setInterval(function () {
          left--; if (left <= 0) { clearInterval(timer); sendBtn.disabled = false; sendBtn.textContent = '重新发送验证码'; }
          else sendBtn.textContent = '重新发送（' + left + 's）';
        }, 1000);
      } catch (e) {
        sendBtn.disabled = false; sendBtn.textContent = '发送验证码'; msg(e.message);
      }
    });

    verBtn.addEventListener('click', async function () {
      var email = emailInput.value.trim().toLowerCase();
      var code = codeInput.value.trim();
      if (code.length !== 6) return msg('请输入完整的 6 位验证码');
      verBtn.disabled = true; verBtn.textContent = '验证中…';
      try {
        var r = await fetch('/api/assist?do=verify-code', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, code: code })
        });
        var d = await r.json();
        if (!d.ok) throw new Error(d.error || '验证失败');
        // 用 token_hash 兑换正式 Supabase 会话
        var v = await client.auth.verifyOtp({ email: email, token: d.token_hash, type: 'magiclink' });
        if (v.error) throw v.error;
        var sess = v.data.session;
        if (!sess) throw new Error('登录失败，请重试');
        // 邮箱是否为管理员由服务端在每次接口调用时强制校验，前端不保存/比对邮箱
        mask.remove(); document.body.style.overflow = '';
        onSuccess(sess);
      } catch (e) {
        verBtn.disabled = false; verBtn.textContent = '验证并进入后台'; msg(e.message);
      }
    });
  }

  // ---------- 线上接口适配：本地 API → /api/cms / 静态 JSON ----------
  function installAdapter(client) {
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
      '/api/package/upload': '网站包（zip/html）上传仅本地编辑器可用',
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
    bar.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:10px;' +
      'padding:8px 14px;border-radius:999px;background:rgba(20,16,40,.92);border:1px solid rgba(92,225,230,.4);' +
      'color:#cfeee9;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:var(--mono,monospace)';
    bar.innerHTML = '<span style="color:#7ff0d6">●</span><span>线上编辑模式</span>' +
      '<a href="javascript:void(0)" id="aa-logout" style="color:#ff9db4;text-decoration:none;margin-left:4px">退出</a>';
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(bar); });
    bar.querySelector('#aa-logout').addEventListener('click', async function () {
      await client.auth.signOut(); location.reload();
    });
  }

  // ---------- 启动 ----------
  loadSdk(function () {
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { persistSession: true });
    client.auth.getSession().then(function (r) {
      var sess = r.data.session;
      // 有会话就先放行进入界面；是否为管理员由服务端在每次接口调用时强制校验，
      // 非管理员即使进入界面也看不到/改不了任何数据（接口全部 403）。
      if (sess) installAdapter(client);
      else showGate(client, function () { installAdapter(client); });
    });
  });
})();
