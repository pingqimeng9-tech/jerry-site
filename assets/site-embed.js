/* ============================================================
   Jerry CMS · 网站包嵌入增强（Notion 式）v1
   ------------------------------------------------------------
   公开文件（线上/本地都加载）。把文章里的 .site-preview 占位壳
   增强为可交互的嵌入预览：
   - 点击加载 iframe（默认不加载，保证文章打开速度）
   - 宽度调节 25% / 50% / 75% / 100%（持久化在 data-w）
   - 横版 16:9 / 竖屏 9:16 比例切换（持久化在 data-ratio）
   - 刷新 / 新窗口打开
   - 移动端自动全宽，桌面端按设定宽度居中
   ============================================================ */
(function () {
  if (window.__jerrySiteEmbed) return;
  window.__jerrySiteEmbed = true;

  var CSS = [
    '.site-preview{position:relative;margin:1.6rem auto;border-radius:14px;border:1px solid rgba(255,255,255,.28);',
      'background:rgba(255,255,255,.06);overflow:hidden;backdrop-filter:blur(10px);transition:width .25s ease;}',
    '.site-preview .sp-head{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,.35);border-bottom:1px solid rgba(255,255,255,.14);}',
    '.site-preview .sp-title{font-size:12.5px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}',
    '.site-preview .sp-tools{margin-left:auto;display:flex;gap:4px;align-items:center;flex:none;}',
    '.site-preview .sp-tools button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#e8e6fb;',
      'border-radius:7px;font-size:11px;padding:3px 8px;cursor:pointer;transition:.15s;font-family:inherit;white-space:nowrap;}',
    '.site-preview .sp-tools button:hover{background:rgba(255,255,255,.18);color:#fff;}',
    '.site-preview .sp-tools button.on{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border-color:transparent;color:#fff;}',
    '.site-preview .sp-stage{position:relative;width:100%;aspect-ratio:16/9;background:rgba(0,0,0,.4);}',
    '.site-preview[data-ratio="portrait"] .sp-stage{width:auto;aspect-ratio:9/16;height:min(72vh,600px);margin:0 auto;}',
    '.site-preview .sp-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}',
    '.site-preview .sp-stage .sp-placeholder{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#c9c6e8;font-size:12.5px;text-align:center;padding:0 14px;}',
    '.site-preview .sp-stage .sp-placeholder .sp-load{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border:none;color:#fff;',
      'border-radius:999px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px rgba(255,122,92,.35);transition:.2s;}',
    '.site-preview .sp-stage .sp-placeholder .sp-load:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(255,122,92,.5);}',
    '.site-preview .sp-err{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#FF9E8A;font-size:12.5px;background:rgba(0,0,0,.5);}',
    '@media (max-width:760px){ .site-preview{ width:100%!important; } .site-preview[data-ratio="portrait"] .sp-stage{ height:auto;aspect-ratio:9/16;max-height:78vh;width:auto;max-width:100%;margin:0 auto; } .site-preview .sp-tools .sp-w{display:none;} }'
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

    var src = el.getAttribute('data-src') || '';
    var name = el.getAttribute('data-name') || '网站预览';
    var w = el.getAttribute('data-w') || '';

    if (w) el.style.width = w;

    el.innerHTML = '';

    var head = document.createElement('div');
    head.className = 'sp-head';
    var title = document.createElement('span');
    title.className = 'sp-title';
    title.textContent = '⬒ ' + name;          /* textContent 防注入 */
    var tools = document.createElement('div');
    tools.className = 'sp-tools';
    head.appendChild(title);
    head.appendChild(tools);

    var stage = document.createElement('div');
    stage.className = 'sp-stage';

    el.appendChild(head);
    el.appendChild(stage);

    /* --- 工具条 --- */
    function mkBtn(text, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      if (cls) b.className = cls;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      return b;
    }

    /* 宽度档 */
    ['25%', '50%', '75%', '100%'].forEach(function (wv) {
      var b = mkBtn(wv, 'sp-w');
      if (w === wv) b.classList.add('on');
      b.addEventListener('click', function () {
        el.style.width = wv;
        el.setAttribute('data-w', wv);
        tools.querySelectorAll('.sp-w').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
      tools.appendChild(b);
    });

    /* 比例切换 */
    function ratioBtn() {
      var portrait = el.getAttribute('data-ratio') === 'portrait';
      var b = mkBtn(portrait ? '横版' : '竖屏', 'sp-ratio');
      b.addEventListener('click', function () {
        var nowPortrait = el.getAttribute('data-ratio') === 'portrait';
        var next = nowPortrait ? 'landscape' : 'portrait';
        if (next === 'landscape') el.removeAttribute('data-ratio');
        else el.setAttribute('data-ratio', 'portrait');
        b.textContent = next === 'portrait' ? '横版' : '竖屏';
      });
      return b;
    }
    tools.appendChild(ratioBtn());

    /* 刷新 */
    var reload = mkBtn('刷新');
    reload.addEventListener('click', function () {
      var f = stage.querySelector('iframe');
      if (f) f.src = f.src;      /* 重载 iframe */
    });
    tools.appendChild(reload);

    /* 新窗口 */
    var pop = mkBtn('新窗口');
    pop.addEventListener('click', function () {
      if (src) window.open(src, '_blank', 'noopener');
    });
    tools.appendChild(pop);

    /* --- 占位 / 加载 --- */
    function renderPlaceholder() {
      stage.innerHTML = '';
      var ph = document.createElement('div');
      ph.className = 'sp-placeholder';
      var tip = document.createElement('div');
      tip.textContent = '该网站包默认不加载，以保证文章打开速度';
      var load = document.createElement('button');
      load.className = 'sp-load';
      load.type = 'button';
      load.textContent = '▶ 点击加载预览';
      load.addEventListener('mousedown', function (e) { e.preventDefault(); });
      load.addEventListener('click', renderFrame);
      ph.appendChild(tip);
      ph.appendChild(load);
      stage.appendChild(ph);
    }

    function renderFrame() {
      if (!src) return;
      stage.innerHTML = '';
      var f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
      f.setAttribute('loading', 'lazy');
      f.setAttribute('allow', 'fullscreen');
      f.src = src;
      stage.appendChild(f);
    }

    renderPlaceholder();
  }

  function scan() {
    injectCssOnce();
    document.querySelectorAll('.site-preview:not([data-sp-ready])').forEach(build);
  }

  /* 初次 + 动态插入（marked 渲染 / 编辑器切换视图） */
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

  /* 供外部（编辑器插入新块后）手动触发 */
  window.__jerrySiteEmbedScan = scan;
})();
