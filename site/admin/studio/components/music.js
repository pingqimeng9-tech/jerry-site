(function () {
  'use strict';
  if (!window.JerryComponents) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function idsOf(config) {
    return String(config.songIds || '').split(/[\s,，、]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function fromSection(section) {
    var m = section || {};
    var list = Array.isArray(m.songIds) ? m.songIds : [];
    return {
      enabled: m.enabled !== false,
      playerTitle: m.playerTitle || '我喜欢的音乐',
      defaultVolume: m.defaultVolume != null ? Number(m.defaultVolume) : 0.5,
      songIds: list.join('\n')
    };
  }

  function toSection(config, current) {
    var next = Object.assign({}, current || {});
    next.enabled = config.enabled !== false;
    next.playerTitle = config.playerTitle || '我喜欢的音乐';
    next.defaultVolume = Math.max(0, Math.min(1, Number(config.defaultVolume) || 0.5));
    next.songIds = idsOf(config);
    return next;
  }

  function render(el, config) {
    var count = idsOf(config).length;
    el.innerHTML = '<div class="studio-music-card">' +
      '<div class="sm-cover">♫</div>' +
      '<div class="sm-meta"><b>' + esc(config.playerTitle || '我喜欢的音乐') + '</b><span>' + count + ' 首歌 · 全站播放器</span></div>' +
      '<div class="sm-play">' + (config.enabled === false ? 'OFF' : '▶') + '</div></div>';
  }

  window.JerryComponents.register({
    id: 'music',
    name: '全站音乐播放器',
    icon: '♪',
    version: '1.0.0',
    description: '站点全局网易云播放器：标题、音量、歌曲 ID 列表',
    slot: 'floating',
    defaults: fromSection({}),
    schema: [
      { key: 'enabled', label: '启用全站播放器', type: 'switch' },
      { key: 'playerTitle', label: '播放器标题', type: 'text', placeholder: '我喜欢的音乐' },
      { key: 'defaultVolume', label: '默认音量', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'songIds', label: '歌曲 ID（每行一个或逗号分隔）', type: 'textarea', rows: 7 }
    ],
    render: render,
    fromSection: fromSection,
    toSection: toSection
  });
})();
