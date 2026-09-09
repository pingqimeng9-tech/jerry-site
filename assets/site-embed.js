/* ============================================================
   Jerry CMS · 网站包嵌入增强（Notion 式）v2
   ------------------------------------------------------------
   公开文件（线上/本地都加载）。把文章里的 .site-preview 块
   渲染为「直接可用的实时 iframe」：
   - 默认直接加载 iframe（不再点击占位壳），所见即所得
   - 宽度调节 25% / 50% / 75% / 100%（持久化在 data-w）
   - 横版 16:9 / 竖屏 9:16 比例切换（持久化在 data-ratio）
   - 刷新 / 新窗口打开
   - 移动端自动全宽，桌面端按设定宽度居中
   - 竖屏时 iframe 高度受限，不占满、不遮预览
   ============================================================ */
(function () {
  if (window.__jerrySiteEmbed) return;
  window.__jerrySiteEmbed = true;

  var CSS = [
    '.site-preview{position:relative;margin:1.6rem auto;border-radius:14px;border:1px solid rgba(255,255,255,.28);',
      'background:rgba(255,255,255,.06);overflow:hidden;backdrop-filter:blur(10px);transition:width .25s ease;width:72%;box-shadow:0 18px 44px rgba(0,0,0,.35);}',
    '.site-preview[data-w="25%"]{width:25%}.site-preview[data-w="50%"]{width:50%}',
    '.site-preview[data-w="75%"]{width:75%}.site-preview[data-w="100%"]{width:100%}',
    '.site-preview .sp-head{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,.35);border-bottom:1px solid rgba(255,255,255,.14);}',
    '.site-preview .sp-title{font-size:12.5px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;display:inline-flex;align-items:center;gap:6px;}',
    '.site-preview .sp-title .sp-dot{width:8px;height:8px;border-radius:50%;background:linear-gradient(120deg,#FF7A5C,#FF8CD9);flex:none;}',
    '.site-preview .sp-tools{margin-left:auto;display:flex;gap:4px;align-items:center;flex:none;}',
    '.site-preview .sp-tools button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#e8e6fb;',
      'border-radius:7px;font-size:11px;padding:3px 8px;cursor:pointer;transition:.15s;font-family:inherit;white-space:nowrap;}',
    '.site-preview .sp-tools button:hover{background:rgba(255,255,255,.18);color:#fff;}',
    '.site-preview .sp-tools button.on{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border-color:transparent;color:#fff;}',
    '.site-preview .sp-stage{position:relative;width:100%;aspect-ratio:16/9;background:rgba(0,0,0,.4);}',
    '.site-preview[data-ratio="portrait"] .sp-stage{width:auto;aspect-ratio:9/16;height:min(72vh,600px);margin:0 auto;}',
    '.site-preview .sp-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}',
    '.site-preview .sp-stage .sp-err{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#FF9E8A;font-size:12.5px;background:rgba(0,0,0,.5);text-align:center;padding:0 16px;}',
    '@media (max-width:760px){',
      '.site-preview{width:100%!important;}',
      '.site-preview[data-ratio="portrait"] .sp-stage{height:auto;aspect-ratio:9/16;max-height:78vh;width:auto;max-width:100%;margin:0 auto;}',
      '.site-preview .sp-tools .sp-w{display:none;}',
    '}'
  ].join('');

  function injectCssOnce() {
    if (document.getElementById('jerry-site-embed-css')) return;
    var st = document.createElement('style');
    st.id = 'jerry-site-embed-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function build(el) {
    if (el.dataset.spReady) return;
    el.dataset.spReady = '1';
    el.contentEditable = 'false';
    el.style.width = el.getAttribute('data-w') || '72%';

    var src = el.getAttribute('data-src') || '';
    var name = el.getAttribute('data-name') || '网站预览';
    if (name === '网站预览') {
      var m = src.match(/\/([^/]+)\/site\//);
      if (m) name = decodeURIComponent(m[1]);
    }
    var w = el.getAttribute('data-w') || '';
    var portrait = el.getAttribute('data-ratio') === 'portrait';

    el.innerHTML = '';

    var head = document.createElement('div');
    head.className = 'sp-head';
    var title = document.createElement('span');
    title.className = 'sp-title';
    var dot = document.createElement('span');
    dot.className = 'sp-dot';
    title.appendChild(dot);
    title.appendChild(document.createTextNode(name));   /* textContent 防注入 */
    var tools = document.createElement('div');
    tools.className = 'sp-tools';
    head.appendChild(title);
    head.appendChild(tools);

    var stage = document.createElement('div');
    stage.className = 'sp-stage';

    el.appendChild(head);
    el.appendChild(stage);

    function mkBtn(text, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      if (cls) b.className = cls;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); });
      return b;
    }

    /* 宽度档 */
    ['25%', '50%', '75%', '100%'].forEach(function (wv) {
      var b = mkBtn(wv, 'sp-w');
      if (w === wv) b.classList.add('on');
      b.addEventListener('click', function () {
        el.setAttribute('data-w', wv);
        el.style.width = wv;
        tools.querySelectorAll('.sp-w').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
      tools.appendChild(b);
    });

    /* 比例切换 */
    var rat = mkBtn(portrait ? '横版' : '竖屏', 'sp-ratio');
    rat.addEventListener('click', function () {
      var nowPortrait = el.getAttribute('data-ratio') === 'portrait';
      if (nowPortrait) el.removeAttribute('data-ratio');
      else el.setAttribute('data-ratio', 'portrait');
      rat.textContent = nowPortrait ? '竖屏' : '横版';
    });
    tools.appendChild(rat);

    /* 刷新 */
    var reload = mkBtn('刷新');
    reload.addEventListener('click', function () {
      var f = stage.querySelector('iframe');
      if (f) { var s = f.getAttribute('src'); f.removeAttribute('src'); f.setAttribute('src', s); }
    });
    tools.appendChild(reload);

    /* 新窗口 */
    var pop = mkBtn('新窗口');
    pop.addEventListener('click', function () {
      if (src) window.open(src, '_blank', 'noopener');
    });
    tools.appendChild(pop);

    /* 默认直接加载 iframe */
    function renderFrame() {
      if (!src) { renderErr('该网站包缺少 data-src'); return; }
      stage.innerHTML = '';
      var f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads');
      f.setAttribute('loading', 'lazy');
      f.setAttribute('allow', 'fullscreen');
      f.setAttribute('referrerpolicy', 'no-referrer');
      f.src = src;
      f.addEventListener('error', function () { renderErr('预览加载失败'); });
      stage.appendChild(f);
    }
    function renderErr(msg) {
      stage.innerHTML = '';
      var e = document.createElement('div');
      e.className = 'sp-err';
      e.textContent = msg;
      stage.appendChild(e);
    }

    renderFrame();
  }

  function scan() {
    injectCssOnce();
    document.querySelectorAll('.site-preview:not([data-sp-ready])').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  var mo = new MutationObserver(function () {
    clearTimeout(window.__jerrySpMoT);
    window.__jerrySpMoT = setTimeout(scan, 150);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.__jerrySiteEmbedScan = scan;
})();
