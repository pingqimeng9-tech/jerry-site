/* ============================================================
 * mobile-nav.js — 前台公共导航的手机汉堡菜单（零依赖）
 * 自动增强页面中已有的 <nav><div class="links">…</div></nav>：
 * 窄屏（≤820px）注入汉堡按钮，点击展开/收起下拉菜单；
 * 宽屏不产生任何影响。样式见 css/blog.css 的 .mn-toggle 区段。
 * ============================================================ */
(function () {
  if (window.__mobileNavInit) return;
  window.__mobileNavInit = true;

  function setup() {
    document.querySelectorAll('nav').forEach(function (nav) {
      if (nav.__mnDone) return;
      var links = nav.querySelector('.links');
      if (!links) return;
      nav.__mnDone = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mn-toggle';
      btn.setAttribute('aria-label', '打开导航菜单');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span><span></span><span></span>';

      function close() {
        links.classList.remove('open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = links.classList.toggle('open');
        btn.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) close();
      });
      document.addEventListener('click', function (e) {
        if (!nav.contains(e.target)) close();
      });

      nav.appendChild(btn);
    });
  }

  if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
