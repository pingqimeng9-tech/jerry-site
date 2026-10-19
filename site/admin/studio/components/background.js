(function () {
  'use strict';
  if (!window.JerryComponents) return;

  var STYLES = [
    { value: 'aurora', label: '极光渐层' },
    { value: 'mesh', label: '柔彩网格' },
    { value: 'grid', label: '精密点阵' },
    { value: 'solid', label: '纯色画布' }
  ];
  var EFFECTS = [
    { value: 'none', label: '无' },
    { value: 'sakura', label: '樱花' },
    { value: 'snow', label: '雪' },
    { value: 'fireflies', label: '萤火虫' }
  ];

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
  }

  function styleOf(config) {
    var color = safeColor(config.color, '#0e0c22');
    var accent = safeColor(config.accent, '#6A5CFF');
    if (config.useGradient === false || config.style === 'solid') {
      return { background: color };
    }
    if (config.style === 'mesh') {
      return { background: 'radial-gradient(circle at 18% 22%, ' + accent + '88, transparent 42%), radial-gradient(circle at 82% 18%, #FF8CD955, transparent 45%), radial-gradient(circle at 70% 80%, #5CE1E655, transparent 45%), ' + color };
    }
    if (config.style === 'grid') {
      return { backgroundColor: color, backgroundImage: 'radial-gradient(' + accent + '66 1px, transparent 1.5px)', backgroundSize: '18px 18px' };
    }
    return { background: 'radial-gradient(circle at 50% 28%, ' + accent + '66, transparent 55%), radial-gradient(circle at 14% 82%, #5CE1E644, transparent 45%), radial-gradient(circle at 86% 72%, #FF8CD933, transparent 48%), ' + color };
  }

  function render(el, config) {
    el.innerHTML = '';
    el.style.cssText = '';
    Object.assign(el.style, styleOf(config));
    if (config.bgImage) {
      var img = document.createElement('div');
      img.className = 'studio-bg-image';
      img.style.backgroundImage = 'url("' + String(config.bgImage).replace(/"/g, '%22') + '")';
      el.appendChild(img);
    }
    if (config.effect && config.effect !== 'none') {
      var fx = document.createElement('div');
      fx.className = 'studio-bg-fx fx-' + config.effect;
      for (var i = 0; i < 18; i++) {
        var dot = document.createElement('i');
        dot.style.left = (Math.random() * 100).toFixed(2) + '%';
        dot.style.top = (Math.random() * 100).toFixed(2) + '%';
        dot.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's';
        dot.style.animationDuration = (5 + Math.random() * 8).toFixed(2) + 's';
        fx.appendChild(dot);
      }
      el.appendChild(fx);
    }
  }

  function fromSection(section) {
    var bg = section || {};
    return {
      style: bg.style || 'aurora',
      color: bg.color || '#0e0c22',
      accent: bg.accent || '#6A5CFF',
      useGradient: bg.useGradient !== false,
      effect: bg.effect || 'none',
      bgImage: (bg.bgImages && bg.bgImages[0]) || ''
    };
  }

  function toSection(config, current) {
    var next = Object.assign({}, current || {});
    next.style = config.style;
    next.color = safeColor(config.color, '#0e0c22');
    next.accent = safeColor(config.accent, '#6A5CFF');
    next.useGradient = config.useGradient !== false;
    next.effect = config.effect || 'none';
    next.bgImages = config.bgImage ? [config.bgImage] : (Array.isArray(next.bgImages) ? next.bgImages : []);
    return next;
  }

  window.JerryComponents.register({
    id: 'background',
    name: '页面背景',
    icon: '🌌',
    version: '1.0.0',
    description: '背景风格、底色、强调色、氛围特效和背景图',
    slot: 'page',
    defaults: fromSection({}),
    schema: [
      { key: 'style', label: '背景风格', type: 'select', options: STYLES },
      { key: 'useGradient', label: '启用渐变', type: 'switch' },
      { key: 'color', label: '底色', type: 'color' },
      { key: 'accent', label: '强调色', type: 'color' },
      { key: 'effect', label: '氛围特效', type: 'select', options: EFFECTS },
      { key: 'bgImage', label: '背景图', type: 'image', placeholder: 'https://... 或上传到 images/bg/' }
    ],
    render: render,
    fromSection: fromSection,
    toSection: toSection
  });
})();
