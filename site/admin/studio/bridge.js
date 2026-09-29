/* ============================================================
   Jerry CMS · 本地编辑模式桥接模块 v4
   ------------------------------------------------------------
   本文件只在本地由 server.js 动态注入到页面（线上既没有这个
   文件，页面也不引用它），为本地浏览提供管理入口。

   功能：
   1. 全站导航注入「草稿箱 / 设置」入口（探测本地 CMS 成功后）
   2. 文章页（post.html）悬浮「✎ 编辑本文」渐变胶囊
   3. 博客页（blog.html）本地增强：
      - 桌面端隐藏左侧边栏，主栏收窄居中（手机端保留抽屉）
      - 搜索框内嵌「＋ 新帖子」渐变胶囊按钮
      - 每张文章卡片悬停浮现「✎」编辑圆钮
      - 卡片封面自动优先使用后台设置的缩略图（thumb）
   4. 网站包占位（.site-preview）加载 embed.js 增强
   线上访客：无本地服务 → 探测失败 → 全部静默，零干扰。
   ============================================================ */
(function () {
  if (window.__jerryCmsBridge) return;
  window.__jerryCmsBridge = true;

  /* ---------- 文章页媒体样式（视频/嵌入图在正文里的展示，无害） ---------- */
  try {
    var st = document.createElement('style');
    st.textContent = '#a-body video,#a-body figure.video-embed video{width:100%;max-width:100%;display:block;border-radius:12px;margin:1.2rem auto;background:#000;box-shadow:0 18px 44px rgba(0,0,0,.35)}'
      + '#a-body figure.video-embed{margin:1.4rem auto}'
      + '#a-body img{max-width:100%;border-radius:12px}'
      + '#a-body .site-preview{position:relative;margin:1.4rem auto;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);overflow:hidden;backdrop-filter:blur(10px)}';
    document.head.appendChild(st);
  } catch (e) {}

  /* ---------- 编辑权限探测（双环境） ----------
   * 本地：探测本地 CMS 接口 /api/admin/posts，成功即注入
   * 线上：先查本地会话痕迹（无痕迹立即退出，访客零网络请求、零界面）；
   *      有痕迹再加载 Supabase 校验管理员会话，通过后注入并安装线上适配层 */
  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  if (isLocal) {
    fetch('/api/admin/posts', { method: 'POST' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.ok) inject(); })
      .catch(function () {});
  } else {
    bootOnlineEditor();
  }

  function loadAdapter() {
    if (window.JerryCmsAdapter) return Promise.resolve(window.JerryCmsAdapter);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = '/admin/studio/cms-adapter.js';
      s.onload = function () { resolve(window.JerryCmsAdapter); };
      s.onerror = function () { reject(new Error('adapter load fail')); };
      document.head.appendChild(s);
    });
  }

  function bootOnlineEditor() {
    // 访客（从未登录过后台）：localStorage 无会话痕迹 → 立即结束，不加载任何外部组件
    var trace = false;
    try {
      trace = Object.keys(localStorage).some(function (k) {
        return k.indexOf('sb-') === 0 && k.indexOf('auth-token') !== -1 &&
          (localStorage.getItem(k) || '').indexOf('access_token') !== -1;
      });
    } catch (e) {}
    if (!trace) return;
    loadAdapter().then(function (Adapter) {
      return Adapter.getClient().then(function (client) {
        return client.auth.getSession().then(function (r) {
          if (r.data.session) { Adapter.install(client); inject(); }
        });
      });
    }).catch(function () { /* 未登录/组件失败：静默，不影响访客 */ });
  }

  function mkNavLink(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.title = 'Jerry CMS 本地管理';
    return a;
  }

  function inject() {
    injectNavLinks();
    injectPostPill();
    injectBlogEnhancements();
    watchSitePreview();
    loadInlineEditor();
  }

  /* ---------- 5) 前台可视化布局编辑器（页面本体上直接改布局/外观） ---------- */
  function loadInlineEditor() {
    if (window.__jlInlineEditor) return;
    var s = document.createElement('script');
    s.src = '/admin/studio/inline-editor.js';
    document.head.appendChild(s);
  }

  /* ---------- 1) 导航注入「草稿箱 / 设置」 ---------- */
  function injectNavLinks() {
    var navLinks = document.querySelectorAll('nav .links');
    if (navLinks.length) {
      navLinks.forEach(function (l) {
        if (!l.querySelector('a[href="/admin/index.html"]')) {
          l.appendChild(mkNavLink('/admin/index.html', '草稿箱'));
          l.appendChild(mkNavLink('/admin/settings.html', '设置'));
        }
      });
    } else {
      var nav = document.querySelector('nav');
      if (nav && !nav.querySelector('a[href="/admin/index.html"]')) {
        var d1 = mkNavLink('/admin/index.html', '草稿箱');
        d1.style.cssText = 'font-size:13px;color:#c9c6e8;padding:8px 14px;border-radius:100px;transition:.2s;';
        var d2 = mkNavLink('/admin/settings.html', '设置');
        d2.style.cssText = d1.style.cssText;
        nav.appendChild(d1);
        nav.appendChild(d2);
      }
    }
  }

  /* ---------- 2) 文章页「✎ 编辑本文」胶囊 ---------- */
  function injectPostPill() {
    if (!/post\.html$/i.test(location.pathname)) return;
    var id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    var pill = document.createElement('a');
    pill.href = '/admin/editor.html?id=' + encodeURIComponent(id);
    pill.textContent = '✎ 编辑本文';
    pill.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;padding:11px 20px;'
      + 'border-radius:999px;background:linear-gradient(120deg,#FF7A5C,#FF8CD9);color:#fff;font-size:13px;font-weight:700;'
      + "font-family:'Noto Sans SC',system-ui,sans-serif;text-decoration:none;box-shadow:0 10px 26px rgba(255,122,92,.4);transition:.25s;";
    pill.addEventListener('mouseenter', function () {
      pill.style.transform = 'translateY(-2px)';
      pill.style.boxShadow = '0 14px 32px rgba(255,122,92,.5)';
    });
    pill.addEventListener('mouseleave', function () {
      pill.style.transform = '';
      pill.style.boxShadow = '0 10px 26px rgba(255,122,92,.4)';
    });
    document.body.appendChild(pill);
  }

  /* ---------- 3) 博客页本地增强 ---------- */
  function injectBlogEnhancements() {
    if (!/blog\.html$/i.test(location.pathname)) return;

    /* 3.1 注入样式：严格沿用站点设计变量（玻璃拟态 + 珊瑚粉渐变） */
    var css = document.createElement('style');
    css.id = 'jerry-blog-enhance-css';
    css.textContent = [
      /* 桌面/平板隐藏左侧栏（分类/最近/归档），主栏收窄居中；手机 ≤760px 保留抽屉 */
      '@media (min-width:761px){ .sidebar{ display:none!important; } .shell{ max-width:1280px; } }',
      /* 卡片悬停编辑钮 */
      '.post-card{ position:relative; }',
      '.jerry-edit-btn{ position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:50%;',
        'display:flex; align-items:center; justify-content:center; background:rgba(10,8,26,.5);',
        'backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);',
        'border:1px solid rgba(255,255,255,.28); color:#fff; font-size:14px; line-height:1;',
        'cursor:pointer; z-index:6; user-select:none; opacity:0; transform:translateY(-4px) scale(.9);',
        'pointer-events:none; transition:opacity .22s ease, transform .22s ease, background .22s ease, border-color .22s ease; }',
      '.post-card:hover .jerry-edit-btn, .jerry-edit-btn:focus-visible{ opacity:1; transform:translateY(0) scale(1); pointer-events:auto; }',
      '.jerry-edit-btn:hover{ background:linear-gradient(120deg,var(--coral),var(--pink)); border-color:transparent;',
        'transform:translateY(0) scale(1.1); box-shadow:0 6px 18px rgba(255,122,92,.45); }',
      /* 搜索框内嵌「＋ 新帖子」渐变胶囊 */
      '.hero-search-wrap input{ padding-right:132px; }',
      '.jerry-new-post{ position:absolute; right:10px; top:50%; transform:translateY(-50%);',
        'display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border:none; border-radius:999px;',
        'background:linear-gradient(120deg,var(--coral),var(--pink)); color:#fff; font-size:13px; font-weight:700;',
        "font-family:'Noto Sans SC',system-ui,sans-serif; cursor:pointer; white-space:nowrap;",
        'box-shadow:0 6px 18px rgba(255,122,92,.35); transition:.25s; }',
      '.jerry-new-post:hover{ transform:translateY(-50%) scale(1.04); box-shadow:0 10px 26px rgba(255,122,92,.5); }',
      '.jerry-new-post:active{ transform:translateY(-50%) scale(.96); }',
      '.jerry-new-post:focus-visible{ outline:2px solid var(--aqua); outline-offset:2px; }',
      '@media (max-width:760px){ .jerry-new-post{ display:none; } .hero-search-wrap input{ padding-right:24px; } }'
    ].join('');
    document.head.appendChild(css);

    /* 3.2 「＋ 新帖子」按钮 */
    var wrap = document.querySelector('.hero-search-wrap');
    if (wrap && !wrap.querySelector('.jerry-new-post')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'jerry-new-post';
      btn.textContent = '＋ 新帖子';
      btn.title = '新建文章（本地 CMS）';
      btn.setAttribute('aria-label', '新建文章');
      btn.addEventListener('click', function () { location.href = '/admin/editor.html?id=new'; });
      wrap.appendChild(btn);
    }

    /* 3.3 卡片「✎」编辑钮（事件委托，兼容搜索/筛选/翻页重渲染） */
    if (!window.__jerryEditDelegate) {
      window.__jerryEditDelegate = true;
      var goEdit = function (id) {
        location.href = '/admin/editor.html?id=' + encodeURIComponent(id || '');
      };
      document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.jerry-edit-btn') : null;
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        goEdit(b.dataset.postId);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var b = e.target && e.target.closest ? e.target.closest('.jerry-edit-btn') : null;
        if (!b) return;
        e.preventDefault();
        goEdit(b.dataset.postId);
      });
    }

    function postIdOf(card) {
      var m = (card.getAttribute('href') || '').match(/[?&]id=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    }

    function ensureEditButtons() {
      document.querySelectorAll('.post-card').forEach(function (card) {
        if (card.querySelector('.jerry-edit-btn')) return;
        var pid = postIdOf(card);
        if (!pid) return;
        var b = document.createElement('span');
        b.className = 'jerry-edit-btn';
        b.setAttribute('role', 'button');
        b.setAttribute('tabindex', '0');
        b.setAttribute('aria-label', '编辑此文');
        b.title = '编辑此文';
        b.textContent = '✎';
        b.dataset.postId = pid;
        card.appendChild(b);
      });
    }

    /* 3.4 封面缩略图：卡片优先使用后台 thumb（回退 cover 由页面自身逻辑保证） */
    var thumbMap = null;
    function applyThumbs() {
      if (!thumbMap) return;
      document.querySelectorAll('.post-card').forEach(function (card) {
        var pid = postIdOf(card);
        if (!pid || !thumbMap[pid]) return;
        var img = card.querySelector('.post-cover-img');
        if (img && img.getAttribute('src') !== thumbMap[pid]) {
          img.setAttribute('src', thumbMap[pid]);
          img.setAttribute('decoding', 'async');
        }
      });
    }

    fetch('/api/posts')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok || !Array.isArray(d.posts)) return;
        thumbMap = {};
        d.posts.forEach(function (p) { if (p.thumb) thumbMap[p.id] = p.thumb; });
        applyThumbs();
      })
      .catch(function () {});

    /* DOM 变化（搜索/筛选/翻页重渲染）后补按钮与缩略图，防抖 120ms */
    var moTimer = null;
    var mo = new MutationObserver(function () {
      clearTimeout(moTimer);
      moTimer = setTimeout(function () { ensureEditButtons(); applyThumbs(); }, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    ensureEditButtons();
  }

  /* ---------- 4) 网站包占位 → 加载 embed.js ---------- */
  function watchSitePreview() {
    if (document.querySelector('.site-preview')) loadEmbed();
    else {
      var m = new MutationObserver(function () {
        if (document.querySelector('.site-preview')) { loadEmbed(); m.disconnect(); }
      });
      m.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function loadEmbed() {
    if (window.__jerryEmbed) { window.__jerryEmbed.refresh(); return; }
    var s = document.createElement('script');
    s.src = '/assets/site-embed.js';
    document.head.appendChild(s);
  }
})();
