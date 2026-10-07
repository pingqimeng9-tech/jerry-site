(function () {
  'use strict';

  var root = document.documentElement;
  var style = document.createElement('style');
  style.id = 'jerry-home-layout';
  style.textContent = [
    '@keyframes home-rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '@keyframes home-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes home-ambient{from{background-position:0 0,100% 0,0 0}to{background-position:8% 12%,90% 8%,0 0}}',
    'body{background-color:var(--home-bg,var(--bg));background-image:linear-gradient(160deg,var(--home-bg,var(--bg)),var(--home-bg,var(--bg2,var(--bg))));color:var(--home-fg,var(--fg));font-family:var(--home-font,"Helvetica Neue",Helvetica,Arial,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif)}',
    '.gal,.mdl-box{background-color:var(--home-bg,var(--bg));color:var(--home-fg,var(--fg))}',
    '.gal{background-image:var(--home-background-image,linear-gradient(160deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg))))}',
    '.gal-head h1,.gc-meta h3,.mdl-t,.gal-cur,.gc-badge{color:var(--home-fg,var(--fg))}',
    '.gal-head p,.nav button,.chips button,.gal-tgl,.gal-tags button,.gc-tags i,.gc-live,.gal-empty,.mdl-cat{color:var(--home-muted,var(--mut))}',
    '.nav,.gal-search,.gal-tgl,.gal-cur,.gal-tags button,.gc-badge,.gc-live,.chips button{background-color:var(--home-panel,var(--pill));border-color:var(--home-line,var(--line))}',
    '.gal-search input{color:var(--home-fg,var(--fg))}',
    '.gal-search input::placeholder{color:var(--home-muted,var(--mut))}',
    '.nav button[aria-pressed=true],.chips button.on,.gal-tgl:hover,.gal-tgl[aria-expanded=true],.gal-tags button[aria-pressed=true],.gc:hover .gc-pv,.gc:focus-visible .gc-pv{color:var(--home-accent,var(--fg));border-color:var(--home-accent,var(--line))}',
    '.gal-grid{gap:var(--home-card-gap,26px)}',
    '.gal-tags{gap:var(--home-chip-gap,6px)}',
    '.gal{padding-top:var(--home-top-current,var(--top))}',
    '.bar{top:var(--home-nav-top-current,74px)}',
    '.tpl{inset:var(--home-top-current,var(--top)) 14px var(--home-bottom,var(--bot)) 14px}',
    '.dock{padding-bottom:var(--home-dock-bottom,12px)}',
    ':root[data-home-background-style="mesh"] .gal{background-image:radial-gradient(ellipse at 12% 8%,color-mix(in srgb,var(--home-accent,var(--fg)) 24%,transparent),transparent 38%),radial-gradient(ellipse at 88% 18%,rgba(92,225,230,.10),transparent 34%),linear-gradient(155deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg)))}',
    ':root[data-home-background-style="grid"] .gal{background-image:radial-gradient(var(--home-line,var(--line)) 1px,transparent 1.4px),linear-gradient(155deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg)));background-size:22px 22px,auto}',
    ':root[data-home-background-style="solid"] .gal{background-image:none}',
    ':root[data-home-background-motion="true"]:not([data-home-background-style="solid"]) .gal{background-size:auto,auto,auto;animation:home-ambient 28s ease-in-out infinite alternate}',
    ':root[data-home-nav-style="pill"] .nav{border-radius:999px;padding:6px 8px;backdrop-filter:blur(18px)}',
    ':root[data-home-nav-style="minimal"] .nav{background:transparent;border-color:transparent;box-shadow:none}',
    ':root[data-home-search-style="panel"] .gal-search{border-radius:16px;background:var(--home-panel,var(--pill));box-shadow:0 14px 38px rgba(0,0,0,.14)}',
    ':root[data-home-search-style="line"] .gal-search{height:48px;padding:0 8px;border-width:0 0 1px;border-radius:0;background:transparent}',
    ':root[data-home-card-style="outline"] .gc-pv{background:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}',
    ':root[data-home-card-style="poster"] .gc-pv{aspect-ratio:4/5;border-radius:min(var(--home-card-radius,22px),14px)}',
    ':root[data-home-show-topbar="false"] .bar,:root[data-home-show-search="false"] .gal-search,:root[data-home-show-filters="false"] .gal-tagbar,:root[data-home-show-filters="false"] .gal-tagwrap,:root[data-home-show-card-meta="false"] .gc-meta,:root[data-home-show-badges="false"] .gc-badge,:root[data-home-show-live="false"] .gc-live,:root[data-home-show-tags="false"] .gc-tags{display:none!important}',
    ':root[data-home-entrance="rise"] .gc{animation:home-rise var(--home-motion-duration,560ms) both}',
    ':root[data-home-entrance="stagger"] .gc{animation:home-fade var(--home-motion-duration,560ms) both;animation-delay:var(--home-stagger,0ms)}',
    ':root[data-home-entrance="fade"] .gc{animation:home-fade var(--home-motion-duration,560ms) both}',
    ':root[data-home-hover="none"] .gc:hover .gc-pv,:root[data-home-hover="none"] .gc:focus-visible .gc-pv{transform:none;box-shadow:none}',
    ':root[data-home-hover="glow"] .gc:hover .gc-pv,:root[data-home-hover="glow"] .gc:focus-visible .gc-pv{transform:translateY(-2px);box-shadow:0 16px 42px color-mix(in srgb,var(--home-accent,var(--fg)) 22%,transparent)}',
    ':root[data-home-hover="tilt"] .gc:hover .gc-pv,:root[data-home-hover="tilt"] .gc:focus-visible .gc-pv{transform:perspective(900px) rotateX(2deg) rotateY(-2deg) translateY(-3px)}',
    '@media(prefers-reduced-motion:reduce){:root .gc{animation:none!important}:root .gal{animation:none!important}:root .gc-pv{transition:none!important}}'
  ].join('\n');
  document.head.appendChild(style);

  var fonts = {
    system: '"Helvetica Neue",Helvetica,Arial,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
    sans: 'Arial,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
    serif: 'Georgia,"Noto Serif SC","Songti SC",serif',
    mono: 'ui-monospace,"SF Mono",Menlo,Consolas,monospace'
  };
  var colorVars = {
    background: '--home-bg',
    foreground: '--home-fg',
    muted: '--home-muted',
    panel: '--home-panel',
    accent: '--home-accent'
  };
  var currentHome = {};
  var hasLivePreview = false;
  var backgroundLayers = {
    aurora: 'radial-gradient(ellipse at 12% 8%,color-mix(in srgb,var(--home-accent,var(--fg)) 18%,transparent),transparent 38%),radial-gradient(ellipse at 88% 18%,rgba(92,225,230,.08),transparent 34%),linear-gradient(155deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg)))',
    mesh: 'radial-gradient(ellipse at 12% 8%,color-mix(in srgb,var(--home-accent,var(--fg)) 24%,transparent),transparent 38%),radial-gradient(ellipse at 88% 18%,rgba(92,225,230,.10),transparent 34%),linear-gradient(155deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg)))',
    grid: 'radial-gradient(var(--home-line,var(--line)) 1px,transparent 1.4px),linear-gradient(155deg,var(--home-bg,var(--bg)),var(--bg2,var(--bg)))',
    solid: 'none'
  };
  var allowed = {
    backgroundStyle: ['aurora', 'mesh', 'grid', 'solid'],
    navStyle: ['glass', 'pill', 'minimal'],
    searchStyle: ['pill', 'panel', 'line'],
    cardStyle: ['soft', 'outline', 'poster'],
    entrance: ['rise', 'fade', 'stagger', 'none'],
    hover: ['lift', 'glow', 'tilt', 'none']
  };

  function setVar(name, value) {
    if (value === '' || value == null) root.style.removeProperty(name);
    else root.style.setProperty(name, value);
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function option(value, name, fallback) {
    return allowed[name].indexOf(value) >= 0 ? value : fallback;
  }

  function rgba(hex, alpha) {
    if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return '';
    var value = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((value >> 16) & 255) + ',' + ((value >> 8) & 255) + ',' + (value & 255) + ',' + alpha + ')';
  }

  function apply(home, forceColors) {
    home = home && typeof home === 'object' ? home : {};
    home.modules = home.modules && typeof home.modules === 'object' ? home.modules : {};
    currentHome = home;
    var useSavedPalette = false;
    try { useSavedPalette = !forceColors && !!localStorage.getItem('jerry-pal'); }
    catch (error) { console.warn('[JerryHomeLayout] Unable to read saved palette:', error.message); }
    Object.keys(colorVars).forEach(function (key) {
      var color = home[key];
      setVar(colorVars[key], !useSavedPalette && color && /^#[0-9a-f]{6}$/i.test(color) ? color : '');
    });
    setVar('--home-line', useSavedPalette ? '' : rgba(home.foreground, 0.2));
    setVar('--home-font', fonts[home.font] || '');
    var backgroundStyle = option(home.backgroundStyle, 'backgroundStyle', 'aurora');
    var navStyle = option(home.navStyle, 'navStyle', 'glass');
    var searchStyle = option(home.searchStyle, 'searchStyle', 'pill');
    var cardStyle = option(home.cardStyle, 'cardStyle', 'soft');
    var entrance = option(home.entrance, 'entrance', 'rise');
    var hover = option(home.hover, 'hover', 'lift');
    var modules = home.modules;
    root.dataset.homeBackgroundStyle = backgroundStyle;
    root.dataset.homeBackgroundMotion = String(home.backgroundMotion === true);
    root.dataset.homeNavStyle = navStyle;
    root.dataset.homeSearchStyle = searchStyle;
    root.dataset.homeCardStyle = cardStyle;
    root.dataset.homeEntrance = entrance;
    root.dataset.homeHover = hover;
    root.style.setProperty('--home-background-image', backgroundLayers[backgroundStyle]);
    ['topbar', 'search', 'filters', 'cardMeta', 'badges', 'live', 'tags'].forEach(function (key) {
      root.dataset['homeShow' + key.charAt(0).toUpperCase() + key.slice(1)] = String(modules[key] !== false);
    });

    var radius = clampNumber(home.cardRadius, 8, 36, 22);
    var gap = clampNumber(home.cardGap, 8, 48, 26);
    var columns = clampNumber(home.columns, 2, 5, 4);
    var width = clampNumber(home.contentWidth, 960, 1800, 1440);
    var navGap = clampNumber(home.navGap, 0, 20, 2);
    var chipGap = clampNumber(home.chipGap, 0, 24, 6);
    var top = clampNumber(home.top, 100, 240, 148);
    var mobileTop = clampNumber(home.mobileTop, 120, 300, 192);
    var navTop = clampNumber(home.navTop, 40, 160, 74);
    var mobileNavTop = clampNumber(home.mobileNavTop, 40, 160, 74);
    var bottom = clampNumber(home.bottom, 60, 200, 104);
    var dockBottom = clampNumber(home.dockBottom, 0, 48, 12);
    var motionSpeed = clampNumber(home.motionSpeed, 0.5, 1.5, 1);

    setVar('--home-card-radius', radius + 'px');
    setVar('--home-card-gap', gap + 'px');
    setVar('--home-columns', String(columns));
    setVar('--home-content-width', width + 'px');
    setVar('--home-nav-gap', navGap + 'px');
    setVar('--home-chip-gap', chipGap + 'px');
    setVar('--home-top', top + 'px');
    setVar('--home-top-mobile', mobileTop + 'px');
    setVar('--home-nav-top', navTop + 'px');
    setVar('--home-nav-top-mobile', mobileNavTop + 'px');
    setVar('--home-bottom', bottom + 'px');
    setVar('--home-dock-bottom', dockBottom + 'px');
    setVar('--home-motion-speed', String(motionSpeed));
    setVar('--home-motion-duration', Math.round(560 / motionSpeed) + 'ms');
    window.dispatchEvent(new Event('jerry:home-layout-applied'));
  }

  function preview(home) {
    apply(home, true);
  }

  window.JerryHomeLayout = {
    applyCurrentPalette: function () { apply(currentHome, false); },
    preview: function (home) { hasLivePreview = true; preview(home); }
  };

  fetch('/data/layout_config.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('布局配置读取失败：' + response.status);
      return response.json();
    })
    .then(function (config) {
      if (!hasLivePreview && config && config.format === 'jerry-layout/v1') apply(config.home);
    })
    .catch(function (error) {
      console.warn('[JerryHomeLayout]', error.message);
    });

  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    var message = event.data;
    if (!message || message.type !== 'jerry-home-layout-preview') return;
    hasLivePreview = true;
    preview(message.home);
  });
})();
