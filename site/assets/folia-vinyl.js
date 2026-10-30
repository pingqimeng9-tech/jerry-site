/* ─── Folia 第二播放器：Soft Static 黑胶舞台 ─── */
/* 在 /listen/、/listen/desktop.html、/player/ 外壳里注入：
   有歌时右下角出现「黑胶」按钮，点开全屏黑胶舞台，镜像当前 <audio>。 */
(function () {
  'use strict';
  if (window.__jerryVinylBooted) return;
  window.__jerryVinylBooted = true;

  var TEMPLATE_ID = 'vinylplayer';
  var STYLE_ID = 'vinyl-tpl-css';

  var btn = null, stage = null, host = null, closeBtn = null;
  var open = false, mounting = false, cleanup = null, pollTimer = 0;
  var external = null;
  var currentTrack = { name: '', artist: '', cover: '' };
  var currentLyrics = null, lastKey = '';
  var lyricCache = {};
  var inflight = {};
  var loaderCallbacks = null;

  /* ---------- 注入的 UI 样式 ---------- */
  var UI_CSS = '#folia-vinyl-open{position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);z-index:119;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(12,12,18,.72);color:#fff;display:none;align-items:center;justify-content:center;cursor:pointer;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 30px rgba(0,0,0,.35)}'
    + '#folia-vinyl-open.show{display:flex}'
    + '#folia-vinyl-open:active{transform:scale(.94)}'
    + '#folia-vinyl-open svg{width:20px;height:20px;fill:currentColor}'
    + '@media (min-width:769px){#folia-vinyl-open{bottom:24px;right:14px}}'
    + '@media (min-width:1024px){#folia-vinyl-open{right:150px;bottom:26px}}'
    + '#folia-vinyl-stage{position:fixed;inset:0;z-index:2147482000;background:#0a0909;display:none}'
    + '#folia-vinyl-stage.open{display:block}'
    + '#folia-vinyl-stage .fvs-host{position:absolute;inset:0}'
    + '#folia-vinyl-stage .fvs-close{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:14px;z-index:6;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font-size:18px;line-height:1;cursor:pointer;display:grid;place-items:center}'
    + '#folia-vinyl-stage .fvs-close:hover{background:rgba(255,255,255,.14)}'
    + 'body.folia-vinyl-open{overflow:hidden}'
    + 'body.folia-vinyl-open #folia-vinyl-open,body.folia-vinyl-open #folia-mobile-transport,body.folia-vinyl-open #folia-desktop-play,body.folia-vinyl-open #jerry-top-nav{display:none!important}';

  /* ---------- Folia DOM 探测 ---------- */
  function getAudio() {
    var audios = Array.prototype.slice.call(document.querySelectorAll('audio'));
    var playing = audios.filter(function (a) { return a.currentSrc && !a.paused && !a.ended; })[0];
    if (playing) return playing;
    var loaded = audios.filter(function (a) { return a.currentSrc || a.src; })[0];
    return loaded || audios[0] || null;
  }
  function getPlayerButton() {
    var marker = document.querySelector('button [data-toast-cover="image"]');
    if (marker) {
      var b = marker.closest('button');
      if (b) return b;
    }
    var buttons = document.querySelectorAll('button[aria-label]');
    for (var i = 0; i < buttons.length; i += 1) {
      if (/展开歌曲卡片|open the song card|stageTrackPillOpenSongCard/i.test(buttons[i].getAttribute('aria-label') || '')) return buttons[i];
    }
    return null;
  }
  function hasTrack() {
    var a = getAudio();
    return !!(a && (a.currentSrc || a.src));
  }
  function readMeta() {
    var pb = getPlayerButton();
    var track = { name: '', artist: '', cover: '' };
    if (pb) {
      var trunc = pb.querySelectorAll('.truncate');
      if (trunc[0]) track.name = trunc[0].textContent || '';
      if (trunc[1]) track.artist = trunc[1].textContent || '';
      var img = pb.querySelector('img');
      if (img && img.src) track.cover = img.src;
    }
    return track;
  }
  function skip(side) {
    var fn = side === 'prev' ? window.__FOLIA_PREV__ : window.__FOLIA_NEXT__;
    if (typeof fn === 'function') {
      try { fn(); } catch (e) { }
      return;
    }
    var pattern = side === 'prev' ? /上一首|previous track/i : /下一首|next track/i;
    var buttons = document.querySelectorAll('button[aria-label]');
    for (var i = 0; i < buttons.length; i += 1) {
      if (btn && btn.contains(buttons[i])) continue;
      if (pattern.test(buttons[i].getAttribute('aria-label') || '')) {
        buttons[i].click();
        return;
      }
    }
  }

  /* ---------- 歌词：歌名搜索 + 逐字 yrc ---------- */
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s"'’'·,，。.()（）\[\]【】\-—_]/g, ''); }
  function cacheGet(key) {
    try {
      var v = sessionStorage.getItem('vinylv:' + key);
      return v ? JSON.parse(v) : undefined;
    } catch (e) { return undefined; }
  }
  function cacheSet(key, val) {
    try { sessionStorage.setItem('vinylv:' + key, JSON.stringify(val)); } catch (e) { }
  }
  function pickBest(songs, track) {
    var want = norm(track.name);
    var best = songs[0] || null;
    for (var i = 0; i < songs.length; i += 1) {
      var name = norm(songs[i].name);
      if (want && name === want) return songs[i];
      if (want && name.indexOf(want) !== -1 && best === songs[0]) best = songs[i];
    }
    return best;
  }
  function doResolve(track) {
    var q = encodeURIComponent(((track.name || '') + ' ' + (track.artist || '')).trim());
    return fetch('/api/assist?do=search&q=' + q, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var songs = d && d.ok ? d.songs : null;
        if (!songs || !songs.length) return null;
        var song = pickBest(songs, track);
        if (!song || !song.id) return null;
        return fetch('/api/netease/lyric/new?id=' + song.id, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d2) {
            if (!d2) return null;
            var yrc = d2.yrc && d2.yrc.lyric;
            var lrc = d2.lrc && d2.lrc.lyric;
            var lines = null;
            if (yrc && window.VinylDeck) {
              lines = window.VinylDeck.parseYrc(yrc);
              if (!lines.length) lines = null;
            }
            if (!lines && lrc && window.VinylDeck) {
              lines = window.VinylDeck.parseLrc(lrc);
              if (!lines.length) lines = null;
            }
            return lines;
          });
      })
      .catch(function () { return null; });
  }
  function resolveLyrics(track) {
    var key = (track.name || '') + ' | ' + (track.artist || '');
    if (lyricCache[key] !== undefined) return Promise.resolve(lyricCache[key]);
    if (inflight[key]) return inflight[key];
    var cached = cacheGet(key);
    if (cached !== undefined) {
      lyricCache[key] = cached;
      return Promise.resolve(cached);
    }
    var p = doResolve(track).then(function (lines) {
      lyricCache[key] = lines || null;
      cacheSet(key, lines || null);
      delete inflight[key];
      return lines;
    }, function () {
      lyricCache[key] = null;
      delete inflight[key];
      return null;
    });
    inflight[key] = p;
    return p;
  }

  /* ---------- 外部源（喂给黑胶内核） ---------- */
  function buildExternal() {
    return {
      getTime: function () { var a = getAudio(); return a ? a.currentTime : 0; },
      getDuration: function () { var a = getAudio(); return a && isFinite(a.duration) ? a.duration : 0; },
      isPlaying: function () { var a = getAudio(); return !!(a && !a.paused && !a.ended); },
      play: function () { var a = getAudio(); if (a) a.play().catch(function () { }); },
      pause: function () { var a = getAudio(); if (a) a.pause(); },
      next: function () { skip('next'); },
      prev: function () { skip('prev'); },
      seek: function (t) {
        var a = getAudio();
        if (a && isFinite(a.duration) && a.duration > 0) a.currentTime = Math.max(0, Math.min(t, a.duration));
      },
      getTrack: function () { return currentTrack; },
      getLyrics: function () { return currentLyrics; }
    };
  }

  /* ---------- 模板懒加载 ---------- */
  function findTpl() {
    var list = window.__JERRY_TEMPLATES || [];
    for (var i = 0; i < list.length; i += 1) if (list[i].id === TEMPLATE_ID) return list[i];
    return null;
  }
  function loadTemplate(cb) {
    var tpl = window.VinylDeck && findTpl();
    if (tpl) { cb(tpl); return; }
    if (loaderCallbacks) { loaderCallbacks.push(cb); return; }
    loaderCallbacks = [cb];
    var s = document.createElement('script');
    s.src = '/assets/templates/vinylplayer.js';
    s.async = true;
    s.onload = function () {
      var t = findTpl();
      var q = loaderCallbacks ? loaderCallbacks.slice() : [];
      loaderCallbacks = null;
      q.forEach(function (f) { f(t); });
    };
    s.onerror = function () {
      loaderCallbacks = null;
      mounting = false;
      if (open) close();
    };
    document.head.appendChild(s);
  }

  function injectCss(tpl) {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = (tpl && tpl.css) || '';
  }

  /* ---------- 轨道轮询 ---------- */
  function poll() {
    var meta = readMeta();
    var key = (meta.name || '') + ' | ' + (meta.artist || '');
    if (key !== lastKey) {
      lastKey = key;
      currentTrack = meta;
      currentLyrics = null;
      if (meta.name) {
        resolveLyrics(meta).then(function (lines) {
          if (lastKey === key) currentLyrics = lines;
        });
      }
    } else {
      if (meta.cover) currentTrack.cover = meta.cover;
      if (meta.name) currentTrack.name = meta.name;
      if (meta.artist) currentTrack.artist = meta.artist;
    }
  }

  /* ---------- 开关 ---------- */
  function openStage() {
    if (open || mounting) return;
    if (!hasTrack()) return;
    open = true;
    mounting = true;
    document.body.classList.add('folia-vinyl-open');
    stage.classList.add('open');
    btn.classList.remove('show');
    external = buildExternal();
    loadTemplate(function (tpl) {
      mounting = false;
      if (!open) return;
      if (!tpl || !tpl.mount) { close(); return; }
      injectCss(tpl);
      host.innerHTML = '';
      var P = {};
      (tpl.knobs || []).forEach(function (k) { P[k.k] = k.v; });
      try {
        var ret = tpl.mount(host, { items: [], P: P, auto: false, status: function () { }, hint: function () { }, external: external });
        cleanup = typeof ret === 'function' ? ret : null;
      } catch (e) {
        if (window.console) console.error(e);
        cleanup = null;
      }
      var vd = host.querySelector('.vd');
      if (vd) { try { vd.focus(); } catch (e) { } }
      poll();
      pollTimer = window.setInterval(poll, 1000);
    });
  }
  function close() {
    open = false;
    document.body.classList.remove('folia-vinyl-open');
    stage.classList.remove('open');
    if (pollTimer) { window.clearInterval(pollTimer); pollTimer = 0; }
    if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
    host.innerHTML = '';
    currentTrack = { name: '', artist: '', cover: '' };
    lastKey = '';
    currentLyrics = null;
    updateTrigger();
  }

  function updateTrigger() {
    if (!btn) return;
    btn.classList.toggle('show', hasTrack() && !open);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    var style = document.createElement('style');
    style.textContent = UI_CSS;
    document.head.appendChild(style);

    btn = document.createElement('button');
    btn.id = 'folia-vinyl-open';
    btn.type = 'button';
    btn.setAttribute('aria-label', '打开黑胶播放器');
    btn.title = '打开黑胶播放器';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>';
    document.body.appendChild(btn);

    stage = document.createElement('div');
    stage.id = 'folia-vinyl-stage';
    stage.setAttribute('aria-label', '黑胶播放器');
    stage.innerHTML = '<div class="fvs-host"></div><button class="fvs-close" type="button" aria-label="关闭黑胶播放器">×</button>';
    document.body.appendChild(stage);
    host = stage.querySelector('.fvs-host');
    closeBtn = stage.querySelector('.fvs-close');

    btn.addEventListener('click', openStage);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) close();
    });

    window.setInterval(updateTrigger, 800);
    window.setTimeout(updateTrigger, 1200);
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
