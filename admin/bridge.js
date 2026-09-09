/* ============================================================
   Jerry CMS · 本地编辑模式桥接模块 v3（单文件模块化）
   ------------------------------------------------------------
   探测本地 CMS 服务；在线时：
     1. 向站点导航（nav .links）注入「草稿箱 / 设置」链接，
        样式自动继承各页导航（对标星辉：主页导航就有草稿箱）
     2. 文章页（post.html）额外注入「✎ 编辑本文」悬浮胶囊
     3. 页面存在网站包占位（.site-preview）时加载 embed.js
        提供点击加载 / 全屏 / 横屏 / 下载 ZIP
   部署到线上（无本地服务）时全部静默，零死链。
   页面侧只需一行：<script src="/admin/bridge.js"></script>
   ============================================================ */
(function () {
  if (window.__jerryCmsBridge) return;
  window.__jerryCmsBridge = true;

  // 文章页媒体样式（视频/嵌入图在正文里的展示），无论 CMS 是否在线都注入（无害）
  try {
    var st = document.createElement('style');
    st.textContent = '#a-body video,#a-body figure.video-embed video{width:100%;max-width:100%;display:block;border-radius:12px;margin:1.2rem auto;background:#000;box-shadow:0 18px 44px rgba(0,0,0,.35)}'
      + '#a-body figure.video-embed{margin:1.4rem auto}'
      + '#a-body img{max-width:100%;border-radius:12px}'
      + '#a-body .site-preview{position:relative;margin:1.4rem auto;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);overflow:hidden;backdrop-filter:blur(10px)}';
    document.head.appendChild(st);
  } catch (e) {}

  fetch('/api/admin/posts', { method: 'POST' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.ok) inject(); })
    .catch(function () { /* 线上环境：静默 */ });

  function mkNavLink(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.title = 'Jerry CMS 本地管理';
    return a;
  }

  function inject() {
    // 1) 导航注入：所有带 nav .links 的页面（index/blog/rumi）
    var navLinks = document.querySelectorAll('nav .links');
    if (navLinks.length) {
      navLinks.forEach(function (l) {
        if (!l.querySelector('a[href="/admin/index.html"]')) {
          l.appendChild(mkNavLink('/admin/index.html', '草稿箱'));
          l.appendChild(mkNavLink('/admin/settings.html', '设置'));
        }
      });
    } else {
      // post.html 等无 .links 的页面：把入口挂进 <nav>
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

    // 2) 文章页：悬浮「编辑本文」胶囊（带文章 id）
    if (/post\.html$/i.test(location.pathname)) {
      var id = new URLSearchParams(location.search).get('id');
      if (id) {
        var pill = document.createElement('a');
        pill.href = '/admin/editor.html?id=' + encodeURIComponent(id);
        pill.textContent = '✎ 编辑本文';
        pill.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;padding:11px 20px;' +
          'border-radius:999px;background:linear-gradient(120deg,#FF7A5C,#FF8CD9);color:#fff;font-size:13px;font-weight:700;' +
          "font-family:'Noto Sans SC',system-ui,sans-serif;text-decoration:none;box-shadow:0 10px 26px rgba(255,122,92,.4)";
        document.body.appendChild(pill);
      }
    }

    // 3) 网站包占位 → 加载增强模块
    if (document.querySelector('.site-preview')) loadEmbed();
    else {
      var mo = new MutationObserver(function () {
        if (document.querySelector('.site-preview')) { loadEmbed(); mo.disconnect(); }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function loadEmbed() {
    if (window.__jerryEmbed) { window.__jerryEmbed.refresh(); return; }
    var s = document.createElement('script');
    s.src = '/admin/embed.js';
    document.head.appendChild(s);
  }
})();
