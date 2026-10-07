/* ============================================================
   Jerry CMS · 前台可视化布局编辑器（inline-editor v1）
   ------------------------------------------------------------
   仅本地：由 admin/bridge.js 在探测到本地 CMS 后加载，线上无此文件。
   在页面本体上直接：隐藏/显示模块、拖拽/按钮排序、改页面文案、
   调主题色/圆角/间距/宽度（实时预览）、保存、一键发布。
   配置与后台「🧩 布局」完全同源：/api/layout/config。
   ============================================================ */
(function () {
  if (window.__jlInlineEditor) return;
  window.__jlInlineEditor = true;

  var PAGE = document.body.dataset.page || '';
  var cfg = null;
  var editing = false;
  var dragId = null;
  var selectedId = null;
  var pageObserver = null;
  var refreshTimer = 0;

  /* ---------- 启动 ---------- */
  fetch('/api/layout/config')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.ok || !d.config) return;
      cfg = d.config;
      if (!cfg.global) cfg.global = {};
      if (!cfg.pages || !cfg.pages[PAGE]) {
        console.error('[JerryInlineEditor] No layout configuration found for page:', PAGE || '(missing data-page)');
        return;
      }
      buildBar();
      if (localStorage.getItem('jerryEditLayout') === '1' || /[?&]editLayout=1/.test(location.search)) enterEdit();
    })
    .catch(function (error) { console.error('[JerryInlineEditor] Unable to load layout configuration:', error); });

  function pc() { return cfg.pages[PAGE]; }
  function modById(id) { return (pc().modules || []).filter(function (m) { return m.id === id; })[0]; }

  /* ---------- Toast ---------- */
  function toast(msg, ok) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;top:74px;transform:translateX(-50%);z-index:2147483999;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:700;'
      + 'background:' + (ok === false ? 'linear-gradient(120deg,#ef4444,#f97316)' : 'linear-gradient(120deg,#B18CFF,#5CE1E6)')
      + ';color:#10102a;box-shadow:0 12px 30px rgba(0,0,0,.35);font-family:"Noto Sans SC",system-ui,sans-serif;pointer-events:none;transition:opacity .3s';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 2200);
  }

  /* ---------- 样式注入 ---------- */
  function injectCss() {
    if (document.getElementById('jl-ie-css')) return;
    var st = document.createElement('style');
    st.id = 'jl-ie-css';
    st.textContent = [
      '.jl-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483800;display:flex;align-items:center;gap:4px;',
      'padding:7px 9px;border-radius:999px;background:rgba(18,14,42,.88);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.25);',
      'box-shadow:0 16px 44px rgba(0,0,0,.5);font-family:"Noto Sans SC",system-ui,sans-serif}',
      '.jl-bar button{border:none;background:transparent;color:#e8e6fb;font-size:12.5px;font-weight:600;padding:8px 13px;border-radius:999px;cursor:pointer;white-space:nowrap;font-family:inherit;transition:.18s}',
      '.jl-bar button:hover{background:rgba(255,255,255,.12)}',
      '.jl-bar .jl-save{background:linear-gradient(120deg,#B18CFF,#5CE1E6);color:#10102a;font-weight:800}',
      '.jl-bar .jl-deploy{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);color:#fff;font-weight:800}',
      '.jl-bar .jl-sep{width:1px;height:20px;background:rgba(255,255,255,.18);margin:0 3px}',
      '.jl-panel{position:fixed;right:18px;bottom:74px;z-index:2147483800;width:min(380px,calc(100vw - 32px));max-height:min(68vh,680px);',
      'padding:14px;border-radius:18px;background:rgba(18,14,42,.96);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.25);',
      'box-shadow:0 22px 60px rgba(0,0,0,.55);display:none;overflow:auto;font-family:"Noto Sans SC",system-ui,sans-serif;color:#e8e6fb}',
      '.jl-panel.open{display:block}',
      '.jl-panel .row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:11px}',
      '.jl-panel .sw{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:#c9c6e8}',
      '.jl-panel input[type=color]{width:42px;height:30px;border:none;background:none;cursor:pointer;padding:0}',
      '.jl-panel input[type=range]{flex:1;min-width:150px;accent-color:#5CE1E6}',
      '.jl-panel b{font-variant-numeric:tabular-nums;min-width:42px;display:inline-block;text-align:right;font-size:11.5px}',
      '.jl-panel .jl-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '.jl-panel .jl-panel-head strong{font-size:14px}',
      '.jl-panel .jl-panel-head button,.jl-panel .jl-panel-tab{border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(255,255,255,.06);color:#e8e6fb;padding:7px 10px;cursor:pointer}',
      '.jl-panel .jl-panel-tabs{display:flex;gap:6px;margin-bottom:12px}',
      '.jl-panel .jl-panel-tab.active{border-color:rgba(92,225,230,.5);color:#5CE1E6;background:rgba(92,225,230,.08)}',
      '.jl-panel .jl-panel-view{display:none}.jl-panel .jl-panel-view.active{display:block}',
      '.jl-block-list{display:grid;gap:5px}',
      '.jl-block-item{display:flex;align-items:center;gap:6px;padding:5px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035)}',
      '.jl-block-item.selected{border-color:rgba(92,225,230,.6);background:rgba(92,225,230,.08)}',
      '.jl-block-item [data-jl-select]{flex:1;min-width:0;border:0;background:transparent;color:#e8e6fb;text-align:left;padding:7px;font:inherit;font-size:12px;cursor:pointer}',
      '.jl-block-item small{color:#aaa6c9;font-size:10px;white-space:nowrap}',
      '.jl-block-item [data-jl-block-action]{width:30px;height:30px;border:0;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}',
      '.jl-block-item [data-jl-block-action]:hover{background:rgba(255,255,255,.15)}',
      '.jl-panel .jl-editor-help{font-size:11px;line-height:1.65;color:#bcb8d7;margin:0 0 10px}',
      '.jl-panel .jl-selected-info{padding:10px;border-radius:10px;background:rgba(0,0,0,.18);font-size:11px;color:#c9c6e8;margin-bottom:10px}',
      'body.jl-editing [data-module].jl-selected{outline:2px solid #5CE1E6!important;outline-offset:4px;z-index:20}',
      'body.jl-editing [data-module].jl-selected>.jl-modbar{display:flex}',
      'body.jl-editing [data-module] iframe{pointer-events:none!important}',
      /* 博客页编辑时临时展开被 bridge 隐藏的左栏，便于编辑其中模块 */
      'body.jl-editing .sidebar{display:block!important}',
      /* 编辑模式：模块描边 */
      'body.jl-editing [data-module]{outline:2px dashed rgba(92,225,230,.65)!important;outline-offset:3px;transition:outline-color .15s}',
      'body.jl-editing [data-module]:hover{outline-color:#FF8CD9!important}',
      /* 已隐藏模块：编辑模式下保留虚线占位，便于恢复 */
      'body.jl-editing .jl-hidden{display:block!important;opacity:.32;filter:grayscale(.7);pointer-events:auto}',
      'body.jl-editing .jl-hidden::after{content:"已隐藏";position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:99990;background:#ef4444;color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;pointer-events:none}',
      /* 模块悬浮工具条 */
      '.jl-modbar{position:absolute;top:-13px;right:8px;z-index:99995;display:none;gap:3px;padding:3px;border-radius:999px;background:rgba(18,14,42,.92);border:1px solid rgba(255,255,255,.3);box-shadow:0 6px 18px rgba(0,0,0,.4)}',
      'body.jl-editing [data-module]:hover>.jl-modbar{display:flex}',
      '.jl-modbar button{border:none;background:transparent;color:#fff;width:25px;height:25px;border-radius:50%;cursor:pointer;font-size:12px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center}',
      '.jl-modbar button:hover{background:linear-gradient(120deg,#B18CFF,#5CE1E6);color:#10102a}',
      '.jl-modbar .jl-name{font-size:10.5px;color:#c9c6e8;display:flex;align-items:center;padding:0 7px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}',
      /* 可拖拽光标 */
      'body.jl-editing .jl-modbar [data-act="drag"]{cursor:grab;touch-action:none}',
      'body.jl-editing .jl-modbar [data-act="drag"]:active{cursor:grabbing}',
      /* 就地文案编辑 */
      'body.jl-editing [data-jl-text]{outline:2px dotted rgba(255,140,217,.7)!important;outline-offset:3px;border-radius:6px;cursor:text;background:rgba(255,140,217,.07)}',
      '.jl-hint{position:fixed;left:50%;top:66px;transform:translateX(-50%);z-index:2147483799;font-size:12px;color:#10102a;background:linear-gradient(120deg,#B18CFF,#5CE1E6);font-weight:700;padding:7px 16px;border-radius:999px;display:none;font-family:"Noto Sans SC",system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.3)}',
      'body.jl-editing .jl-hint{display:block}',
      /* 手机端：编辑工具条移到左下（避开右下搜索/桌宠底座与正文中央），按钮可横滑 */
      '@media (max-width:760px){',
      '.jl-bar{left:10px;right:10px;transform:none;bottom:calc(10px + env(safe-area-inset-bottom));justify-content:flex-start;',
      'padding:5px 7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}',
      '.jl-bar::-webkit-scrollbar{display:none}',
      '.jl-bar button{font-size:12px;padding:9px 12px;flex:none}',
      '.jl-panel{left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));width:auto;max-height:58vh}',
      '.jl-modbar .jl-name{display:none}',
      '}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ---------- 悬浮工具条 ---------- */
  function buildBar() {
    injectCss();
    var bar = document.createElement('div');
    bar.className = 'jl-bar';
    bar.innerHTML =
      '<button class="jl-toggle" type="button">🧩 编辑页面</button>' +
      '<button class="jl-blocks" type="button" style="display:none">▦ 区块</button>' +
      '<button class="jl-theme" type="button" style="display:none">🎨 外观</button>' +
      '<span class="jl-sep" style="display:none"></span>' +
      '<button class="jl-reset" type="button" style="display:none">↺ 还原</button>' +
      '<button class="jl-save" type="button" style="display:none">💾 保存布局</button>' +
      '<button class="jl-deploy" type="button" style="display:none">🚀 发布上线</button>';
    document.body.appendChild(bar);

    var panel = document.createElement('div');
    panel.className = 'jl-panel';
    panel.innerHTML =
      '<div class="jl-panel-head"><strong>页面编辑器</strong><button type="button" data-jl-close>关闭</button></div>' +
      '<div class="jl-panel-tabs"><button type="button" class="jl-panel-tab active" data-jl-panel="blocks">页面区块</button><button type="button" class="jl-panel-tab" data-jl-panel="theme">全局外观</button></div>' +
      '<section class="jl-panel-view active" data-jl-panel-view="blocks"><p class="jl-editor-help">点击页面区块进行选中；区块内部交互已暂停。支持就地编辑有虚线标记的文字、隐藏/恢复区块、上下排序或拖动区块手柄。</p>' +
      '<div class="jl-selected-info" data-jl-selected-info>选择一个区块以查看它的编辑状态。</div><div class="jl-block-list"></div></section>' +
      '<section class="jl-panel-view" data-jl-panel-view="theme"><div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">主题色</span>' +
      '<label class="sw">主紫<input type="color" data-g="violet"></label>' +
      '<label class="sw">青<input type="color" data-g="aqua"></label>' +
      '<label class="sw">珊瑚<input type="color" data-g="coral"></label>' +
      '<label class="sw">粉<input type="color" data-g="pink"></label></div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">圆角</span><input type="range" data-g="cardRadius" min="6" max="32"><b data-gv="cardRadius">18</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">板块间距</span><input type="range" data-g="sectionGap" min="10" max="120"><b data-gv="sectionGap">36</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">内容宽度</span><input type="range" data-g="contentWidth" min="860" max="1280" step="20"><b data-gv="contentWidth">1000</b>px</div>' +
      '<div style="font-size:11px;color:#9a96c0;margin-top:2px">调整会即时预览，保存后写入布局配置；上线需再点「🚀 发布上线」。</div></section>';
    document.body.appendChild(panel);

    var hint = document.createElement('div');
    hint.className = 'jl-hint';
    hint.textContent = '编辑模式：先选区块再调整；内容区交互已暂停，可直接编辑虚线标记文字';
    document.body.appendChild(hint);

    bar.querySelector('.jl-toggle').onclick = function () { editing ? exitEdit() : enterEdit(); };
    bar.querySelector('.jl-blocks').onclick = function () { openPanel('blocks'); };
    bar.querySelector('.jl-theme').onclick = function () { openPanel('theme'); };
    bar.querySelector('.jl-reset').onclick = resetLayout;
    bar.querySelector('.jl-save').onclick = saveLayout;
    bar.querySelector('.jl-deploy').onclick = deploy;
    panel.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-jl-panel]');
      if (tab) { openPanel(tab.dataset.jlPanel); return; }
      if (e.target.closest('[data-jl-close]')) { panel.classList.remove('open'); return; }
      var select = e.target.closest('[data-jl-select]');
      if (select) { selectModule(select.dataset.jlSelect, false); return; }
      var action = e.target.closest('[data-jl-block-action]');
      if (!action) return;
      var id = action.dataset.id;
      if (action.dataset.jlBlockAction === 'hide') {
        var m = modById(id);
        if (m) { m.hidden = !m.hidden; reapply(); toast(m.hidden ? '区块已隐藏，保存后生效' : '区块已恢复'); }
      } else if (action.dataset.jlBlockAction === 'up') move(id, -1);
      else if (action.dataset.jlBlockAction === 'down') move(id, 1);
    });

    // 外观控件
    panel.querySelectorAll('[data-g]').forEach(function (inp) {
      var key = inp.dataset.g;
      inp.addEventListener('input', function () {
        var v = inp.type === 'color' ? inp.value : Number(inp.value);
        cfg.global[key] = v;
        var bv = panel.querySelector('[data-gv="' + key + '"]');
        if (bv) bv.textContent = v;
        liveGlobal();
      });
    });
    watchPage();
  }

  function openPanel(view) {
    var panel = document.querySelector('.jl-panel');
    if (!panel) return;
    panel.classList.add('open');
    panel.querySelectorAll('[data-jl-panel]').forEach(function (button) {
      button.classList.toggle('active', button.dataset.jlPanel === view);
    });
    panel.querySelectorAll('[data-jl-panel-view]').forEach(function (section) {
      section.classList.toggle('active', section.dataset.jlPanelView === view);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  }

  function renderBlockList() {
    var list = document.querySelector('.jl-block-list');
    if (!list || !pc()) return;
    list.innerHTML = (pc().modules || []).map(function (m) {
      var selected = m.id === selectedId;
      return '<div class="jl-block-item' + (selected ? ' selected' : '') + '">' +
        '<button type="button" data-jl-select="' + escapeHtml(m.id) + '">' + escapeHtml(m.title || m.id) + '</button>' +
        '<small>' + (m.hidden ? '已隐藏' : '显示') + '</small>' +
        '<button type="button" data-jl-block-action="hide" data-id="' + escapeHtml(m.id) + '" aria-label="' + (m.hidden ? '恢复区块' : '隐藏区块') + '">' + (m.hidden ? '◉' : '◌') + '</button>' +
        (m.sortable === false ? '' :
          '<button type="button" data-jl-block-action="up" data-id="' + escapeHtml(m.id) + '" aria-label="上移区块">↑</button>' +
          '<button type="button" data-jl-block-action="down" data-id="' + escapeHtml(m.id) + '" aria-label="下移区块">↓</button>') +
        '</div>';
    }).join('');
    var selectedModule = modById(selectedId);
    var info = document.querySelector('[data-jl-selected-info]');
    if (info) info.textContent = selectedModule
      ? (selectedModule.title || selectedModule.id) + (selectedModule.hidden ? ' · 当前隐藏' : ' · 可见')
      : '选择一个区块以查看它的编辑状态。';
  }

  function selectModule(id, openInspector) {
    selectedId = id;
    document.querySelectorAll('[data-module].jl-selected').forEach(function (el) { el.classList.remove('jl-selected'); });
    document.querySelectorAll('[data-module]').forEach(function (el) {
      if (el.getAttribute('data-module') === id) el.classList.add('jl-selected');
    });
    renderBlockList();
    if (openInspector) openPanel('blocks');
  }

  function watchPage() {
    if (pageObserver) return;
    pageObserver = new MutationObserver(function (records) {
      if (!editing || !records.some(function (record) {
        var target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (target && target.closest && target.closest('.jl-panel,.jl-bar,.jl-modbar')) return false;
        return Array.prototype.some.call(record.addedNodes, function (node) {
          return node.nodeType === 1 && (node.matches('[data-module]') || node.querySelector('[data-module]'));
        });
      })) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        if (!editing) return;
        paintModules();
        paintTexts();
        renderBlockList();
      }, 40);
    });
    pageObserver.observe(document.body, { childList:true, subtree:true });
    document.addEventListener('pointerdown', guardPageInteraction, true);
    document.addEventListener('click', guardPageInteraction, true);
    document.addEventListener('dblclick', guardPageInteraction, true);
    document.addEventListener('contextmenu', guardPageInteraction, true);
    document.addEventListener('dragstart', guardPageInteraction, true);
    document.addEventListener('keydown', guardPageInteraction, true);
    document.addEventListener('wheel', guardPageInteraction, { capture:true, passive:false });
  }

  function guardPageInteraction(e) {
    if (!editing) return;
    var target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest('.jl-bar,.jl-panel,.jl-modbar')) return;
    var editable = target.closest('[data-jl-text][contenteditable="true"]');
    var module = target.closest('[data-module]');
    if (!module) return;
    selectModule(module.getAttribute('data-module'), true);
    if (editable) {
      if (e.type === 'pointerdown') e.stopImmediatePropagation();
      else if (e.type === 'click' || e.type === 'keydown') e.stopPropagation();
      return;
    }
    if (e.type === 'wheel' && !target.closest('#stage')) return;
    if (e.type === 'dragstart' && target.closest('.jl-modbar [data-act="drag"]')) return;
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
  }

  function syncPanel() {
    var g = cfg.global || {};
    document.querySelectorAll('.jl-panel [data-g]').forEach(function (inp) {
      var v = g[inp.dataset.g];
      if (v != null) inp.value = v;
      var bv = document.querySelector('.jl-panel [data-gv="' + inp.dataset.g + '"]');
      if (bv) bv.textContent = v;
    });
  }

  /* ---------- 实时外观（不落盘） ---------- */
  var liveStyle = null;
  function liveGlobal() {
    var g = cfg.global || {};
    if (!liveStyle) { liveStyle = document.createElement('style'); liveStyle.id = 'jl-live-overrides'; document.head.appendChild(liveStyle); }
    var rules = [];
    var vars = [];
    if (g.violet) vars.push('--violet:' + g.violet);
    if (g.aqua) vars.push('--aqua:' + g.aqua);
    if (g.coral) vars.push('--coral:' + g.coral);
    if (g.pink) vars.push('--pink:' + g.pink);
    if (g.cardRadius != null) vars.push('--card-radius:' + g.cardRadius + 'px');
    if (vars.length) rules.push(':root{' + vars.join(';') + '}');
    if (g.cardRadius != null) rules.push('.glass-card,.widget-card,.side-card,.friend-card,.moment-card,.tl-card,.article-card,.proj-card,.album-card,.apply-card,.toc,.lock-modal{border-radius:var(--card-radius) !important}');
    if (g.contentWidth != null) rules.push('.wrap{max-width:' + g.contentWidth + 'px}');
    if (g.sectionGap != null) rules.push('.main-content-centered{gap:' + g.sectionGap + 'px}');
    liveStyle.textContent = rules.join('\n');
  }

  /* ---------- 进入 / 退出编辑 ---------- */
  function enterEdit() {
    editing = true;
    localStorage.setItem('jerryEditLayout', '1');
    document.body.classList.add('jl-editing');
    syncPanel();
    paintModules();
    paintTexts();
    setBarEditing(true);
  }
  function exitEdit() {
    editing = false;
    localStorage.removeItem('jerryEditLayout');
    document.body.classList.remove('jl-editing');
    document.querySelectorAll('.jl-modbar').forEach(function (b) { b.remove(); });
    document.querySelectorAll('[data-module].jl-selected').forEach(function (el) { el.classList.remove('jl-selected'); });
    selectedId = null;
    document.querySelectorAll('[data-jl-text]').forEach(function (el) {
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-jl-text');
    });
    document.querySelectorAll('[data-module]').forEach(function (el) { el.removeAttribute('draggable'); el.draggable = false; });
    document.querySelector('.jl-panel').classList.remove('open');
    setBarEditing(false);
    // 丢弃未保存外观：用磁盘配置重新应用
    fetch('/api/layout/config').then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok && d.config) { cfg = d.config; window.__layoutConfig = cfg; window.JerryLayout && JerryLayout.reapply(); }
    }).catch(function () {});
  }
  function setBarEditing(on) {
    document.querySelector('.jl-bar .jl-toggle').textContent = on ? '✅ 完成编辑' : '🧩 编辑页面';
    ['.jl-blocks', '.jl-theme', '.jl-reset', '.jl-save', '.jl-deploy'].forEach(function (sel) {
      document.querySelector('.jl-bar ' + sel).style.display = on ? '' : 'none';
    });
    document.querySelector('.jl-bar .jl-sep').style.display = on ? '' : 'none';
  }

  /* ---------- 模块工具条 + 拖拽 ---------- */
  function paintModules() {
    document.querySelectorAll('[data-module]').forEach(function (el) {
      var id = el.getAttribute('data-module');
      var m = modById(id);
      if (!m) return;
      if (el.querySelector('.jl-modbar')) return;
      // 工具条需要模块自身做定位上下文
      var cs = getComputedStyle(el);
      if (cs.position === 'static') el.style.position = 'relative';
      var bar = document.createElement('div');
      bar.className = 'jl-modbar';
      bar.addEventListener('click', function (e) { e.stopPropagation(); });
      var sortable = m.sortable !== false;
      bar.innerHTML =
        (sortable ? '<button type="button" data-act="drag" draggable="true" title="拖动排序" aria-label="拖动排序">⠿</button><button type="button" data-act="up" title="上移">↑</button><button type="button" data-act="down" title="下移">↓</button>' : '') +
        '<button type="button" data-act="hide" title="隐藏/显示">' + (m.hidden ? '🙈' : '👁') + '</button>' +
        '<span class="jl-name">' + (m.title || m.id) + '</span>';
      bar.querySelector('[data-act="hide"]').onclick = function () { m.hidden = !m.hidden; reapply(); toast(m.hidden ? '已隐藏（保存后生效）' : '已显示'); };
      if (sortable) {
        bar.querySelector('[data-act="up"]').onclick = function () { move(id, -1); };
        bar.querySelector('[data-act="down"]').onclick = function () { move(id, 1); };
        if (!el._jlDragBound) {
          el._jlDragBound = true;
          el.draggable = false;
          el.addEventListener('dragstart', function (e) {
            if (!e.target.closest('.jl-modbar [data-act="drag"]')) { e.preventDefault(); return; }
            dragId = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id);
          });
          el.addEventListener('dragend', function () {
            dragId = null;
            document.querySelectorAll('.jl-dragover').forEach(function (x) { x.classList.remove('jl-dragover'); });
          });
          el.addEventListener('dragover', function (e) {
            if (!editing || !dragId || dragId === id || !sameGroup(dragId, id)) return;
            e.preventDefault(); el.classList.add('jl-dragover');
          });
          el.addEventListener('dragleave', function () { el.classList.remove('jl-dragover'); });
          el.addEventListener('drop', function (e) {
            e.preventDefault(); e.stopPropagation(); el.classList.remove('jl-dragover');
            if (editing && dragId && dragId !== id && sameGroup(dragId, id)) moveTo(dragId, id);
          });
        }
      }
      el.appendChild(bar);
    });
    renderBlockList();
  }

  // 两个模块是否属于同一可排序父容器（同组才能换序）
  function sameGroup(a, b) {
    var ea = document.querySelector('[data-module="' + a + '"]');
    var eb = document.querySelector('[data-module="' + b + '"]');
    return ea && eb && ea.parentNode === eb.parentNode;
  }
  function move(id, dir) {
    var arr = pc().modules;
    var i = arr.findIndex(function (m) { return m.id === id; });
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    // 跨过不可排序/不同组的项
    while (j >= 0 && j < arr.length) {
      var el = document.querySelector('[data-module="' + arr[j].id + '"]');
      var me = document.querySelector('[data-module="' + id + '"]');
      if (arr[j].sortable !== false && el && el.parentNode === me.parentNode) break;
      j += dir;
    }
    if (j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    reapply();
  }
  function moveTo(srcId, targetId) {
    var arr = pc().modules;
    var si = arr.findIndex(function (m) { return m.id === srcId; });
    var ti = arr.findIndex(function (m) { return m.id === targetId; });
    if (si < 0 || ti < 0) return;
    var t = arr.splice(si, 1)[0];
    if (si < ti) ti--;
    arr.splice(ti, 0, t);
    reapply();
  }

  /* ---------- 文案就地编辑 ---------- */
  function paintTexts() {
    var texts = (pc() && pc().texts) || [];
    texts.forEach(function (t) {
      if (!t.selector) return;
      document.querySelectorAll(t.selector).forEach(function (el) {
        var hasValue = t.value != null && t.value !== '';
        var hasDefault = t.default != null;
        var value = hasValue ? t.value : (hasDefault ? t.default : el.textContent);
        if ((hasValue || hasDefault) && el.textContent !== value && !el.hasAttribute('data-jl-text')) el.textContent = value;
        if (!editing || el.hasAttribute('data-jl-text')) return;
        el.setAttribute('data-jl-text', t.key);
        el.contentEditable = 'true';
        if (el._jlTextBound) return;
        el._jlTextBound = true;
        el.addEventListener('input', function () {
          t.value = el.textContent;
        });
        el.addEventListener('blur', function () {
          var v = el.textContent.trim();
          t.value = (t.default != null && v === t.default) ? '' : v;
        });
      });
    });
  }

  /* ---------- 应用内存配置到页面 ---------- */
  function reapply() {
    if (window.JerryLayout && JerryLayout.setConfig) JerryLayout.setConfig(cfg);
    else window.__layoutConfig = cfg;
    // reapply 会清掉工具条，编辑模式下重建
    document.querySelectorAll('.jl-modbar').forEach(function (b) { b.remove(); });
    paintModules();
    if (selectedId) selectModule(selectedId, false);
  }

  /* ---------- 保存 / 还原 / 发布 ---------- */
  function saveLayout() {
    fetch('/api/layout/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg)
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) { window.__layoutConfig = cfg; if (window.JerryLayout) JerryLayout.reapply(); toast('💾 布局已保存到本地'); }
      else toast('❌ ' + (d.error || '保存失败'), false);
    }).catch(function (e) { toast('❌ 保存失败', false); });
  }
  function resetLayout() {
    if (!confirm('放弃所有未保存的调整，恢复为上次保存的布局？')) return;
    fetch('/api/layout/config').then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok || !d.config) throw new Error('读取失败');
      cfg = d.config;
      window.__layoutConfig = cfg;
      if (liveStyle) liveStyle.textContent = '';
      if (window.JerryLayout) JerryLayout.reapply();
      syncPanel();
      document.querySelectorAll('.jl-modbar').forEach(function (b) { b.remove(); });
      paintModules();
      // 文案恢复：重渲染 DOM 文本最稳的方式是刷新
      toast('已恢复为上次保存的布局，正在刷新…');
      setTimeout(function () { location.reload(); }, 500);
    }).catch(function () { toast('❌ 恢复失败', false); });
  }
  function deploy() {
    if (!confirm('保存当前布局并发布上线（推送到 GitHub，线上 1 分钟左右更新）？')) return;
    fetch('/api/layout/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg)
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || '保存失败');
      toast('🚀 正在推送上线…');
      return fetch('/api/deploy/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) toast('✅ 已发布上线，Vercel 部署约 1 分钟');
      else toast('❌ 发布失败：' + (d.error || ''), false);
    }).catch(function (e) { toast('❌ ' + e.message, false); });
  }
})();
