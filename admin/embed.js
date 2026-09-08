/* ============================================================
   Jerry CMS · 网站包实时预览增强模块（embed.js）
   ------------------------------------------------------------
   作用：把文章里的 <div class="site-preview" data-src data-zip data-name>
   占位变成「类 VSCode Live Server」的实时预览块：
     · 默认不加载，显示「点击加载预览」
     · 右上 ⋯ 菜单：全屏预览 / 横屏预览 / 下载 ZIP / 新窗口打开
   使用方：编辑器页直接 <script src="/admin/embed.js">；
   站点页面由 admin/bridge.js 检测到占位后动态加载本文件。
   样式由本文件自行注入，宿主页面零改动。
   ============================================================ */
(function () {
  if (window.__jerryEmbed) { window.__jerryEmbed.refresh(); return; }
  window.__jerryEmbed = { refresh: function () { enhance(document); } };

  var CSS = ''
    + '.site-preview{position:relative;margin:1.4rem auto;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);overflow:hidden;backdrop-filter:blur(10px)}'
    + '.site-preview .sp-head{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;background:rgba(0,0,0,.28)}'
    + '.site-preview .sp-title{font-family:"JetBrains Mono",Consolas,monospace;font-size:12px;color:#5CE1E6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.site-preview .sp-menu{cursor:pointer;color:#c9c6e8;padding:2px 8px;border-radius:8px;font-weight:700;letter-spacing:2px;user-select:none}'
    + '.site-preview .sp-menu:hover{background:rgba(255,255,255,.16);color:#fff}'
    + '.site-preview .sp-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;gap:10px;padding:16px;color:#c9c6e8;font-size:12px;text-align:center}'
    + '.site-preview .sp-load{border:none;cursor:pointer;padding:10px 22px;border-radius:999px;background:linear-gradient(120deg,#FF7A5C,#FF8CD9);color:#fff;font-weight:700;font-size:13px;font-family:inherit}'
    + '.site-preview .sp-load:hover{filter:brightness(1.1)}'
    + '.site-preview iframe{width:100%;height:480px;border:none;display:block;background:#fff}'
    + '.site-preview .sp-drop{position:absolute;right:10px;top:42px;z-index:30;background:rgba(14,12,34,.96);border:1px solid rgba(255,255,255,.28);border-radius:12px;padding:6px;display:none;flex-direction:column;min-width:150px;box-shadow:0 14px 34px rgba(0,0,0,.5)}'
    + '.site-preview .sp-drop.open{display:flex}'
    + '.site-preview .sp-drop button,.site-preview .sp-drop a{border:none;background:none;color:#fff;text-align:left;padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;text-decoration:none;font-family:inherit}'
    + '.site-preview .sp-drop button:hover,.site-preview .sp-drop a:hover{background:rgba(255,255,255,.16)}'
    + '.site-preview.sp-fs{border-radius:0}'
    + '.site-preview.sp-fs iframe{height:calc(100vh - 52px)}'
    + '.site-preview.sp-landscape iframe{height:min(56vw,70vh)}';
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  function closeAllMenus(except) {
    document.querySelectorAll('.site-preview .sp-drop.open').forEach(function (m) {
      if (m.parentNode !== except) m.classList.remove('open');
    });
  }
  document.addEventListener('click', function () { closeAllMenus(null); });

  function enhance(root) {
    (root || document).querySelectorAll('div.site-preview').forEach(function (el) {
      if (el.dataset.cmsEnhanced) return;
      el.dataset.cmsEnhanced = '1';

      var stage = el.querySelector('.sp-stage');
      var menuBtn = el.querySelector('.sp-menu');

      function load() {
        if (el.dataset.loaded) return;
        el.dataset.loaded = '1';
        var frame = document.createElement('iframe');
        frame.setAttribute('src', el.dataset.src || '');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('loading', 'lazy');
        stage.innerHTML = '';
        stage.style.minHeight = '0';
        stage.appendChild(frame);
      }

      // 菜单
      var drop = document.createElement('div');
      drop.className = 'sp-drop';
      function item(label, fn, asLink, href) {
        var el2;
        if (asLink) { el2 = document.createElement('a'); el2.href = href || '#'; if (href) el2.setAttribute('download', ''); }
        else { el2 = document.createElement('button'); el2.type = 'button'; }
        el2.textContent = label;
        el2.addEventListener('click', function (e) { e.stopPropagation(); drop.classList.remove('open'); if (fn) fn(); });
        return el2;
      }
      drop.appendChild(item('▶ 加载预览', load));
      drop.appendChild(item('⛶ 全屏预览', function () {
        load();
        var req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) { try { el.classList.add('sp-fs'); req.call(el); } catch (e) {} }
        else { el.classList.toggle('sp-fs'); }
      }));
      drop.appendChild(item('📱 横屏预览', function () {
        load();
        el.classList.add('sp-fs');
        var req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) { try { var p = req.call(el); if (p && p.then) p.then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); }); } catch (e) {} }
        el.classList.add('sp-landscape');
      }));
      if (el.dataset.zip) {
        drop.appendChild(item('⬇️ 下载 ZIP 包', null, true, el.dataset.zip));
      }
      drop.appendChild(item('↗ 新窗口打开', function () {
        window.open(el.dataset.src, '_blank');
      }));

      var title = el.querySelector('.sp-title');
      if (!title) {
        title = document.createElement('span');
        title.className = 'sp-title';
        title.textContent = el.dataset.name || '网站预览包';
        var head = el.querySelector('.sp-head');
        if (!head) { head = document.createElement('div'); head.className = 'sp-head'; el.insertBefore(head, el.firstChild); }
        head.insertBefore(title, head.firstChild);
      }
      if (!menuBtn) {
        menuBtn = document.createElement('span');
        menuBtn.className = 'sp-menu';
        menuBtn.textContent = '⋯';
        el.querySelector('.sp-head').appendChild(menuBtn);
      }
      menuBtn.parentNode.insertBefore(drop, menuBtn.nextSibling);
      menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = drop.classList.contains('open');
        closeAllMenus(el);
        drop.classList.toggle('open', !open);
      });

      var lb = el.querySelector('.sp-load');
      if (lb) lb.addEventListener('click', function (e) { e.stopPropagation(); load(); });
    });
  }

  enhance(document);
})();
