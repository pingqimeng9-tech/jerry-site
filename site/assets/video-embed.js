(function () {
  if (window.JerryVideo) return;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./i, '').toLowerCase(); }
    catch (e) { return ''; }
  }

  function parse(url) {
    var raw = String(url || '').trim();
    if (!/^https?:\/\//i.test(raw)) return null;
    var host = hostOf(raw);
    var m;
    if (/bilibili\.com$|b23\.tv$/.test(host)) {
      m = raw.match(/\/video\/(BV[\w]+)/i) || raw.match(/[?&]bvid=(BV[\w]+)/i);
      if (m) return { provider: 'bilibili', label: 'B站', id: m[1], url: raw, embed: 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(m[1]) + '&page=1&high_quality=1&danmaku=0' };
      return { provider: 'bilibili', label: 'B站', url: raw, embed: '' };
    }
    if (/youtu\.be$|youtube\.com$|youtube-nocookie\.com$/.test(host)) {
      m = raw.match(/youtu\.be\/([\w-]+)/) || raw.match(/[?&]v=([\w-]+)/) || raw.match(/\/shorts\/([\w-]+)/) || raw.match(/\/embed\/([\w-]+)/);
      if (m) return { provider: 'youtube', label: 'YouTube', id: m[1], url: raw, embed: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(m[1]), thumb: 'https://i.ytimg.com/vi/' + encodeURIComponent(m[1]) + '/hqdefault.jpg' };
      return { provider: 'youtube', label: 'YouTube', url: raw, embed: '' };
    }
    if (/douyin\.com$/.test(host)) return { provider: 'douyin', label: '抖音', url: raw, embed: '' };
    if (/v\.qq\.com$|qq\.com$/.test(host)) {
      m = raw.match(/\/x\/page\/([\w]+)\.html/) || raw.match(/[?&]vid=([\w]+)/);
      if (m) return { provider: 'tencent', label: '腾讯视频', id: m[1], url: raw, embed: 'https://v.qq.com/txp/iframe/player.html?vid=' + encodeURIComponent(m[1]) };
      return { provider: 'tencent', label: '腾讯视频', url: raw, embed: '' };
    }
    if (/youku\.com$/.test(host)) {
      m = raw.match(/id_([\w=]+)\.html/);
      if (m) return { provider: 'youku', label: '优酷', id: m[1], url: raw, embed: 'https://player.youku.com/embed/' + encodeURIComponent(m[1]) };
      return { provider: 'youku', label: '优酷', url: raw, embed: '' };
    }
    if (/xiaohongshu\.com$/.test(host)) return { provider: 'xiaohongshu', label: '小红书', url: raw, embed: '' };
    if (/weibo\.com$|weibo\.cn$/.test(host)) return { provider: 'weibo', label: '微博', url: raw, embed: '' };
    if (/ixigua\.com$|toutiao\.com$/.test(host)) return { provider: 'ixigua', label: '西瓜视频', url: raw, embed: '' };
    return { provider: 'link', label: host || '外部视频', url: raw, embed: '' };
  }

  function cardHtml(url, title) {
    var meta = parse(url);
    if (!meta) return '';
    var label = title && String(title).trim() ? String(title).trim() : (meta.label + '视频');
    var thumb = meta.thumb ? '<img class="vl-cover" src="' + esc(meta.thumb) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '';
    return '<div class="video-link-card" contenteditable="false" data-video-url="' + esc(meta.url) + '" data-provider="' + esc(meta.provider) + '" data-embed="' + esc(meta.embed || '') + '" data-title="' + esc(label) + '" data-label="' + esc(meta.label) + '">' +
      '<button type="button" class="vl-thumb" data-vl-play aria-label="播放视频">' + thumb +
      '<span class="vl-play" aria-hidden="true">▶</span><span class="vl-badge">' + esc(meta.label) + '</span></button>' +
      '<div class="vl-body"><div class="vl-title">' + esc(label) + '</div><div class="vl-sub">点击播放 · ' + esc(meta.label) + '</div>' +
      '<a class="vl-link" href="' + esc(meta.url) + '" target="_blank" rel="noopener noreferrer">打开原视频 ↗</a></div></div>';
  }

  function play(card) {
    var url = card.dataset.videoUrl || '';
    var embed = card.dataset.embed || '';
    if (!embed) { window.open(url, '_blank', 'noopener'); return; }
    var thumb = card.querySelector('[data-vl-play]');
    if (!thumb) return;
    var wrap = document.createElement('div');
    wrap.className = 'vl-player';
    var iframe = document.createElement('iframe');
    iframe.src = embed + (embed.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.title = card.dataset.title || '视频播放器';
    wrap.appendChild(iframe);
    thumb.replaceWith(wrap);
    card.classList.add('playing');
  }

  function enhance(root, options) {
    if (!root) return;
    var editor = !!(options && options.editor);
    root.querySelectorAll('.video-link-card').forEach(function (card) {
      if (card.dataset.vlBound) return;
      card.dataset.vlBound = '1';
      card.addEventListener('click', function (event) {
        var thumb = event.target.closest('[data-vl-play]');
        if (!thumb) return;
        event.preventDefault();
        event.stopPropagation();
        if (editor) { window.open(card.dataset.videoUrl || '', '_blank', 'noopener'); return; }
        play(card);
      });
    });
  }

  window.JerryVideo = {
    parse: parse,
    cardHtml: cardHtml,
    enhance: enhance
  };
})();
