/* ============================================================
   Jerry CMS · 前台可视化布局编辑器（inline-editor v1）
   ------------------------------------------------------------
   由 admin/bridge.js 在管理员验证后加载，访客不会运行。
   在页面本体上直接：隐藏/显示模块、拖拽/按钮排序、改页面文案、
   调主题色/圆角/间距/宽度（实时预览）、保存、一键发布。
   页面结构、文字和外观均在页面本体编辑，配置写入 /api/layout/config。
   ============================================================ */
(function () {
  if (window.__jlInlineEditor) return;
  window.__jlInlineEditor = true;

  var PAGE = document.body.dataset.page || '';
  var cfg = null;
  var editing = false;
  var dirty = false;
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
      '.jl-panel .jl-panel-head{position:sticky;top:-14px;z-index:3;padding:6px 0 9px;background:rgba(18,14,42,.98)}',
      '.jl-panel .jl-panel-head strong{font-size:14px}',
      '.jl-panel .jl-panel-head button,.jl-panel .jl-panel-tab{border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(255,255,255,.06);color:#e8e6fb;padding:7px 10px;cursor:pointer}',
      '.jl-panel .jl-panel-tabs{display:flex;gap:6px;margin-bottom:12px}',
      '.jl-panel .jl-panel-tabs{position:sticky;top:33px;z-index:2;padding:4px 0 8px;background:rgba(18,14,42,.98)}',
      '.jl-panel .jl-panel-tab.active{border-color:rgba(92,225,230,.5);color:#5CE1E6;background:rgba(92,225,230,.08)}',
      '.jl-panel .jl-panel-view{display:none}.jl-panel .jl-panel-view.active{display:block}',
      '.jl-block-list{display:grid;gap:5px}',
      '.jl-block-item{display:flex;align-items:center;gap:6px;padding:5px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035)}',
      '.jl-block-item.selected{border-color:rgba(92,225,230,.6);background:rgba(92,225,230,.08)}',
      '.jl-block-item [data-jl-select]{flex:1;min-width:0;border:0;background:transparent;color:#e8e6fb;text-align:left;padding:7px;font:inherit;font-size:12px;cursor:pointer}',
      '.jl-block-item small{color:#aaa6c9;font-size:10px;white-space:nowrap}',
      '.jl-block-item [data-jl-block-action]{width:30px;height:30px;border:0;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}',
      '.jl-block-item [data-jl-block-action]:hover{background:rgba(255,255,255,.15)}',
      '.jl-block-group{display:grid;gap:7px;margin:12px 0 16px}',
      '.jl-block-group-head{display:flex;align-items:center;gap:8px;padding:0 3px;color:#9b97bd;font:10px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}',
      '.jl-block-group-head:after{content:"";height:1px;flex:1;background:rgba(255,255,255,.1)}',
      '.jl-block-item{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:8px;padding:8px;border-radius:12px}',
      '.jl-block-item.selected{box-shadow:inset 0 0 0 1px rgba(92,225,230,.18)}',
      '.jl-block-item.is-hidden{opacity:.58}',
      '.jl-block-item.is-unavailable{opacity:.5}',
      '.jl-block-item [data-jl-select]{display:flex;align-items:center;gap:9px;padding:4px 2px;min-height:34px}',
      '.jl-block-index{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:rgba(177,140,255,.12);color:#c7adff;font:10px ui-monospace,monospace}',
      '.jl-block-copy{display:grid;gap:2px;min-width:0}',
      '.jl-block-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:650}',
      '.jl-block-copy small{color:#aaa6c9;font-size:10px}',
      '.jl-block-actions{display:flex;align-items:center;gap:3px}',
      '.jl-block-item [data-jl-block-action]{width:27px;height:27px;border-radius:8px;color:#cbc8e6}',
      '.jl-block-item [data-jl-block-action]:disabled{opacity:.32;cursor:not-allowed}',
      '.jl-block-item [data-jl-drag]{width:25px;height:30px;border:0;background:transparent;color:#9b97bd;cursor:grab;touch-action:none}',
      '.jl-block-grip{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.04);color:#9b97bd;font-size:12px}',
      '.jl-block-item.jl-dragover{border-color:#5CE1E6;transform:translateY(2px)}',
      '.jl-panel .jl-editor-help{padding:10px 11px;border:1px solid rgba(92,225,230,.16);border-radius:11px;background:rgba(92,225,230,.045)}',
      '.jl-panel .jl-selected-info{display:flex;align-items:center;gap:8px;background:rgba(177,140,255,.08);border:1px solid rgba(177,140,255,.16)}',
      '.jl-selected-dot{width:7px;height:7px;border-radius:50%;background:#5CE1E6;box-shadow:0 0 10px #5CE1E6;flex:none}',
      '.jl-block-section-label{margin:15px 2px 4px;color:#8d88b3;font:10px ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase}',
      '.jl-home-editor{display:grid;gap:14px}',
      '.jl-home-group{display:grid;gap:9px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.025)}',
      '.jl-home-group h3{margin:0;color:#dcd8f4;font-size:12px}',
      '.jl-home-colors,.jl-home-choices,.jl-home-toggles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
      '.jl-home-colors label,.jl-home-range{display:grid;gap:6px;color:#aaa6c9;font-size:10px}',
      '.jl-home-colors label{grid-template-columns:1fr 38px;align-items:center}',
      '.jl-home-colors input{width:36px;height:28px;padding:0;border:0;background:none}',
      '.jl-home-range{grid-template-columns:1fr auto;align-items:center}',
      '.jl-home-range input{grid-column:1/-1;width:100%;accent-color:#5CE1E6}',
      '.jl-home-range output{color:#5CE1E6;font:10px ui-monospace,monospace}',
      '.jl-home-choices button,.jl-home-toggles label{min-width:0;padding:8px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:rgba(255,255,255,.035);color:#c9c6e8;font-family:inherit;font-size:10px;text-align:left;cursor:pointer}',
      '.jl-home-choices button.active{border-color:rgba(92,225,230,.5);background:rgba(92,225,230,.09);color:#5CE1E6}',
      '.jl-home-toggles label{display:flex;align-items:center;gap:7px}',
      '.jl-home-toggles input{accent-color:#5CE1E6}',
      '.jl-home-font,.jl-page-font{width:100%;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:#17142b;color:#e8e6fb}',
      '.jl-page-appearance{display:grid;gap:10px;margin:12px 0}',
      '.jl-appearance-card{padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.025)}',
      '.jl-appearance-card h3{margin:0 0 10px;font-size:11px;color:#dcd8f4}',
      'body.jl-editing [data-module]{position:relative;transition:box-shadow .18s ease,filter .18s ease}',
      'body.jl-editing [data-module].jl-selected{outline:2px solid #5CE1E6!important;outline-offset:4px;box-shadow:0 0 0 5px rgba(92,225,230,.11),0 12px 32px rgba(0,0,0,.14);z-index:20}',
      '.jl-panel .jl-editor-help{font-size:11px;line-height:1.65;color:#bcb8d7;margin:0 0 10px}',
      'body.jl-editing [data-module].jl-selected>.jl-modbar{display:flex}',
      'body.jl-editing [data-module] iframe{pointer-events:none!important}',
      /* 博客页编辑时临时展开被 bridge 隐藏的左栏，便于编辑其中模块 */
      'body.jl-editing .sidebar{display:block!important}',
      /* 已隐藏模块：编辑模式下保留低对比占位，便于恢复 */
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
      'body.jl-editing [data-jl-text]{outline:0!important;border-radius:4px;cursor:text;background:linear-gradient(transparent 72%,rgba(255,140,217,.11) 72%);box-shadow:inset 0 -2px rgba(255,140,217,.72)}',
      'body.jl-editing [data-jl-text]:focus{background:rgba(255,140,217,.08);box-shadow:0 0 0 3px rgba(255,140,217,.15),inset 0 -2px #ff8cd9}',
      '.jl-hint{position:fixed;left:50%;top:66px;transform:translateX(-50%);z-index:2147483799;font-size:12px;color:#10102a;background:linear-gradient(120deg,#B18CFF,#5CE1E6);font-weight:700;padding:7px 16px;border-radius:999px;display:none;font-family:"Noto Sans SC",system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.3)}',
      'body.jl-editing .jl-hint{display:block}',
      /* 手机端：编辑工具条移到左下（避开右下搜索/桌宠底座与正文中央），按钮可横滑 */
      '@media (max-width:760px){',
      '.jl-bar{left:10px;right:10px;transform:none;bottom:calc(10px + env(safe-area-inset-bottom));justify-content:flex-start;',
      'padding:5px 7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}',
      '.jl-bar::-webkit-scrollbar{display:none}',
      '.jl-bar button{font-size:12px;padding:9px 12px;flex:none}',
      '.jl-panel{left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));width:auto;max-height:55dvh;padding:12px}',
      '.jl-modbar .jl-name{display:none}',
      '.jl-block-item{grid-template-columns:26px minmax(0,1fr) auto}',
      '.jl-home-colors,.jl-home-choices,.jl-home-toggles{grid-template-columns:1fr 1fr}',
      '}'
    ].join('');
    st.textContent += [
      'body.jl-editing{margin-right:410px!important;transition:margin-right .24s cubic-bezier(.2,.8,.2,1)}',
      '.jl-panel{position:fixed;inset:12px 12px 12px auto;z-index:2147483800;width:min(386px,calc(100vw - 24px));height:auto;max-height:none;',
      'padding:0;border:1px solid rgba(255,255,255,.13);border-radius:24px;background:linear-gradient(165deg,rgba(29,25,53,.985),rgba(15,14,28,.99));',
      'box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(24px);overflow:hidden}',
      '.jl-panel.open{display:flex;flex-direction:column}',
      '.jl-panel .jl-panel-head{position:relative;top:auto;z-index:3;flex:none;margin:0;padding:19px 18px 15px;background:transparent}',
      '.jl-panel .jl-panel-head strong{display:flex;align-items:center;gap:10px;font-size:15px;letter-spacing:.01em}',
      '.jl-panel .jl-panel-head strong:before{content:"J";display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:linear-gradient(140deg,#b18cff,#5ce1e6);color:#17142b;font-size:14px;font-weight:900}',
      '.jl-panel .jl-panel-head button{padding:7px 11px;border-radius:10px;color:#c9c6e8;font-size:11px}',
      '.jl-panel-context{display:grid;gap:3px;margin:-8px 18px 14px;padding:0 0 13px;border-bottom:1px solid rgba(255,255,255,.075)}',
      '.jl-panel-context span{color:#8d88ad;font:9px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}',
      '.jl-panel-context strong{color:#e1def5;font-size:12px;font-weight:600}',
      '.jl-panel .jl-panel-tabs{position:relative;top:auto;z-index:2;flex:none;margin:0 14px 12px;padding:4px;border:1px solid rgba(255,255,255,.075);border-radius:13px;background:rgba(0,0,0,.17)}',
      '.jl-panel .jl-panel-tab{flex:1;padding:9px 8px;border:1px solid transparent;border-radius:10px;background:transparent;color:#aaa6c9;font-family:inherit;font-size:11px;font-weight:600;white-space:nowrap}',
      '.jl-panel .jl-panel-tab.active{border-color:rgba(177,140,255,.23);background:linear-gradient(135deg,rgba(177,140,255,.16),rgba(92,225,230,.08));color:#e7e0ff}',
      '.jl-panel .jl-panel-view{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;padding:0 16px 18px;scrollbar-color:rgba(177,140,255,.3) transparent;scrollbar-width:thin}',
      '.jl-panel .jl-editor-help{margin:0 0 12px;padding:10px 12px;border:0;border-radius:12px;background:rgba(255,255,255,.035);color:#aaa6c9;font-size:11px;line-height:1.65}',
      '.jl-panel .jl-selected-info{margin:0 0 15px;padding:12px 13px;border:1px solid rgba(92,225,230,.14);border-radius:13px;background:linear-gradient(110deg,rgba(92,225,230,.08),rgba(177,140,255,.055));color:#e1def5;font-size:11px}',
      '.jl-block-group{gap:6px;margin:0 0 17px}',
      '.jl-block-group-head{padding:0 3px 3px;color:#8580a8;font:600 10px "Noto Sans SC",system-ui,sans-serif;letter-spacing:.1em}',
      '.jl-block-group-head span{display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:7px;background:rgba(255,255,255,.055);color:#aaa6c9;font:10px ui-monospace,monospace}',
      '.jl-block-item{grid-template-columns:27px minmax(0,1fr) auto;gap:5px;padding:7px;border-color:rgba(255,255,255,.055);border-radius:13px;background:rgba(255,255,255,.025);transition:background .18s,border-color .18s,transform .18s}',
      '.jl-block-item:hover{border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.05)}',
      '.jl-block-item.selected{border-color:rgba(92,225,230,.3);background:linear-gradient(100deg,rgba(92,225,230,.09),rgba(177,140,255,.055));box-shadow:inset 3px 0 #5ce1e6}',
      '.jl-block-item.is-hidden{opacity:.65}',
      '.jl-block-item.is-unavailable{border-style:solid;opacity:.46}',
      '.jl-block-index{width:25px;height:25px;background:rgba(255,255,255,.055);color:#a9a4c8;font-size:9px}',
      '.jl-block-item.selected .jl-block-index{background:rgba(92,225,230,.12);color:#8ef0ef}',
      '.jl-block-copy strong{font-size:11.5px;font-weight:600;color:#e1def5}',
      '.jl-block-copy small{color:#777391;font-size:9px}',
      '.jl-block-actions{gap:2px}',
      '.jl-block-actions small{max-width:48px;overflow:hidden;color:#777391;font-size:9px}',
      '.jl-block-item [data-jl-block-action]{width:25px;height:25px;background:transparent;color:#aaa6c9}',
      '.jl-block-item [data-jl-block-action]:hover{background:rgba(255,255,255,.09);color:#fff}',
      '.jl-block-item [data-jl-drag]{width:25px;height:28px;border-radius:8px;background:transparent;color:#777391;font-size:14px}',
      '.jl-block-item [data-jl-drag]:hover{background:rgba(255,255,255,.07);color:#d8d4ef}',
      '.jl-panel .jl-appearance-card{padding:13px;border-color:rgba(255,255,255,.07);border-radius:15px;background:rgba(255,255,255,.025)}',
      '.jl-panel .jl-appearance-card h3{margin-bottom:12px;color:#c9c6e8;font-size:11px;letter-spacing:.03em}',
      '.jl-panel .jl-home-group{padding:13px;border-color:rgba(255,255,255,.07);border-radius:15px;background:rgba(255,255,255,.025)}',
      '.jl-panel .jl-home-group h3{font-size:11px;color:#c9c6e8}',
      '.jl-panel .jl-home-colors label,.jl-panel .jl-home-range{font-size:10.5px;color:#aaa6c9}',
      '.jl-panel .jl-home-choices button,.jl-panel .jl-home-toggles label{border-color:rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.035);color:#c9c6e8;font-size:10.5px}',
      '.jl-panel .jl-home-choices button:hover,.jl-panel .jl-home-toggles label:hover{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06)}',
      '.jl-panel .jl-home-choices button.active{border-color:rgba(92,225,230,.35);background:rgba(92,225,230,.09);color:#91eeee}',
      '.jl-panel .jl-home-font,.jl-panel .jl-page-font{border-color:rgba(255,255,255,.1);border-radius:10px;background:#171529;font-size:11px}',
      '.jl-panel .jl-panel-view[data-jl-panel-view="theme"]>.jl-appearance-card:first-child{margin-top:2px}',
      'body.jl-editing [data-module]{outline:0!important;outline-offset:0;transition:box-shadow .18s ease,filter .18s ease}',
      'body.jl-editing [data-module]:hover{outline:0!important;box-shadow:0 0 0 1px rgba(177,140,255,.36),0 10px 32px rgba(18,14,42,.14)}',
      '.jl-selection-tag{position:absolute;top:-11px;left:12px;z-index:99994;padding:5px 9px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(29,25,53,.96);color:#dcd7f1;font:10px "Noto Sans SC",system-ui,sans-serif;box-shadow:0 5px 16px rgba(0,0,0,.2);opacity:0;transform:translateY(3px);transition:opacity .16s,transform .16s;pointer-events:none;white-space:nowrap}',
      'body.jl-editing [data-module]:hover>.jl-selection-tag,body.jl-editing [data-module].jl-selected>.jl-selection-tag{opacity:1;transform:translateY(0)}',
      'body.jl-editing [data-module].jl-selected{outline:2px solid #a78bfa!important;outline-offset:3px;box-shadow:0 0 0 7px rgba(167,139,250,.12),0 18px 46px rgba(18,14,42,.17);z-index:20}',
      'body.jl-editing [data-module].jl-selected>.jl-selection-tag{border-color:rgba(177,140,255,.5);background:linear-gradient(120deg,#b18cff,#84e8e9);color:#19152e;font-weight:800}',
      '.jl-modbar{top:8px;right:8px;padding:4px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(24,21,43,.95);box-shadow:0 8px 24px rgba(0,0,0,.2);backdrop-filter:blur(12px)}',
      '.jl-modbar button{width:28px;height:28px;border-radius:8px;color:#dedaf3}',
      '.jl-modbar button:hover{background:rgba(177,140,255,.22);color:#fff}',
      '.jl-bar{position:fixed;left:18px;right:430px;top:14px;bottom:auto;transform:none;z-index:2147483801;justify-content:flex-start;width:max-content;max-width:calc(100vw - 450px);',
      'padding:6px;border:1px solid rgba(255,255,255,.13);border-radius:16px;background:rgba(25,22,44,.9);box-shadow:0 12px 36px rgba(0,0,0,.22);backdrop-filter:blur(20px)}',
      '.jl-bar button{padding:9px 12px;border-radius:11px;font-size:11px}',
      '.jl-bar .jl-toggle{background:rgba(255,255,255,.06)}',
      '.jl-bar .jl-save{background:linear-gradient(120deg,#b18cff,#5ce1e6)}',
      '.jl-bar .jl-deploy{background:linear-gradient(120deg,#ff856c,#ee81c6)}',
      '.jl-status{display:none;align-items:center;gap:7px;padding:0 8px;color:#9995b5;font-size:10px;white-space:nowrap}',
      '.jl-status i{width:7px;height:7px;border-radius:50%;background:#69d8ad;box-shadow:0 0 9px rgba(105,216,173,.45)}',
      '.jl-status.is-dirty{color:#f4cb87}',
      '.jl-status.is-dirty i{background:#f4bd65;box-shadow:0 0 9px rgba(244,189,101,.45)}',
      '.jl-bar .jl-sep{height:18px;background:rgba(255,255,255,.12)}',
      '.jl-hint{display:none!important}',
      '@media(max-width:900px){body.jl-editing{margin-right:386px!important}.jl-panel{inset:12px 12px 12px auto;width:min(360px,calc(100vw - 24px))}.jl-bar{right:390px;max-width:calc(100vw - 410px);overflow-x:auto;scrollbar-width:none}.jl-bar button{flex:none}.jl-status{display:none!important}}',
      '@media(max-width:760px){body.jl-editing{margin-right:0!important}.jl-panel{inset:auto 0 0;width:100%;height:min(72dvh,680px);max-height:72dvh;border-radius:22px 22px 0 0;border-bottom:0}',
      '.jl-panel .jl-panel-head{padding:15px 16px 11px}.jl-panel .jl-panel-tabs{margin:0 12px 10px}.jl-panel .jl-panel-view{padding:0 13px calc(18px + env(safe-area-inset-bottom))}',
      '.jl-bar{left:10px;right:10px;top:10px;bottom:auto;width:auto;max-width:none;overflow-x:auto;scrollbar-width:none;padding:5px}',
      '.jl-bar::-webkit-scrollbar{display:none}.jl-bar button{padding:8px 10px;font-size:10.5px}',
      '.jl-status{display:none!important}',
      '.jl-modbar .jl-name{display:none}body.jl-editing .jl-hint{display:none!important}',
      'body.jl-editing [data-module].jl-selected{outline-width:2px!important;outline-offset:2px}',
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
      '<button class="jl-deploy" type="button" style="display:none">🚀 发布上线</button>' +
      '<span class="jl-status"><i></i><span>已保存</span></span>';
    document.body.appendChild(bar);

    var panel = document.createElement('div');
    panel.className = 'jl-panel';
    var pageNames = { index:'首页模板库', blog:'博客文章列表', post:'文章详情', friends:'友情链接', projects:'项目展示', rumi:'Rumi 英语' };
    panel.innerHTML =
      '<div class="jl-panel-head"><strong>页面编辑</strong><button type="button" data-jl-close aria-label="收起编辑面板">收起</button></div>' +
      '<div class="jl-panel-context"><span>JERRY / VISUAL STUDIO</span><strong>' + escapeHtml(pageNames[PAGE] || '当前页面') + '</strong></div>' +
      '<div class="jl-panel-tabs"><button type="button" class="jl-panel-tab active" data-jl-panel="blocks">区块</button><button type="button" class="jl-panel-tab" data-jl-panel="theme">页面外观</button>' +
      (PAGE === 'index' ? '<button type="button" class="jl-panel-tab" data-jl-panel="home">首页设计</button>' : '') + '</div>' +
      '<section class="jl-panel-view active" data-jl-panel-view="blocks"><p class="jl-editor-help">选中画布上的区块，或在结构树中定位。编辑时页面内容的点击、拖动等交互会暂停；底边高亮的文字可直接改写。</p>' +
      '<div class="jl-selected-info" data-jl-selected-info><i class="jl-selected-dot"></i><span>选择一个区块以查看它的编辑状态。</span></div><div class="jl-block-list"></div></section>' +
      '<section class="jl-panel-view" data-jl-panel-view="theme"><div class="jl-appearance-card"><h3>全站主题</h3><div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">主题色</span>' +
      '<label class="sw">主紫<input type="color" data-g="violet"></label>' +
      '<label class="sw">青<input type="color" data-g="aqua"></label>' +
      '<label class="sw">珊瑚<input type="color" data-g="coral"></label>' +
      '<label class="sw">粉<input type="color" data-g="pink"></label></div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">圆角</span><input type="range" data-g="cardRadius" min="6" max="32"><b data-gv="cardRadius">18</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">板块间距</span><input type="range" data-g="sectionGap" min="10" max="120"><b data-gv="sectionGap">36</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">内容宽度</span><input type="range" data-g="contentWidth" min="860" max="1280" step="20"><b data-gv="contentWidth">1000</b>px</div>' +
      '</div><div class="jl-appearance-card"><h3>当前页面</h3><div class="jl-page-appearance">' +
      '<label class="sw">背景色<input type="color" data-p="background"></label><label class="sw">文字色<input type="color" data-p="foreground"></label>' +
      '<label class="sw">辅助文字<input type="color" data-p="muted"></label><label class="sw">强调色<input type="color" data-p="accent"></label>' +
      '<label class="sw">卡片表面<input type="color" data-p="panel"></label><label style="font-size:10px;color:#c9c6e8">字体<select class="jl-page-font" data-p="font"><option value="system">系统现代</option><option value="sans">清爽无衬线</option><option value="serif">编辑衬线</option><option value="mono">技术等宽</option></select></label>' +
      '<label class="jl-home-range">内容宽度 <output data-pv="contentWidth"></output><input type="range" min="720" max="1800" step="20" data-p="contentWidth"></label>' +
      '<label class="jl-home-range">卡片圆角 <output data-pv="cardRadius"></output><input type="range" min="0" max="40" data-p="cardRadius"></label>' +
      '<label class="jl-home-range">板块间距 <output data-pv="sectionGap"></output><input type="range" min="8" max="100" data-p="sectionGap"></label></div></div>' +
      '<div style="font-size:11px;color:#9a96c0;margin-top:2px">调整会即时预览；保存后写入当前布局。发布上线需再点「🚀 发布上线」。</div></section>' +
      (PAGE === 'index' ? '<section class="jl-panel-view" data-jl-panel-view="home"><div class="jl-home-editor"></div></section>' : '');
    document.body.appendChild(panel);

    var hint = document.createElement('div');
    hint.className = 'jl-hint';
    hint.textContent = '编辑模式：选择区块后调整页面；底边高亮的文字可直接编辑';
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
      if (select) { selectModule(select.dataset.jlSelect, false, true); return; }
      var homeChoice = e.target.closest('[data-home-key][data-home-value]');
      if (homeChoice) {
        cfg.home[homeChoice.dataset.homeKey] = homeChoice.dataset.homeValue;
        renderHomeEditor();
        liveHome();
        setDirty(true);
        return;
      }
      var action = e.target.closest('[data-jl-block-action]');
      if (!action) return;
      var id = action.dataset.id;
      if (action.dataset.jlBlockAction === 'hide') {
        var m = modById(id);
        if (m) { m.hidden = !m.hidden; reapply(); setDirty(true); toast(m.hidden ? '区块已隐藏，保存后生效' : '区块已恢复'); }
      } else if (action.dataset.jlBlockAction === 'up') move(id, -1);
      else if (action.dataset.jlBlockAction === 'down') move(id, 1);
    });

    panel.addEventListener('input', function (e) {
      var homeInput = e.target.closest('[data-home-key]');
      if (homeInput && homeInput.type !== 'checkbox') {
        setHomeValue(homeInput, homeInput.type === 'range' ? Number(homeInput.value) : homeInput.value);
        liveHome();
        setDirty(true);
        return;
      }
      var pageInput = e.target.closest('[data-p]');
      if (pageInput) {
        setPageAppearance(pageInput, pageInput.type === 'range' ? Number(pageInput.value) : pageInput.value);
        reapply();
        setDirty(true);
      }
    });
    panel.addEventListener('change', function (e) {
      var homeInput = e.target.closest('[data-home-key]');
      if (homeInput) {
        if (homeInput.type === 'checkbox') setHomeValue(homeInput, homeInput.checked);
        else if (homeInput.type !== 'range' && homeInput.type !== 'color') setHomeValue(homeInput, homeInput.value);
        liveHome();
        setDirty(true);
      }
      if (e.target.matches('[data-p]')) reapply();
    });
    panel.addEventListener('dragstart', function (e) {
      var handle = e.target.closest('[data-jl-drag][draggable="true"]');
      var row = handle && handle.closest('.jl-block-item');
      if (!row) return;
      dragId = row.dataset.id;
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); }
    });
    panel.addEventListener('dragend', function () {
      dragId = null;
      panel.querySelectorAll('.jl-dragover').forEach(function (row) { row.classList.remove('jl-dragover'); });
    });
    panel.addEventListener('dragover', function (e) {
      var row = e.target.closest('.jl-block-item[data-id]');
      var targetModule = row && modById(row.dataset.id);
      if (!row || !targetModule || targetModule.sortable === false || !dragId ||
          row.dataset.id === dragId || !sameGroup(dragId, row.dataset.id)) return;
      e.preventDefault();
      row.classList.add('jl-dragover');
    });
    panel.addEventListener('dragleave', function (e) {
      var row = e.target.closest('.jl-block-item');
      if (row && !row.contains(e.relatedTarget)) row.classList.remove('jl-dragover');
    });
    panel.addEventListener('drop', function (e) {
      var row = e.target.closest('.jl-block-item[data-id]');
      var targetModule = row && modById(row.dataset.id);
      if (!row || !targetModule || targetModule.sortable === false || !dragId ||
          row.dataset.id === dragId || !sameGroup(dragId, row.dataset.id)) return;
      e.preventDefault();
      row.classList.remove('jl-dragover');
      moveTo(dragId, row.dataset.id);
      dragId = null;
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
        setDirty(true);
      });
    });
    if (PAGE === 'index') renderHomeEditor();
    syncPageAppearance();
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

  function blockGroup(id) {
    if (PAGE === 'index') {
      if (id === 'topbar' || id === 'template-dock') return '导航与入口';
      if (id === 'template-stage' || id === 'template-dialog') return '模板演示层';
      return '首页画廊';
    }
    if (PAGE === 'blog') {
      if (id.indexOf('b-') === 0) return '左侧栏';
      if (id.indexOf('w-') === 0) return '右侧栏';
      if (id === 'search') return '页面顶部';
      return '文章内容';
    }
    if (PAGE === 'post') {
      if (id.indexOf('p-') === 0) return '左侧栏';
      if (id.indexOf('c-') === 0) return '文章主体';
      return '右侧栏';
    }
    return '页面内容';
  }

  function renderBlockList() {
    var list = document.querySelector('.jl-block-list');
    if (!list || !pc()) return;
    var groups = [];
    (pc().modules || []).forEach(function (module) {
      var title = blockGroup(module.id);
      var group = groups.filter(function (item) { return item.title === title; })[0];
      if (!group) { group = { title:title, modules:[] }; groups.push(group); }
      group.modules.push(module);
    });
    var sequence = 0;
    list.innerHTML = groups.map(function (group) {
      return '<section class="jl-block-group"><div class="jl-block-group-head">' + escapeHtml(group.title) +
        '<span>' + group.modules.length + '</span></div>' + group.modules.map(function (m) {
          sequence++;
          var el = document.querySelector('[data-module="' + m.id + '"]');
          var selected = m.id === selectedId;
          var unavailable = !el;
          var sortable = m.sortable !== false && !!el;
          var notDisplayed = el && getComputedStyle(el).display === 'none';
          var hiddenLabel = m.hidden ? '已隐藏' : (unavailable ? '暂不可选' : (notDisplayed ? '暂未显示' : '显示中'));
          return '<div class="jl-block-item' + (selected ? ' selected' : '') + (m.hidden ? ' is-hidden' : '') +
            (unavailable ? ' is-unavailable' : '') + '" data-id="' + escapeHtml(m.id) + '">' +
            (sortable ? '<button type="button" data-jl-drag draggable="true" aria-label="拖动排序" title="拖动排序">⠿</button>' : '<span class="jl-block-grip">▣</span>') +
            '<button type="button" data-jl-select="' + escapeHtml(m.id) + '" aria-pressed="' + selected + '">' +
            '<span class="jl-block-index">' + String(sequence).padStart(2, '0') + '</span><span class="jl-block-copy"><strong>' +
            escapeHtml(m.title || m.id) + '</strong><small>' + escapeHtml(m.id) + '</small></span></button>' +
            '<div class="jl-block-actions"><small>' + hiddenLabel + '</small>' +
            '<button type="button" data-jl-block-action="hide" data-id="' + escapeHtml(m.id) + '" aria-label="' +
            (m.hidden ? '恢复区块' : '隐藏区块') + '" title="' + (m.hidden ? '恢复区块' : '隐藏区块') + '">' + (m.hidden ? '◉' : '◌') + '</button>' +
            (sortable ? '<button type="button" data-jl-block-action="up" data-id="' + escapeHtml(m.id) + '" aria-label="上移区块" title="上移区块">↑</button>' +
            '<button type="button" data-jl-block-action="down" data-id="' + escapeHtml(m.id) + '" aria-label="下移区块" title="下移区块">↓</button>' : '') +
            '</div></div>';
        }).join('') + '</section>';
    }).join('');
    var selectedModule = modById(selectedId);
    var info = document.querySelector('[data-jl-selected-info] span');
    if (info) info.textContent = selectedModule
      ? (selectedModule.title || selectedModule.id) + (selectedModule.hidden ? ' · 当前隐藏' : ' · 已选中')
      : '选择一个区块以查看它的编辑状态。';
  }

  function homeChoiceGroup(key, title, options) {
    return '<div class="jl-home-group"><h3>' + title + '</h3><div class="jl-home-choices">' +
      options.map(function (option) {
        return '<button type="button" data-home-key="' + key + '" data-home-value="' + option[0] + '"' +
          (cfg.home[key] === option[0] ? ' class="active"' : '') + '>' + option[1] + '</button>';
      }).join('') + '</div></div>';
  }

  function homeRange(key, title, min, max, step, unit) {
    var value = cfg.home[key];
    return '<label class="jl-home-range">' + title + '<output>' + escapeHtml(value) + (unit || '') + '</output>' +
      '<input type="range" data-home-key="' + key + '" data-home-unit="' + (unit || '') + '" min="' + min + '" max="' + max +
      '" step="' + (step || 1) + '" value="' + escapeHtml(value) + '"></label>';
  }

  function renderHomeEditor() {
    if (PAGE !== 'index') return;
    var editor = document.querySelector('.jl-home-editor');
    if (!editor || !cfg.home) return;
    var home = cfg.home;
    var colors = [['background','画布底色','#1b1b1b'],['accent','强调色','#c586c0'],['foreground','主文字','#ececec'],['muted','辅助文字','#8b8b8b'],['panel','组件表面','#1e1e1e']];
    var moduleLabels = [['topbar','顶部分类与主题栏'],['search','模板搜索框'],['filters','标签筛选组件'],['cardMeta','模板标题与信息'],['badges','分类材质徽标'],['live','LIVE 状态标记'],['tags','模板标签']];
    editor.innerHTML =
      '<div class="jl-home-group"><h3>画布与品牌</h3><div class="jl-home-colors">' +
      colors.map(function (field) { return '<label>' + field[1] + '<input type="color" data-home-key="' + field[0] + '" value="' +
        escapeHtml(home[field[0]] || field[2]) + '"></label>'; }).join('') +
      '</div><select class="jl-home-font" data-home-key="font"><option value="system">系统现代</option><option value="sans">清爽无衬线</option><option value="serif">编辑衬线</option><option value="mono">技术等宽</option></select>' +
      '<div class="jl-home-choices">' + [['aurora','极光渐层'],['mesh','柔彩网格'],['grid','精密点阵'],['solid','纯色画布']].map(function (item) {
        return '<button type="button" data-home-key="backgroundStyle" data-home-value="' + item[0] +
          (home.backgroundStyle === item[0] ? '" class="active">' : '">' ) + item[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="jl-home-group"><h3>组件与样式</h3><div class="jl-home-toggles">' + moduleLabels.map(function (item) {
        return '<label><input type="checkbox" data-home-key="modules.' + item[0] + '"' + (home.modules[item[0]] !== false ? ' checked' : '') + '>' + item[1] + '</label>';
      }).join('') + '</div>' +
      homeChoiceGroup('navStyle','顶部导航',[['glass','磨砂玻璃'],['pill','悬浮胶囊'],['minimal','极简线框']]) +
      homeChoiceGroup('searchStyle','搜索组件',[['pill','圆角胶囊'],['panel','悬浮面板'],['line','极简下划线']]) +
      homeChoiceGroup('cardStyle','模板卡片',[['soft','柔和卡片'],['outline','描边画框'],['poster','竖版海报']]) + '</div>' +
      '<div class="jl-home-group"><h3>尺寸与排版</h3><div class="jl-home-editor">' +
      homeRange('columns','画廊列数',2,5,1,' 列') + homeRange('contentWidth','画廊宽度',960,1800,40,'px') +
      homeRange('cardRadius','卡片圆角',8,36,1,'px') + homeRange('cardGap','卡片间距',8,48,1,'px') +
      homeRange('navGap','导航间距',0,20,1,'px') + homeRange('chipGap','筛选项间距',0,24,1,'px') +
      homeRange('top','画廊顶部（桌面）',100,240,1,'px') + homeRange('mobileTop','画廊顶部（手机）',120,300,1,'px') +
      homeRange('navTop','导航位置（桌面）',40,160,1,'px') + homeRange('mobileNavTop','导航位置（手机）',40,160,1,'px') +
      homeRange('bottom','舞台底部留白',60,200,1,'px') + homeRange('dockBottom','底部模板栏留白',0,48,1,'px') + '</div></div>' +
      '<div class="jl-home-group"><h3>动效</h3>' +
      homeChoiceGroup('entrance','卡片入场',[['rise','上浮入场'],['fade','柔和淡入'],['stagger','节奏渐显'],['none','静态呈现']]) +
      homeChoiceGroup('hover','悬停反馈',[['lift','轻盈抬升'],['glow','柔光聚焦'],['tilt','微倾视差'],['none','无悬停动效']]) +
      '<div class="jl-home-toggles"><label><input type="checkbox" data-home-key="backgroundMotion"' +
      (home.backgroundMotion ? ' checked' : '') + '>启用背景氛围缓动</label></div>' +
      homeRange('motionSpeed','动效节奏',0.5,1.5,0.1,'×') + '</div>';
    editor.querySelector('[data-home-key="font"]').value = home.font || 'system';
  }

  function setHomeValue(input, value) {
    var path = input.dataset.homeKey.split('.');
    var target = cfg.home;
    path.slice(0, -1).forEach(function (key) { target[key] = target[key] || {}; target = target[key]; });
    target[path[path.length - 1]] = value;
    var output = input.closest('label') && input.closest('label').querySelector('output');
    if (output) output.textContent = value + (input.dataset.homeUnit || '');
  }

  function liveHome() {
    if (window.JerryHomeLayout && typeof JerryHomeLayout.preview === 'function') JerryHomeLayout.preview(cfg.home);
  }

  function syncPageAppearance() {
    if (!pc()) return;
    var appearance = pc().appearance || {};
    var defaults = { background:'#1b1b1b', foreground:'#ececec', muted:'#a0a0a0', accent:(cfg.global.violet || '#B18CFF'),
      panel:'#24242b', font:'system', contentWidth:1000, cardRadius:18, sectionGap:36 };
    document.querySelectorAll('.jl-panel [data-p]').forEach(function (input) {
      input.value = appearance[input.dataset.p] == null ? defaults[input.dataset.p] : appearance[input.dataset.p];
      var output = document.querySelector('.jl-panel [data-pv="' + input.dataset.p + '"]');
      if (output) output.textContent = input.value + (input.type === 'range' ? 'px' : '');
    });
  }

  function setPageAppearance(input, value) {
    pc().appearance = pc().appearance || {};
    pc().appearance.enabled = true;
    pc().appearance[input.dataset.p] = value;
    var output = document.querySelector('.jl-panel [data-pv="' + input.dataset.p + '"]');
    if (output) output.textContent = value + (input.type === 'range' ? 'px' : '');
  }

  function selectModule(id, openInspector, scrollToModule) {
    selectedId = id;
    document.querySelectorAll('[data-module].jl-selected').forEach(function (el) { el.classList.remove('jl-selected'); });
    var selectedElement = document.querySelector('[data-module="' + id + '"]');
    if (selectedElement) {
      selectedElement.classList.add('jl-selected');
      if (scrollToModule) selectedElement.scrollIntoView({ behavior:'smooth', block:'center', inline:'nearest' });
    }
    renderBlockList();
    if (openInspector) openPanel('blocks');
  }

  function setDirty(value) {
    dirty = value;
    var status = document.querySelector('.jl-status');
    if (!status) return;
    status.classList.toggle('is-dirty', dirty);
    status.querySelector('span').textContent = dirty ? '未保存' : '已保存';
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
    if (e.type === 'wheel') return;
    var editable = target.closest('[data-jl-text][contenteditable="true"]');
    var module = target.closest('[data-module]');
    if (!module) return;
    selectModule(module.getAttribute('data-module'), true);
    if (editable) {
      if (e.type === 'pointerdown') e.stopImmediatePropagation();
      else if (e.type === 'click' || e.type === 'keydown') e.stopPropagation();
      return;
    }
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
    var appearance = (pc() && pc().appearance) || {};
    if (!liveStyle) { liveStyle = document.createElement('style'); liveStyle.id = 'jl-live-overrides'; document.head.appendChild(liveStyle); }
    var rules = [];
    var vars = [];
    if (g.violet) vars.push('--violet:' + g.violet);
    if (g.aqua) vars.push('--aqua:' + g.aqua);
    if (g.coral) vars.push('--coral:' + g.coral);
    if (g.pink) vars.push('--pink:' + g.pink);
    if (appearance.enabled && /^#[0-9a-f]{6}$/i.test(appearance.accent || '')) {
      vars.push('--violet:' + appearance.accent, '--aqua:' + appearance.accent);
    }
    if (g.cardRadius != null) vars.push('--card-radius:' + g.cardRadius + 'px');
    if (vars.length) rules.push(':root{' + vars.join(';') + '}');
    if (g.cardRadius != null && !(appearance.enabled && appearance.cardRadius != null)) rules.push('.glass-card,.widget-card,.side-card,.friend-card,.moment-card,.tl-card,.article-card,.proj-card,.album-card,.apply-card,.toc,.lock-modal{border-radius:var(--card-radius) !important}');
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
    syncPageAppearance();
    if (PAGE === 'index') { renderHomeEditor(); liveHome(); }
    var initial = (pc().modules || []).filter(function (m) {
      return !m.hidden && document.querySelector('[data-module="' + m.id + '"]');
    })[0];
    selectModule(initial ? initial.id : null, false);
    openPanel('blocks');
  }
  function exitEdit() {
    editing = false;
    localStorage.removeItem('jerryEditLayout');
    document.body.classList.remove('jl-editing');
    document.querySelectorAll('.jl-modbar').forEach(function (b) { b.remove(); });
    document.querySelectorAll('.jl-selection-tag').forEach(function (tag) { tag.remove(); });
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
      if (d.ok && d.config) {
        cfg = d.config; window.__layoutConfig = cfg; window.JerryLayout && JerryLayout.reapply();
        if (PAGE === 'index' && window.JerryHomeLayout) JerryHomeLayout.preview(cfg.home);
        setDirty(false);
      }
    }).catch(function () {});
  }
  function setBarEditing(on) {
    document.querySelector('.jl-bar .jl-toggle').textContent = on ? '✅ 完成编辑' : '🧩 编辑页面';
    ['.jl-blocks', '.jl-theme', '.jl-reset', '.jl-save', '.jl-deploy'].forEach(function (sel) {
      document.querySelector('.jl-bar ' + sel).style.display = on ? '' : 'none';
    });
    document.querySelector('.jl-bar .jl-sep').style.display = on ? '' : 'none';
    document.querySelector('.jl-bar .jl-status').style.display = on ? 'flex' : 'none';
  }

  /* ---------- 模块工具条 + 拖拽 ---------- */
  function paintModules() {
    document.querySelectorAll('[data-module]').forEach(function (el) {
      var id = el.getAttribute('data-module');
      var m = modById(id);
      if (!m) return;
      if (!el.querySelector('.jl-selection-tag')) {
        var tag = document.createElement('span');
        tag.className = 'jl-selection-tag';
        tag.textContent = m.title || m.id;
        tag.setAttribute('aria-hidden', 'true');
        el.appendChild(tag);
      }
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
        '<span class="jl-name">' + escapeHtml(m.title || m.id) + '</span>';
      bar.querySelector('[data-act="hide"]').onclick = function () { m.hidden = !m.hidden; reapply(); setDirty(true); toast(m.hidden ? '已隐藏（保存后生效）' : '已显示'); };
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
    setDirty(true);
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
    setDirty(true);
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
          setDirty(true);
        });
        el.addEventListener('blur', function () {
          var v = el.textContent.trim();
          t.value = (t.default != null && v === t.default) ? '' : v;
          setDirty(true);
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
      if (d.ok) { window.__layoutConfig = cfg; if (window.JerryLayout) JerryLayout.reapply(); setDirty(false); toast('💾 布局已保存到本地'); }
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
      if (PAGE === 'index' && window.JerryHomeLayout) JerryHomeLayout.preview(cfg.home);
      setDirty(false);
      syncPanel();
      syncPageAppearance();
      if (PAGE === 'index') renderHomeEditor();
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
      setDirty(false);
      toast('🚀 正在推送上线…');
      return fetch('/api/deploy/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) toast('✅ 已发布上线，Vercel 部署约 1 分钟');
      else toast('❌ 发布失败：' + (d.error || ''), false);
    }).catch(function (e) { toast('❌ ' + e.message, false); });
  }
})();
