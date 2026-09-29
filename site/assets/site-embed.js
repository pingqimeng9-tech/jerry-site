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
    '}',
    /* ===== 可下载附件卡片 ===== */
    '.file-attach{margin:1.3rem auto;width:100%;max-width:720px}',
    '.file-attach a.fa-card{display:flex;align-items:center;gap:13px;padding:13px 15px;border-radius:13px;',
      'border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);backdrop-filter:blur(10px);',
      'box-shadow:0 10px 26px rgba(0,0,0,.25);text-decoration:none;transition:.15s;cursor:pointer}',
    '.file-attach a.fa-card:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.55);transform:translateY(-1px)}',
    '.file-attach .fa-icon{flex:none;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;',
      'font-size:23px;background:linear-gradient(135deg,#FF7A5C,#FF8CD9);box-shadow:0 6px 16px rgba(255,122,92,.3)}',
    '.file-attach .fa-icon.ic-zip{background:linear-gradient(135deg,#f5b041,#f39c12)}',
    '.file-attach .fa-icon.ic-exe{background:linear-gradient(135deg,#5dade2,#2e86c1)}',
    '.file-attach .fa-icon.ic-pdf{background:linear-gradient(135deg,#ec7063,#c0392b)}',
    '.file-attach .fa-icon.ic-doc{background:linear-gradient(135deg,#5dade2,#2874a6)}',
    '.file-attach .fa-icon.ic-xls{background:linear-gradient(135deg,#58d68d,#229954)}',
    '.file-attach .fa-icon.ic-ppt{background:linear-gradient(135deg,#f1948a,#cb4335)}',
    '.file-attach .fa-icon.ic-img{background:linear-gradient(135deg,#af7ac5,#7d3c98)}',
    '.file-attach .fa-icon.ic-av{background:linear-gradient(135deg,#48c9b0,#138d75)}',
    '.file-attach .fa-icon.ic-txt{background:linear-gradient(135deg,#aab7b8,#566573)}',
    '.file-attach .fa-meta{flex:1;min-width:0}',
    '.file-attach .fa-name{font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.file-attach .fa-sub{font-size:11.5px;color:#c9c6e8;margin-top:3px;font-family:"JetBrains Mono",Consolas,monospace}',
    '.file-attach .fa-btn{flex:none;border:none;border-radius:999px;padding:9px 18px;font-weight:700;font-size:12.5px;',
      'background:linear-gradient(120deg,#FF7A5C,#FF8CD9);color:#fff;cursor:pointer;font-family:inherit;white-space:nowrap}',
    '@media (max-width:760px){ .file-attach{max-width:100%} .file-attach .fa-btn{padding:8px 13px} }'
  ].join('');

  function injectCssOnce() {
    if (document.getElementById('jerry-site-embed-css')) return;
    var st = document.createElement('style');
    st.id = 'jerry-site-embed-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ===== 附件卡片 =====
  var ATTACH_ICONS = {
    zip:['zip','7z','rar','tar','gz'], exe:['exe','msi','apk','dmg','iso','appimage'],
    pdf:['pdf'], doc:['doc','docx'], xls:['xls','xlsx','csv'], ppt:['ppt','pptx'],
    img:['png','jpg','jpeg','gif','webp','svg','bmp','avif','ico'],
    av:['mp3','wav','flac','aac','ogg','m4a','mp4','webm','mov','mkv','avi'],
    txt:['txt','md']
  };
  function iconOfName(name){
    var m = /\.([a-z0-9]+)$/i.exec(name||''); var ext = m ? m[1].toLowerCase() : '';
    for (var k in ATTACH_ICONS){ if (ATTACH_ICONS[k].indexOf(ext) !== -1) return k; }
    return 'file';
  }
  function buildAttach(el){
    if (el.dataset.faReady) return; el.dataset.faReady = '1';
    el.setAttribute('contenteditable', 'false');
    var href = el.getAttribute('data-href') || '';
    var name = el.getAttribute('data-name') || '附件';
    var size = el.getAttribute('data-size') || '';
    var icon = el.getAttribute('data-icon') || iconOfName(name);
    var glyph = {zip:'🗜️', exe:'💻', pdf:'📕', doc:'📘', xls:'📗', ppt:'📙', img:'🖼️', av:'🎬', txt:'📝', file:'📎'}[icon] || '📎';
    var a = document.createElement('a');
    a.className = 'fa-card';
    a.href = href; a.setAttribute('download', name); a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML =
      '<span class="fa-icon ic-' + icon + '">' + glyph + '</span>' +
      '<span class="fa-meta"><div class="fa-name"></div><div class="fa-sub"></div></span>' +
      '<span class="fa-btn">⬇ 下载</span>';
    a.querySelector('.fa-name').textContent = name;
    a.querySelector('.fa-sub').textContent = (size ? size + ' · ' : '') + '点击下载到本地';
    // 编辑器正文内：阻止点击跳转（避免误点离开编辑页），选中卡片后按 Delete 即可删除
    a.addEventListener('mousedown', function(e){
      if (el.isContentEditable || el.closest('[contenteditable="true"]')) e.preventDefault();
    });
    el.appendChild(a);
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

  /* 旧版本损坏数据自愈：裸 <iframe src="/packages/..."> 还原为标准占位块，
     并清掉崩解后外露的包名行 / 工具栏按钮文字行（如 "25%50%75%100%竖屏刷新新窗口"） */
  function pkgNameOf(src) {
    var m = String(src || '').match(/\/packages\/([^/]+)\//);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function isJunkBtnLine(t) {
    t = (t || '').replace(/\s/g, '');
    return /25%50%75%100%/.test(t) && /刷新/.test(t) && /新窗口/.test(t);
  }
  function isJunkTitleLine(t, pkgName) {
    t = (t || '').trim();
    if (!t || t.length > 40 || /[。.!?！？，,；;]/.test(t)) return false;
    if (pkgName && t === pkgName) return true;
    return /__/.test(t) && /\d/.test(t) && /^[\w\-\u4e00-\u9fa5]+$/.test(t);  // 形如 cropper__10___1_
  }
  function prevMeaningful(node) {
    var p = node.previousSibling;
    while (p && ((p.nodeType === 3 && !p.textContent.trim())
      || (p.nodeType === 1 && (/^(BR|SCRIPT|STYLE)$/i.test(p.tagName) || !p.textContent.trim())))) {
      p = p.previousSibling;   // 跳过空文本、<br>、空 <p>/<div>（编辑器会把空行渲染成 <p><br></p>）
    }
    return p;
  }
  function salvageIframes(root) {
    (root || document).querySelectorAll('iframe[src*="/packages/"]').forEach(function (f) {
      if (f.closest('.site-preview') || f.dataset.spSalvaged) return;
      var src = f.getAttribute('src') || '';
      var pkgName = pkgNameOf(src);

      // 向上最多清理 3 个前置块：工具栏文字行 + 包名行（可能只存在其一，顺序不定）
      for (var i = 0; i < 3; i++) {
        var p = prevMeaningful(f);
        if (!p || p.nodeType !== 1) break;
        var tx = p.textContent.trim();
        if (isJunkBtnLine(tx) || isJunkTitleLine(tx, pkgName)) {
          var before = p.previousSibling;
          p.parentNode.removeChild(p);
          if (before) f = f; /* no-op, keep anchor */
          continue;
        }
        break;
      }

      // 替换为标准占位块（scan 的 MutationObserver 会接着 build）
      var div = document.createElement('div');
      div.className = 'site-preview';
      div.setAttribute('data-src', src);
      div.setAttribute('data-zip', '');
      div.setAttribute('data-name', pkgName || '网站预览');
      div.setAttribute('data-w', f.getAttribute('data-w') || '72%');
      if (f.getAttribute('data-ratio') === 'portrait') div.setAttribute('data-ratio', 'portrait');
      f.dataset.spSalvaged = '1';
      if (f.parentNode) f.parentNode.replaceChild(div, f);
    });
  }

  function scan() {
    injectCssOnce();
    salvageIframes(document);
    document.querySelectorAll('.site-preview:not([data-sp-ready])').forEach(build);
    document.querySelectorAll('.file-attach:not([data-fa-ready])').forEach(buildAttach);
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
  window.__jerrySiteEmbedIconOf = iconOfName;
})();
