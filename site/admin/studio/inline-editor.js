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

  /* ---------- 启动 ---------- */
  fetch('/api/layout/config')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.ok || !d.config) return;
      cfg = d.config;
      if (!cfg.global) cfg.global = {};
      if (!cfg.pages[PAGE]) return; // 非布局托管页面不显示
      buildBar();
      if (localStorage.getItem('jerryEditLayout') === '1' || /[?&]editLayout=1/.test(location.search)) enterEdit();
    })
    .catch(function () {});

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
      '.jl-panel{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);z-index:2147483800;width:min(560px,calc(100vw - 32px));',
      'padding:16px 18px;border-radius:18px;background:rgba(18,14,42,.94);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.25);',
      'box-shadow:0 22px 60px rgba(0,0,0,.55);display:none;font-family:"Noto Sans SC",system-ui,sans-serif;color:#e8e6fb}',
      '.jl-panel.open{display:block}',
      '.jl-panel .row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:11px}',
      '.jl-panel .sw{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:#c9c6e8}',
      '.jl-panel input[type=color]{width:42px;height:30px;border:none;background:none;cursor:pointer;padding:0}',
      '.jl-panel input[type=range]{flex:1;min-width:150px;accent-color:#5CE1E6}',
      '.jl-panel b{font-variant-numeric:tabular-nums;min-width:42px;display:inline-block;text-align:right;font-size:11.5px}',
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
      'body.jl-editing [data-module][data-jl-drag="1"]{cursor:move}',
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
      '.jl-panel{left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));transform:none;width:auto}',
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
      '<button class="jl-theme" type="button" style="display:none">🎨 外观</button>' +
      '<span class="jl-sep" style="display:none"></span>' +
      '<button class="jl-reset" type="button" style="display:none">↺ 还原</button>' +
      '<button class="jl-save" type="button" style="display:none">💾 保存布局</button>' +
      '<button class="jl-deploy" type="button" style="display:none">🚀 发布上线</button>';
    document.body.appendChild(bar);

    var panel = document.createElement('div');
    panel.className = 'jl-panel';
    panel.innerHTML =
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">主题色</span>' +
      '<label class="sw">主紫<input type="color" data-g="violet"></label>' +
      '<label class="sw">青<input type="color" data-g="aqua"></label>' +
      '<label class="sw">珊瑚<input type="color" data-g="coral"></label>' +
      '<label class="sw">粉<input type="color" data-g="pink"></label></div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">圆角</span><input type="range" data-g="cardRadius" min="6" max="32"><b data-gv="cardRadius">18</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">板块间距</span><input type="range" data-g="sectionGap" min="10" max="120"><b data-gv="sectionGap">36</b>px</div>' +
      '<div class="row"><span style="font-size:12px;color:#c9c6e8;width:56px">内容宽度</span><input type="range" data-g="contentWidth" min="860" max="1280" step="20"><b data-gv="contentWidth">1000</b>px</div>' +
      '<div style="font-size:11px;color:#9a96c0;margin-top:2px">拖动即实时预览，点「💾 保存布局」才会写入；上线需再点「🚀 发布上线」。</div>';
    document.body.appendChild(panel);

    var hint = document.createElement('div');
    hint.className = 'jl-hint';
    hint.textContent = '编辑模式：点模块右上角 👁 隐藏 / ↑↓ 排序，标题文字可直接点击修改；刷新/跨页保持';
    document.body.appendChild(hint);

    bar.querySelector('.jl-toggle').onclick = function () { editing ? exitEdit() : enterEdit(); };
    bar.querySelector('.jl-theme').onclick = function () { panel.classList.toggle('open'); };
    bar.querySelector('.jl-reset').onclick = resetLayout;
    bar.querySelector('.jl-save').onclick = saveLayout;
    bar.querySelector('.jl-deploy').onclick = deploy;

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
    ['.jl-theme', '.jl-reset', '.jl-save', '.jl-deploy'].forEach(function (sel) {
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
        (sortable ? '<button type="button" data-act="up" title="上移">↑</button><button type="button" data-act="down" title="下移">↓</button>' : '') +
        '<button type="button" data-act="hide" title="隐藏/显示">' + (m.hidden ? '🙈' : '👁') + '</button>' +
        '<span class="jl-name">' + (m.title || m.id) + '</span>';
      bar.querySelector('[data-act="hide"]').onclick = function () { m.hidden = !m.hidden; reapply(); toast(m.hidden ? '已隐藏（保存后生效）' : '已显示'); };
      if (sortable) {
        bar.querySelector('[data-act="up"]').onclick = function () { move(id, -1); };
        bar.querySelector('[data-act="down"]').onclick = function () { move(id, 1); };
        el.setAttribute('data-jl-drag', '1');
        el.draggable = true;
        el.addEventListener('dragstart', function (e) { dragId = id; e.dataTransfer.effectAllowed = 'move'; });
        el.addEventListener('dragend', function () { dragId = null; document.querySelectorAll('.jl-dragover').forEach(function (x) { x.classList.remove('jl-dragover'); }); });
        el.addEventListener('dragover', function (e) {
          if (!dragId || dragId === id) return;
          if (!sameGroup(dragId, id)) return;
          e.preventDefault();
          el.style.outline = '2px solid #FF8CD9';
        });
        el.addEventListener('dragleave', function () { el.style.outline = ''; });
        el.addEventListener('drop', function (e) {
          e.preventDefault(); e.stopPropagation();
          el.style.outline = '';
          if (dragId && dragId !== id && sameGroup(dragId, id)) moveTo(dragId, id);
        });
      }
      el.appendChild(bar);
    });
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
    var t = arr[i]; arr.splice(i, 1); arr.splice(j, 0, t);
    reapply();
  }
  function moveTo(srcId, targetId) {
    var arr = pc().modules;
    var si = arr.findIndex(function (m) { return m.id === srcId; });
    var ti = arr.findIndex(function (m) { return m.id === targetId; });
    if (si < 0 || ti < 0) return;
    var t = arr.splice(si, 1)[0];
    arr.splice(ti, 0, t);
    reapply();
  }

  /* ---------- 文案就地编辑 ---------- */
  function paintTexts() {
    var texts = (pc() && pc().texts) || [];
    texts.forEach(function (t) {
      if (!t.selector) return;
      document.querySelectorAll(t.selector).forEach(function (el) {
        if (el.hasAttribute('data-jl-text')) return;
        el.setAttribute('data-jl-text', t.key);
        el.contentEditable = 'true';
        el.addEventListener('blur', function () {
          var v = el.textContent.trim();
          t.value = (v === (t.default || '')) ? '' : v; // 与默认一致则清空，保持默认随动
        });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
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
