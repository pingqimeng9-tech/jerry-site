(function () {
  'use strict';
  if (!window.JerryComponents) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fromSection(section) {
    var p = section || {};
    var social = p.social || {};
    return {
      siteName: p.siteName || 'JERRY.DEV',
      authorName: p.authorName || 'Jerry',
      bio: p.bio || '思维输出 · 长期记录',
      avatarUrl: p.avatarUrl || '',
      github: social.github || ''
    };
  }

  function toSection(config, current) {
    var next = Object.assign({}, current || {});
    next.siteName = config.siteName || 'JERRY.DEV';
    next.authorName = config.authorName || 'Jerry';
    next.bio = config.bio || '';
    next.avatarUrl = config.avatarUrl || '';
    next.social = Object.assign({}, next.social || {});
    next.social.github = config.github || '';
    return next;
  }

  function render(el, config) {
    var initial = (config.authorName || 'J').slice(0, 1);
    el.innerHTML =
      '<div class="studio-profile-card">' +
        '<div class="sp-avatar">' + (config.avatarUrl ? '<img src="' + esc(config.avatarUrl) + '" alt="" onerror="this.remove()">' : '<span>' + esc(initial) + '</span>') + '</div>' +
        '<div class="sp-profile-name">' + esc(config.authorName || 'Jerry') + '</div>' +
        '<div class="sp-profile-bio">' + esc(config.bio || '') + '</div>' +
        (config.github ? '<a class="sp-profile-link" href="' + esc(config.github) + '" target="_blank" rel="noopener">GitHub ↗</a>' : '') +
      '</div>';
  }

  window.JerryComponents.register({
    id: 'profile',
    name: '站点资料卡',
    icon: '🪪',
    version: '1.0.0',
    description: '站名、作者、简介、头像和 GitHub',
    slot: 'sidebar',
    defaults: fromSection({}),
    schema: [
      { key: 'siteName', label: '站点名称', type: 'text', placeholder: 'JERRY.DEV' },
      { key: 'authorName', label: '作者昵称', type: 'text', placeholder: 'Jerry' },
      { key: 'bio', label: '个人简介', type: 'textarea', rows: 3 },
      { key: 'avatarUrl', label: '头像', type: 'image', placeholder: '头像 URL 或上传' },
      { key: 'github', label: 'GitHub', type: 'text', placeholder: 'https://github.com/...' }
    ],
    render: render,
    fromSection: fromSection,
    toSection: toSection
  });
})();
