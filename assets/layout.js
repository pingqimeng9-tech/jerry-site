/* ============================================================
   Jerry Layout v1 —— 页面布局自定义运行时
   页面接入：<body data-page="blog"> + 模块容器加 data-module="id"
   配置：/data/layout_config.json（后台「🧩 布局」编辑，随仓库上线）
   能力：模块隐藏 / 同栏排序 / 页面标题文案 / 全局外观参数（主题色·圆角·间距·宽度）
   ?layoutEdit=1 进入布局预览模式（模块描边 + 名称标签）
   ============================================================ */
(function () {
  if (window.__jerryLayout) return;
  window.__jerryLayout = true;

  var PAGE = document.body.dataset.page || '';
  var CFG = null;
  var applying = false;
  var debounceTimer = null;

  var HIDDEN_CLS = 'jl-hidden';

  fetch('/data/layout_config.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (!cfg || cfg.format !== 'jerry-layout/v1') return;
      CFG = cfg;
      window.__layoutConfig = cfg;
      boot();
    })
    .catch(function () { /* 配置拉取失败 = 保持页面原样 */ });

  function boot() {
    injectHiddenCss();
    if (/[?&]layoutEdit=1/.test(location.search)) injectEditCss();
    applyAll();
    // 文章等区域是异步渲染的，监听新出现的模块并补应用
    var mo = new MutationObserver(function () {
      if (applying) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (document.querySelector('[data-module]:not([data-jl-done])')) applyAll();
      }, 250);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function applyAll() {
    applying = true;
    try {
      applyGlobal(CFG.global || {});
      var pc = (CFG.pages && CFG.pages[PAGE]) || null;
      if (pc) {
        applyModules(pc.modules || []);
        applyTexts(pc.texts || []);
      }
    } finally {
      applying = false;
    }
  }

  /* ---------- 全局外观参数 ---------- */
  function applyGlobal(g) {
    var rules = [];
    var vars = [];
    if (g.violet) vars.push('--violet:' + g.violet);
    if (g.aqua) vars.push('--aqua:' + g.aqua);
    if (g.coral) vars.push('--coral:' + g.coral);
    if (g.pink) vars.push('--pink:' + g.pink);
    if (g.cardRadius != null && g.cardRadius !== '') vars.push('--card-radius:' + Number(g.cardRadius) + 'px');
    if (vars.length) rules.push(':root{' + vars.join(';') + '}');
    if (g.cardRadius != null && g.cardRadius !== '') {
      rules.push('.glass-card,.widget-card,.side-card,.friend-card,.moment-card,.tl-card,.article-card,.proj-card,.album-card,.apply-card,.toc,.lock-modal{border-radius:var(--card-radius) !important}');
    }
    if (g.contentWidth != null && g.contentWidth !== '') {
      rules.push('.wrap{max-width:' + Number(g.contentWidth) + 'px}');
    }
    if (g.sectionGap != null && g.sectionGap !== '') {
      rules.push('.main-content-centered{gap:' + Number(g.sectionGap) + 'px}');
    }
    var st = document.getElementById('jerry-layout-vars') || document.createElement('style');
    st.id = 'jerry-layout-vars';
    st.textContent = rules.join('\n');
    document.head.appendChild(st);
  }

  /* ---------- 模块隐藏 + 同栏排序 ---------- */
  function applyModules(mods) {
    var map = {};
    mods.forEach(function (m, i) { map[m.id] = { hidden: !!m.hidden, sortable: m.sortable !== false, order: i }; });

    // 1) 隐藏 / 取消隐藏（以配置为准）
    document.querySelectorAll('[data-module]').forEach(function (el) {
      var conf = map[el.getAttribute('data-module')];
      el.setAttribute('data-jl-done', '1');
      if (!conf) return;
      if (conf.title) el.setAttribute('data-layout-label', conf.title);
      el.classList.toggle(HIDDEN_CLS, conf.hidden);
    });

    // 2) 排序：按父容器分组，组内可排序模块按配置顺序重排（不移动固定模块，不丢事件监听）
    var groups = {};
    document.querySelectorAll('[data-module]').forEach(function (el) {
      var id = el.getAttribute('data-module');
      var conf = map[id];
      if (!conf || !conf.sortable || conf.hidden) return;
      var p = el.parentNode;
      if (!p) return;
      (groups[groupKey(p)] = groups[groupKey(p)] || { parent: p, els: [] }).els.push(el);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      var slots = g.els.slice(); // 原始 DOM 顺序的槽位
      var ordered = g.els.slice().sort(function (a, b) {
        return (map[a.getAttribute('data-module')].order || 0) - (map[b.getAttribute('data-module')].order || 0);
      });
      var cursor = slots[0];
      ordered.forEach(function (el) {
        if (el === cursor) { cursor = el.nextSibling; return; }
        g.parent.insertBefore(el, cursor);
      });
    });
  }
  var groupSeq = 0, groupMap = new WeakMap();
  function groupKey(node) {
    if (groupMap.has(node)) return groupMap.get(node);
    var k = 'g' + (++groupSeq);
    groupMap.set(node, k);
    return k;
  }

  /* ---------- 文案 ---------- */
  function applyTexts(texts) {
    texts.forEach(function (t) {
      if (!t.selector) return;
      var v = (t.value != null && t.value !== '') ? t.value : (t.default != null ? t.default : null);
      if (v == null) return;
      document.querySelectorAll(t.selector).forEach(function (el) { el.textContent = v; });
    });
  }

  /* ---------- 样式注入 ---------- */
  function injectHiddenCss() {
    var st = document.createElement('style');
    st.textContent = '.' + HIDDEN_CLS + '{display:none !important}';
    document.head.appendChild(st);
  }
  function injectEditCss() {
    var st = document.createElement('style');
    st.textContent =
      '[data-module]{outline:2px dashed rgba(92,225,230,.75) !important;outline-offset:3px;position:relative}' +
      '[data-module]::before{content:attr(data-layout-label);position:absolute;top:-10px;left:8px;z-index:99999;' +
      'background:linear-gradient(120deg,#B18CFF,#5CE1E6);color:#10102a;font-size:11px;font-weight:700;' +
      'padding:2px 9px;border-radius:999px;font-family:"JetBrains Mono",Consolas,monospace;pointer-events:none;white-space:nowrap}' +
      '.' + HIDDEN_CLS + '{display:none !important}';
    document.head.appendChild(st);
  }

  // 对外 API（供页面脚本/控制台/前台可视化编辑器使用）
  window.JerryLayout = {
    get: function () { return CFG; },
    setConfig: function (c) { CFG = c; window.__layoutConfig = c; applyAll(); return CFG; },
    reapply: applyAll
  };
})();
