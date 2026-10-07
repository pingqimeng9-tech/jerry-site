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
  var hasPreviewConfig = false;
  var booted = false;
  var applying = false;
  var debounceTimer = null;

  var HIDDEN_CLS = 'jl-hidden';

  fetch('/data/layout_config.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (!cfg || cfg.format !== 'jerry-layout/v1') return;
      if (hasPreviewConfig) return;
      CFG = cfg;
      window.__layoutConfig = cfg;
      boot();
    })
    .catch(function () { /* 配置拉取失败 = 保持页面原样 */ });

  function boot() {
    if (booted) {
      applyAll();
      return;
    }
    booted = true;
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
        applyPageAppearance(pc.appearance || {});
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

  function applyPageAppearance(appearance) {
    var style = document.getElementById('jerry-page-appearance') || document.createElement('style');
    style.id = 'jerry-page-appearance';
    if (!appearance || appearance.enabled !== true) {
      style.textContent = '';
      document.head.appendChild(style);
      return;
    }
    var colors = {
      background: '--bg',
      foreground: '--fg',
      muted: '--mut',
      accent: '--violet',
      panel: '--layout-panel'
    };
    var variables = [];
    Object.keys(colors).forEach(function (key) {
      var value = appearance[key];
      if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) variables.push(colors[key] + ':' + value);
    });
    if (/^#[0-9a-f]{6}$/i.test(appearance.foreground || '')) variables.push('--ink:' + appearance.foreground);
    if (/^#[0-9a-f]{6}$/i.test(appearance.muted || '')) variables.push('--muted:' + appearance.muted);
    if (/^#[0-9a-f]{6}$/i.test(appearance.accent || '')) variables.push('--aqua:' + appearance.accent);
    var fonts = {
      system: '"Noto Sans SC",system-ui,-apple-system,sans-serif',
      sans: 'Arial,"Noto Sans SC",sans-serif',
      serif: 'Georgia,"Noto Serif SC",serif',
      mono: 'ui-monospace,"SF Mono",Menlo,Consolas,monospace'
    };
    var rules = [];
    if (variables.length) rules.push(':root{' + variables.join(';') + '}');
    if (fonts[appearance.font]) rules.push('body{font-family:' + fonts[appearance.font] + ' !important}');
    if (/^#[0-9a-f]{6}$/i.test(appearance.background || '')) rules.push('body{background-color:' + appearance.background + ' !important}');
    if (/^#[0-9a-f]{6}$/i.test(appearance.foreground || '')) rules.push('body{color:' + appearance.foreground + ' !important}');
    if (appearance.panel && /^#[0-9a-f]{6}$/i.test(appearance.panel)) {
      rules.push('.glass-card,.widget-card,.side-card,.friend-card,.article-card,.proj-card,.apply-card,.toc,.glass,.card,.char-card,.level-card,.book-card,.review-card{background-color:var(--layout-panel) !important}');
    }
    if (Number.isFinite(Number(appearance.contentWidth)) && appearance.contentWidth !== '') {
      rules.push('.wrap,.shell{max-width:' + Math.max(720, Math.min(1800, Number(appearance.contentWidth))) + 'px !important}');
    }
    if (Number.isFinite(Number(appearance.cardRadius)) && appearance.cardRadius !== '') {
      rules.push('.glass-card,.widget-card,.side-card,.friend-card,.article-card,.proj-card,.apply-card,.toc,.glass,.card,.char-card,.level-card,.book-card,.review-card{border-radius:' + Math.max(0, Math.min(40, Number(appearance.cardRadius))) + 'px !important}');
    }
    if (Number.isFinite(Number(appearance.sectionGap)) && appearance.sectionGap !== '') {
      rules.push('.main-content-centered,.shell{gap:' + Math.max(8, Math.min(100, Number(appearance.sectionGap))) + 'px !important}');
    }
    style.textContent = rules.join('\n');
    document.head.appendChild(style);
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
    setConfig: function (c) { CFG = c; window.__layoutConfig = c; if (!booted) boot(); else applyAll(); return CFG; },
    reapply: applyAll
  };
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (!event.data || event.data.type !== 'jerry-layout-preview' || !event.data.config) return;
    hasPreviewConfig = true;
    window.JerryLayout.setConfig(event.data.config);
  });
})();
