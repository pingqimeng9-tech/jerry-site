/* ============================================================
   Jerry Capsule Player —— 胶囊滚动条 + 网易云票据播放器（全站组件）
   页面侧引入：<script src="/assets/capsule-player.js" defer></script>
   仅启用播放器：<script src="/assets/capsule-player.js" data-player-only defer></script>
   ------------------------------------------------------------
   · 胶囊滚动条：跟随【原生滚动】（不锁 body、不用 transform 劫持），
     视觉/交互复刻 Capsule Scrollbar：静止细条 → 滚动/悬停/拖动时
     长成黑色毛玻璃时钟胶囊（实时时钟 + 进度% + 音符按钮），可拖拽翻页。
   · 音乐播放器：底部 mini 玻璃条 ↔ 票据风完整播放器，数据走站点现成
     网易云通道：GET /api/assist?do=music&ids=（元数据）+
     官方外链 music.163.com/song/media/outer/url?id=xx.mp3（播放）。
   · 依赖自托管 GSAP：/assets/vendor/gsap.min.js（随仓库同源，不走公网CDN）。
   · 后台 /admin 与 packages 独立页不引入本文件。
   ============================================================ */
(function () {
  if (window.__EMBED || window.__jerryCapsule) return;
  window.__jerryCapsule = true;

  var SRC = (document.currentScript && document.currentScript.src) || '/assets/capsule-player.js';
  var PLAYER_ONLY = !!(document.currentScript && document.currentScript.hasAttribute('data-player-only'));
  var DIR = SRC.replace(/[^/]*$/, '');                 // 通常是 /assets/
  var GSAp = DIR + 'vendor/gsap.min.js';
  var LS_KEY = 'jerry.music.v1';

  var FONT_SANS = '"Space Grotesk","Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  var FONT_MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
  var SB_ACCENT = '#ff4d00';
  var T_ACCENT = '#7c3aed';
  var T_GLOW = 'rgba(124,58,237,.5)';
  var GLASS_BAR = 'rgba(255,255,255,.32)';
  var GLASS_OPEN = 'rgba(28,28,34,.55)';

  var css = [
    '/* 用胶囊替代主文档原生滚动条（仅根滚动条；内部容器如侧栏/弹窗/代码块不受影响） */',
    'html{scrollbar-width:none;-ms-overflow-style:none}',
    'html::-webkit-scrollbar{width:0;height:0;display:none;background:transparent}',
    'body::-webkit-scrollbar{width:0;height:0}',

    '/* ============ 胶囊滚动条 ============ */',
    '#jcap{position:fixed;top:0;right:12px;width:5px;height:64px;border-radius:999px;background:' + GLASS_BAR + ';',
    '-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);',
    'box-shadow:inset 0 0 0 1px rgba(255,255,255,.45),0 8px 32px rgba(0,0,0,.18);overflow:hidden;',
    'z-index:2147481990;cursor:grab;touch-action:none;color:#fff;will-change:transform,width,height;display:none}',
    '#jcap.grabbing{cursor:grabbing}',
    '#jcap .jcap-panel{position:absolute;inset:0;opacity:0;visibility:hidden;filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}',
    '#jcap .jcap-t{font-family:' + FONT_MONO + ';font-size:10px;letter-spacing:0;opacity:.9;line-height:1}',
    '#jcap .jcap-pct{font-family:' + FONT_MONO + ';font-size:9px;letter-spacing:0;opacity:.55;line-height:1}',
    '#jcap .jcap-note{width:22px;height:22px;display:grid;place-items:center;border:0;background:none;color:' + SB_ACCENT + ';cursor:pointer;opacity:0;pointer-events:none;padding:0}',
    '#jcap.clock .jcap-note{opacity:1;pointer-events:auto}',
    '#jcap .jcap-note .eq{display:none;gap:2px;align-items:flex-end;height:14px}',
    '#jcap .jcap-note.playing .eq{display:flex}',
    '#jcap .jcap-note.playing .ico{display:none}',
    '#jcap .jcap-note .eq i{width:3px;height:100%;background:' + SB_ACCENT + ';border-radius:1px;transform-origin:bottom;animation:jm-eqb .6s ease-in-out infinite alternate}',
    '#jcap .jcap-note .eq i:nth-child(2){animation-duration:.45s;animation-delay:-.2s}',
    '#jcap .jcap-note .eq i:nth-child(3){animation-duration:.75s;animation-delay:-.4s}',
    '@keyframes jm-eqb{from{transform:scaleY(.25)}to{transform:scaleY(1)}}',

    '/* ============ 票据播放器（作用域全部锁在 #jm 内） ============ */',
    '#jm{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:2147482005;width:0;height:0;',
    '--ta:' + T_ACCENT + ';--tag:' + T_GLOW + ';font-family:' + FONT_SANS + '}',
    'body.jsk-admin-local #jm,body.local-admin #jm{bottom:calc(76px + env(safe-area-inset-bottom,0px))}',
    '#jm .jm-mini,#jm .jm-full{position:absolute;bottom:0;left:0;transform-origin:50% 100%}',
    '#jm .glass{background:' + GLASS_OPEN + ';-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);',
    'box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 12px 40px rgba(0,0,0,.35);color:#fff}',
    '#jm .jm-mini{width:min(360px,calc(100vw - 72px));height:56px;border-radius:16px;display:flex;align-items:center;gap:10px;padding:0 12px;cursor:grab}',
    '#jm .jm-mini .mc{width:38px;height:38px;flex:none;border-radius:50%;background:conic-gradient(from 200deg,#2b2b36,' + T_ACCENT + ',#2b2b36) center/cover;border:2px solid rgba(255,255,255,.18);animation:jm-spin 18s linear infinite;animation-play-state:paused}',
    '#jm .jm-mini.playing .mc{animation-play-state:running}',
    '#jm .jm-mini .w{flex:1;height:30px;display:flex;align-items:center;gap:3px;min-width:0}',
    '#jm .jm-mini .w span{flex:1;border-radius:2px;background:var(--ta);box-shadow:0 0 8px var(--tag);transform:scaleY(.2);height:100%;animation:jm-wv var(--t) ease-in-out var(--d) infinite alternate;animation-play-state:paused}',
    '#jm .jm-mini.playing .w span{animation-play-state:running}',
    '@keyframes jm-wv{from{transform:scaleY(var(--lo,.2))}to{transform:scaleY(var(--hi,1))}}',
    '#jm .jm-mini .bar{position:absolute;left:14px;right:14px;bottom:3px;height:2px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;pointer-events:none}',
    '#jm .jm-mini .bar b{display:block;height:100%;width:0;background:var(--ta)}',
    '#jm .mt-btn{background:none;border:none;color:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.85;transition:.2s;padding:.2em}',
    '#jm .mt-btn:hover{opacity:1;transform:scale(1.08)}',
    '#jm .mt-btn svg{width:18px;height:18px}',
    '#jm .jm-mini .mt-btn.play{width:34px;height:34px;border-radius:50%;background:var(--ta);box-shadow:0 0 15px var(--tag)}',
    '#jm .jm-mini .mt-btn.play svg{width:16px;height:16px}',

    '#jm .jm-full{width:240px;padding:10px;border-radius:20px;touch-action:none;cursor:grab}',
    '#jm .jm-hd{cursor:pointer;padding:2px 4px 8px;display:flex;align-items:center;justify-content:space-between;font-family:' + FONT_MONO + ';font-size:9px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;gap:6px}',
    '#jm .jm-hd .d{display:flex;gap:4px}',
    '#jm .jm-hd .d i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35)}',
    '#jm .jm-hd .d i:first-child{background:' + SB_ACCENT + '}',
    '#jm .jm-hd .st{white-space:nowrap}',
    '#jm .ticket-canvas{display:flex;align-items:center;justify-content:center;min-height:0}',
    '#jm .ticket-wrapper{--t-bg:#1e1e24;--t-bg-light:#2b2b36;--t-text-main:#f8fafc;--t-text-muted:#94a3b8;font-size:10px;perspective:1000px;display:block;width:100%}',
    '#jm .ticket{position:relative;width:100%;color:var(--t-text-main);transform-style:preserve-3d;border-radius:1em;',
    'box-shadow:0 20px 40px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.05);background:transparent;filter:drop-shadow(0 0 10px rgba(0,0,0,.4))}',
    '#jm .t-main{padding:1.6em;position:relative;overflow:hidden;background:radial-gradient(circle at bottom left,transparent 1em,var(--t-bg) 1.05em),radial-gradient(circle at bottom right,transparent 1em,var(--t-bg) 1.05em);background-size:51% 100%;background-position:bottom left,bottom right;background-repeat:no-repeat;border-top-left-radius:1em;border-top-right-radius:1em}',
    '#jm .t-main::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.15) 1px,transparent 1px);background-size:2em 2em;opacity:.5;z-index:0;pointer-events:none;transform:perspective(500px) rotateX(20deg) scale(1.5);animation:jm-grid 20s linear infinite;animation-play-state:paused}',
    '#jm .jm-full.playing .t-main::after{animation-play-state:running}',
    '@keyframes jm-grid{from{background-position:0 0}to{background-position:0 4em}}',
    '#jm .t-content{position:relative;z-index:1}',
    '#jm .t-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.4em;gap:8px}',
    '#jm .t-logo{display:flex;align-items:center;gap:.4em;font-weight:900;font-size:1.15em;letter-spacing:-.04em;color:#fff}',
    '#jm .t-logo svg{width:1.4em;height:1.4em;fill:var(--ta);filter:drop-shadow(0 0 5px var(--ta));animation:jm-logo 3s ease-in-out infinite alternate;animation-play-state:paused}',
    '#jm .jm-full.playing .t-logo svg{animation-play-state:running}',
    '@keyframes jm-logo{from{filter:drop-shadow(0 0 2px var(--ta))}to{filter:drop-shadow(0 0 10px var(--ta)) brightness(1.2)}}',
    '#jm .t-type{font-size:.6em;text-transform:uppercase;letter-spacing:.16em;color:var(--ta);border:1px solid var(--ta);padding:.4em .7em;border-radius:99em;font-weight:700;white-space:nowrap}',
    '#jm .t-title{font-size:2.1em;font-weight:900;line-height:1.1;margin-bottom:.2em;text-transform:uppercase;background:linear-gradient(135deg,#fff 0%,#a5b4fc 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#jm .t-subtitle{color:var(--t-text-muted);font-size:.9em;margin-bottom:1.6em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#jm .t-details{display:grid;grid-template-columns:1fr 1fr;gap:1.2em;margin-bottom:.6em}',
    '#jm .t-detail-item{display:flex;flex-direction:column;gap:.2em}',
    '#jm .t-label{font-size:.6em;text-transform:uppercase;letter-spacing:.1em;color:var(--t-text-muted)}',
    '#jm .t-value{font-size:1.05em;font-weight:700;color:var(--t-text-main)}',
    '#jm .mono{font-family:' + FONT_MONO + ';letter-spacing:0}',
    '#jm .t-wide{grid-column:1/-1}',
    '#jm .mt-wave{display:flex;align-items:center;gap:2px;height:2em;padding:0 2px;margin-bottom:.7em;cursor:pointer}',
    '#jm .mt-wave span{flex:1 1 auto;min-width:1.5px;border-radius:1px;background:rgba(255,255,255,.18);transform-origin:center;animation:jm-wv var(--t,.5s) ease-in-out var(--d,0s) infinite alternate;animation-play-state:paused}',
    '#jm .mt-wave span.past{background:var(--ta)}',
    '#jm .jm-full.playing .mt-wave span{animation-play-state:running}',
    '#jm .mt-progress{height:4px;border-radius:4px;background:rgba(255,255,255,.12);cursor:pointer;overflow:hidden}',
    '#jm .mt-progress-fill{height:100%;width:0;background:linear-gradient(90deg,var(--ta),var(--tag));border-radius:4px}',
    '#jm .t-perforation{display:flex;justify-content:space-between;height:1em;align-items:center;position:relative;z-index:2}',
    '#jm .t-perf-line{flex-grow:1;border-top:2px dashed rgba(255,255,255,.2);margin:0 1.2em}',
    '#jm .t-stub{padding:1.4em;background:radial-gradient(circle at top left,transparent 1em,var(--t-bg-light) 1.05em),radial-gradient(circle at top right,transparent 1em,var(--t-bg-light) 1.05em);background-size:51% 100%;background-position:top left,top right;background-repeat:no-repeat;border-bottom-left-radius:1em;border-bottom-right-radius:1em;display:flex;justify-content:space-between;align-items:center;position:relative;cursor:grab;touch-action:none}',
    '#jm .mt-controls{display:flex;align-items:center;gap:.9em}',
    '#jm .mt-controls .mt-btn svg{width:1.4em;height:1.4em}',
    '#jm .mt-controls .mt-btn.play{width:2.5em;height:2.5em;border-radius:50%;background:var(--ta);box-shadow:0 0 15px var(--tag)}',
    '#jm .mt-controls .mt-btn.play svg{width:1.2em;height:1.2em}',
    '#jm .t-barcode-id{font-family:' + FONT_MONO + ';font-size:.7em;color:var(--t-text-muted);letter-spacing:.18em;margin-top:.5em}',
    '#jm .t-admit-text{font-size:.7em;text-transform:uppercase;letter-spacing:.1em;color:var(--t-text-muted);text-align:right}',
    '#jm .mt-cover{width:3.2em;height:3.2em;border-radius:50%;margin-left:auto;background:conic-gradient(from 200deg,var(--t-bg-light),var(--ta),var(--t-bg-light)) center/cover;border:2px solid rgba(255,255,255,.18);box-shadow:0 0 15px var(--tag);display:flex;align-items:center;justify-content:center;font-size:.5em;color:var(--t-text-muted);animation:jm-spin 18s linear infinite;animation-play-state:paused}',
    '#jm .mt-cover.playing{animation-play-state:running}',
    '#jm .mt-cover.has-img{color:transparent}',
    '@keyframes jm-spin{to{transform:rotate(360deg)}}',
    '@media (max-width:560px){#jm .jm-full{width:224px}}'
  ].filter(function (rule) {
    return !PLAYER_ONLY || (rule.indexOf('#jcap') < 0 && rule.indexOf('scrollbar') < 0);
  }).join('\n');

  var gsap = null;
  var bottomPad = 12;   // 底部避让高度（本地编辑条 .jl-bar 出现时上抬播放器/滚动条）
  function loadGsap() {
    return new Promise(function (resolve) {
      if (window.gsap) return resolve(window.gsap);
      var s = document.createElement('script');
      s.src = GSAp;
      s.async = true;
      s.onload = function () { resolve(window.gsap); };
      s.onerror = function () { resolve(null); }; // gsap 失败则降级（不阻塞滚动条）
      document.head.appendChild(s);
    });
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function mm(s) { s = Math.max(0, Math.floor(s || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function safeImg(u) { return /^https?:\/\//.test(u || '') ? ('url("' + u.replace(/"/g, '%22') + '")') : ''; }

  /* ============================================================
     一、胶囊滚动条（原生滚动驱动）
     ============================================================ */
  function mountCapsule() {
    var THUMB = { w: 5, h: 64 }, MIN = { w: 50, h: 188 }, PAD = 12, REST_DELAY = 700;
    var GRAY = GLASS_BAR, BLACK = GLASS_OPEN;

    var cap = document.createElement('div');
    cap.id = 'jcap';
    cap.innerHTML =
      '<div class="jcap-panel" id="jcapClock">' +
      '<svg id="jcapFace" width="36" height="36" viewBox="0 0 36 36"></svg>' +
      '<div class="jcap-t" id="jcapTm">00:00</div>' +
      '<div class="jcap-pct" id="jcapPc">0%</div>' +
      '<button class="jcap-note" id="jcapNote" title="音乐" aria-label="音乐播放器">' +
      '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="3.5"/><circle cx="17.5" cy="16" r="3.5"/></svg>' +
      '<span class="eq"><i></i><i></i><i></i></span></button>' +
      '</div>';
    document.body.appendChild(cap);

    var face = cap.querySelector('#jcapFace'), tm = cap.querySelector('#jcapTm'), pc = cap.querySelector('#jcapPc'), note = cap.querySelector('#jcapNote');
    var hh, mh, sh;
    (function buildFace() {
      var fx = '<circle cx="18" cy="18" r="17" fill="none" stroke="#fff" stroke-opacity=".35"/>';
      for (var i = 0; i < 12; i++) fx += '<line x1="18" y1="' + (i % 3 ? 3.5 : 3) + '" x2="18" y2="' + (i % 3 ? 5 : 6) + '" stroke="#fff" stroke-opacity=".6" transform="rotate(' + (i * 30) + ' 18 18)"/>';
      fx += '<line id="jcapHh" x1="18" y1="18" x2="18" y2="10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        '<line id="jcapMh" x1="18" y1="18" x2="18" y2="6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>' +
        '<line id="jcapSh" x1="18" y1="21" x2="18" y2="5" stroke="#ff4d00" stroke-width="1" stroke-linecap="round"/>' +
        '<circle cx="18" cy="18" r="1.6" fill="#ff4d00"/>';
      face.innerHTML = fx;
      hh = face.querySelector('#jcapHh'); mh = face.querySelector('#jcapMh'); sh = face.querySelector('#jcapSh');
    })();

    var size = { w: THUMB.w, h: THUMB.h };
    var state = 'bar', dragging = false, hov = false, pinned = false, lastMove = 0;
    var startY = 0, moved = false, dragY = 0;

    function maxScroll() { var d = document.documentElement; return Math.max(1, d.scrollHeight - window.innerHeight); }
    function applySize() { cap.style.width = size.w + 'px'; cap.style.height = size.h + 'px'; }
    function showClock(on) {
      var panel = cap.querySelector('.jcap-panel');
      if (gsap) gsap.to(panel, { opacity: on ? 1 : 0, autoAlpha: on ? 1 : 0, filter: on ? 'blur(0px)' : 'blur(8px)', duration: .4, overwrite: 'auto' });
      else { panel.style.opacity = on ? 1 : 0; panel.style.visibility = on ? 'visible' : 'hidden'; }
    }
    function setState(s) {
      if (s === state) return;
      state = s;
      var dims = s === 'bar' ? THUMB : MIN;
      cap.classList.toggle('clock', s === 'clock');
      if (gsap) {
        gsap.to(size, { w: dims.w, h: dims.h, duration: (s === 'clock' ? .6 : .55), ease: 'power3.inOut', overwrite: true, onUpdate: applySize });
        gsap.to(cap, { backgroundColor: s === 'bar' ? GRAY : BLACK, duration: .7, overwrite: 'auto' });
      } else {
        size.w = dims.w; size.h = dims.h; applySize();
        cap.style.background = s === 'bar' ? GRAY : BLACK;
      }
      showClock(s === 'clock');
    }

    /* 拖动胶囊 → 原生 window.scrollTo；move/up 绑 window（细条仅 5px，拖动时指针必然
       离开本体，不能只靠 setPointerCapture；window 级跟踪在真机/触摸/命中子元素时都稳） */
    cap.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.jcap-note')) return;
      dragging = true; moved = false; startY = e.clientY;
      cap.classList.add('grabbing');
      try { cap.setPointerCapture(e.pointerId); } catch (_) {}
      lastMove = performance.now(); setState('clock');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (!moved && Math.abs(e.clientY - startY) > 4) moved = true;
      if (moved) {
        var vh = window.innerHeight, ratio = clamp((e.clientY - PAD) / (vh - PAD - bottomPad), 0, 1);
        window.scrollTo(0, ratio * maxScroll());
        lastMove = performance.now();
      }
    }, { passive: true });
    function endDrag() { if (dragging) { dragging = false; pinned = true; cap.classList.remove('grabbing'); } }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    cap.addEventListener('pointerenter', function () { hov = true; if (state === 'bar') setState('clock'); });
    cap.addEventListener('pointerleave', function () { hov = false; lastMove = performance.now(); });
    window.addEventListener('pointerdown', function (e) { if (!cap.contains(e.target)) pinned = false; }, true);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pinned = false; } });
    note.addEventListener('click', function (e) { e.stopPropagation(); window.JerryMusic && window.JerryMusic.toggleFull(); });

    var lastScrollY = -1, ticking = false, lastClockSec = -1;
    function onScroll() {
      lastMove = performance.now();
      if (state === 'bar') setState('clock');
      if (!ticking) { ticking = true; requestAnimationFrame(loop); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { lastMove = performance.now(); if (!ticking) { ticking = true; requestAnimationFrame(loop); } });

    function tickClock() {
      var d = new Date(), sec = d.getSeconds(), s = sec + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = d.getHours() % 12 + m / 60;
      if (sec === lastClockSec && state !== 'clock') return; lastClockSec = sec;
      if (sh) sh.setAttribute('transform', 'rotate(' + (s * 6) + ' 18 18)');
      if (mh) mh.setAttribute('transform', 'rotate(' + (m * 6) + ' 18 18)');
      if (hh) hh.setAttribute('transform', 'rotate(' + (h * 30) + ' 18 18)');
      tm.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function loop() {
      ticking = false;
      var vh = window.innerHeight, ms = maxScroll(), y0 = window.scrollY || document.documentElement.scrollTop || 0;
      // 短页面（无可滚动内容）直接隐藏
      if (document.documentElement.scrollHeight - vh <= 4) { cap.style.display = 'none'; return; }
      cap.style.display = 'block';

      var p = clamp(y0 / ms, 0, 1), railH = vh - PAD - bottomPad, h = size.h;
      var y = PAD + p * railH - h / 2;
      y = clamp(y, PAD, vh - bottomPad - h);
      cap.style.transform = 'translate3d(0,' + y + 'px,0)';

      var now = performance.now();
      if (state === 'clock' && !dragging && !pinned && !hov && now - lastMove > REST_DELAY) setState('bar');
      if (state === 'clock') { pc.textContent = Math.round(p * 100) + '%'; tickClock(); }
      // 拖动/时钟态持续跟随；bar 态也补一帧位置（resize/内容变化）
      if (dragging || state === 'clock') { ticking = true; requestAnimationFrame(loop); }
    }
    applySize();
    requestAnimationFrame(loop);
    // 每 1 秒兜底校正一次（图片懒加载等改变文档高度时）
    setInterval(function () { if (!ticking && state === 'bar') { ticking = true; requestAnimationFrame(loop); } }, 1000);
  }

  /* ============================================================
     二、真实 MusicTerminal（网易云通道）
     ============================================================ */
  function createMusicTerminal(cfg) {
    var ids = (cfg.songIds || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
    if (!ids.length) return null;
    var vol = clamp(parseFloat(cfg.defaultVolume != null ? cfg.defaultVolume : 0.5) || 0.5, 0, 1);

    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (_) {}
    var sameIds = saved.ids && saved.ids.length === ids.length && saved.ids.every(function (v, i) { return String(v) === String(ids[i]); });

    var audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = (sameIds && saved.vol != null) ? clamp(saved.vol, 0, 1) : vol;

    var st = {
      playing: false, curTime: 0, totalTime: 0, curIndex: (sameIds && saved.idx != null) ? saved.idx : 0,
      playlist: ids.map(function (id) { return { id: id, title: '加载中…', artist: cfg.playerTitle || 'BGM', cover: '', src: 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3', duration: 0 }; })
    };
    st.curIndex = st.curIndex % ids.length;
    var failChain = 0, saveTimer = 0;

    function persist(extra) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(Object.assign({
          ids: ids, idx: st.curIndex, t: audio.currentTime || 0, vol: audio.volume, playing: st.playing
        }, extra || {})));
      } catch (_) {}
    }

    function applyMeta(list) {
      var byId = {}; (list || []).forEach(function (s) { byId[String(s.id)] = s; });
      st.playlist = ids.map(function (id) {
        var s = byId[id];
        return s ? { id: String(s.id), title: s.name || ('Track ' + id), artist: s.artists || s.album || cfg.playerTitle || '网易云音乐', cover: s.pic || '', src: 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3', duration: (s.dt ? s.dt / 1000 : 0) }
                 : { id: id, title: 'Track ' + id, artist: cfg.playerTitle || '网易云音乐', cover: '', src: 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3', duration: 0 };
      });
    }

    fetch('/api/assist?do=music&ids=' + encodeURIComponent(ids.join(',')))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.songs) { applyMeta(d.songs); st.totalTime = st.playlist[st.curIndex].duration || 0; } })
      .catch(function () {});

    function go(i, autoplay) {
      st.curIndex = ((i % ids.length) + ids.length) % ids.length;
      st.curTime = 0;
      var t = st.playlist[st.curIndex];
      audio.src = t.src;
      if (t.duration) st.totalTime = t.duration;
      if (autoplay) audio.play().catch(function () {});
      persist();
    }

    audio.addEventListener('timeupdate', function () { st.curTime = audio.currentTime; if (++saveTimer % 12 === 0) persist(); });
    audio.addEventListener('loadedmetadata', function () { st.totalTime = isFinite(audio.duration) ? audio.duration : 0; st.playlist[st.curIndex].duration = st.totalTime; });
    audio.addEventListener('play', function () { st.playing = true; failChain = 0; persist(); });
    audio.addEventListener('pause', function () { st.playing = false; persist(); });
    audio.addEventListener('ended', function () { go(st.curIndex + 1, true); });
    audio.addEventListener('error', function () {
      failChain++;
      if (failChain >= ids.length) { st.playing = false; try { var tr = st.playlist[st.curIndex]; tr && (tr.title = '歌曲暂不可播（版权/网络）'); } catch (_) {} }
      else go(st.curIndex + 1, true);
    });

    go(st.curIndex, false);
    // 跨页恢复：上次在播则尝试续播（被浏览器自动播放策略拦截则静默暂停，等用户点一下）
    if (sameIds && saved.playing) {
      if (saved.t > 1) { var once = function () { try { audio.currentTime = Math.min(saved.t, (audio.duration || 1e9) - 2); } catch (_) {} audio.removeEventListener('loadedmetadata', once); }; audio.addEventListener('loadedmetadata', once); }
      audio.play().then(function () {}).catch(function () {});
    }

    var api = {
      play: function () { return audio.play().catch(function () {}); },
      pause: function () { audio.pause(); },
      toggle: function () { return audio.paused ? audio.play().catch(function () {}) : audio.pause(); },
      next: function () { go(st.curIndex + 1, !audio.paused); },
      prev: function () { go(st.curIndex - 1, !audio.paused); },
      seek: function (x) { if (isFinite(audio.duration) && audio.duration > 0) audio.currentTime = clamp(x, 0, audio.duration); },
      setVolume: function (v) { audio.volume = clamp(v, 0, 1); persist(); },
      getState: function () { return { playing: st.playing, curTime: st.curTime, totalTime: st.totalTime, curIndex: st.curIndex, playlist: st.playlist.map(function (t) { return Object.assign({}, t); }) }; }
    };
    window.MusicTerminal = api;
    return api;
  }

  /* ============================================================
     三、mini ↔ 票据完整播放器（视图层）
     ============================================================ */
  function mountPlayer(cfg) {
    var root = document.createElement('div');
    root.id = 'jm';
    root.innerHTML =
      '<div class="jm-mini glass" title="点击展开">' +
        '<div class="mc" id="jmMcCover"></div>' +
        '<div class="w" id="jmMcWave"></div>' +
        '<button class="mt-btn" id="jmMcPrev" aria-label="上一首"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z"/></svg></button>' +
        '<button class="mt-btn play" id="jmMcPlay" aria-label="播放/暂停"><svg viewBox="0 0 24 24" fill="currentColor" id="jmMcPlayIcon"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<button class="mt-btn" id="jmMcNext" aria-label="下一首"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>' +
        '<div class="bar"><b id="jmMcFill"></b></div>' +
      '</div>' +
      '<div class="jm-full glass" style="display:none">' +
        '<div class="jm-hd" id="jmFullHd" title="收起"><span class="d"><i></i><i></i><i></i></span><span>Music Terminal</span><span class="st" id="jmCpSt">○ Paused</span>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>' +
        '<div class="ticket-canvas"><div class="ticket-wrapper"><div class="ticket"><div class="t-main"><div class="t-content">' +
          '<div class="t-header"><div class="t-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>CLOUD</div><div class="t-type">Now Playing</div></div>' +
          '<div class="t-title" id="jmCpTitle">—</div>' +
          '<div class="t-subtitle" id="jmCpArtist">&nbsp;</div>' +
          '<div class="t-details">' +
            '<div class="t-detail-item"><span class="t-label">Time</span><span class="t-value mono"><span id="jmCpCur">00:00</span> / <span id="jmCpTot">00:00</span></span></div>' +
            '<div class="t-detail-item"><span class="t-label">Status</span><span class="t-value" id="jmCpStatus">Paused</span></div>' +
            '<div class="t-detail-item t-wide"><div class="mt-wave" id="jmCpWave"></div><div class="mt-progress" id="jmCpProgress"><div class="mt-progress-fill" id="jmCpFill"></div></div></div>' +
          '</div></div>' +
          '<div class="t-perforation" style="position:absolute;bottom:0;left:0;width:100%;transform:translateY(50%)"><div class="t-perf-line"></div></div>' +
        '</div><div class="t-stub" id="jmStub">' +
          '<div><div class="mt-controls">' +
            '<button class="mt-btn" id="jmCpPrev" aria-label="上一首"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z"/></svg></button>' +
            '<button class="mt-btn play" id="jmCpPlay" aria-label="播放/暂停"><svg viewBox="0 0 24 24" fill="currentColor" id="jmCpPlayIcon"><path d="M8 5v14l11-7z"/></svg></button>' +
            '<button class="mt-btn" id="jmCpNext" aria-label="下一首"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>' +
          '</div><div class="t-barcode-id">CLOUD MUSIC · LIVE</div></div>' +
          '<div><div class="t-admit-text">Cover</div><div class="mt-cover" id="jmCpCover">COVER</div></div>' +
        '</div></div></div>' +
      '</div>';
    document.body.appendChild(root);

    var mini = root.querySelector('.jm-mini'), full = root.querySelector('.jm-full');
    var cpCover = root.querySelector('#jmCpCover'), mcCover = root.querySelector('#jmMcCover');
    var cpWave = root.querySelector('#jmCpWave'), mcWave = root.querySelector('#jmMcWave');
    var cpBars = [];
    for (var i = 0; i < 40; i++) {
      var v = Math.sin(i * .45) * .5 + Math.sin(i * .17 + 1.3) * .3 + Math.sin(i * .9 + .6) * .2;
      var b = document.createElement('span');
      b.style.height = Math.round(25 + (v + 1) / 2 * 65) + '%';
      b.style.setProperty('--t', (.3 + Math.random() * .5).toFixed(2) + 's');
      b.style.setProperty('--d', (-Math.random() * .8).toFixed(2) + 's');
      cpWave.appendChild(b); cpBars.push(b);
    }
    for (var k = 0; k < 28; k++) {
      var mb = document.createElement('span');
      mb.style.setProperty('--t', (.35 + Math.random() * .5).toFixed(2) + 's');
      mb.style.setProperty('--d', (-Math.random() * .8).toFixed(2) + 's');
      mcWave.appendChild(mb);
    }

    var open = false, ox = 0, oy = 0, dragged = false;
    if (gsap) { gsap.set([mini, full], { xPercent: -50 }); gsap.set(full, { autoAlpha: 0 }); }
    else { full.style.opacity = 0; full.style.pointerEvents = 'none'; }

    function setOpen(v) {
      if (v === open) return; open = v;
      if (gsap) {
        if (v) {
          full.style.display = 'block';
          gsap.to(mini, { autoAlpha: 0, scale: .94, filter: 'blur(8px)', duration: .22, overwrite: 'auto' });
          gsap.fromTo(full, { autoAlpha: 0, scale: .92, y: 10, filter: 'blur(8px)' }, { autoAlpha: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: .45, ease: 'power3.out', overwrite: 'auto' });
        } else {
          gsap.to(full, { autoAlpha: 0, scale: .92, y: 10, filter: 'blur(8px)', duration: .28, overwrite: 'auto', onComplete: function () { full.style.display = 'none'; } });
          gsap.to(mini, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: .4, ease: 'power3.out', overwrite: 'auto' });
        }
      } else {
        full.style.display = v ? 'block' : 'none'; full.style.opacity = v ? 1 : 0; full.style.pointerEvents = v ? 'auto' : 'none';
        mini.style.opacity = v ? 0 : 1; mini.style.pointerEvents = v ? 'none' : 'auto';
      }
    }

    mini.addEventListener('click', function (e) { if (!dragged && !e.target.closest('button')) setOpen(true); });
    root.querySelector('#jmFullHd').addEventListener('click', function () { if (!dragged) setOpen(false); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });

    var ICON_PLAY = 'M8 5v14l11-7z', ICON_PAUSE = 'M7 5h4v14h-4zM13 5h4v14h-4z';
    var lastCover = null, lastPlaying = null;
    function $id(id) { return root.querySelector('#' + id); }

    function render() {
      var m = window.MusicTerminal; if (!m) return;
      var s = m.getState(), t = s.playlist[s.curIndex] || {}, ratio = s.totalTime > 0 ? clamp(s.curTime / s.totalTime, 0, 1) : 0;
      if ((t.cover || '') !== lastCover || (t.title || '') !== (mini.__t || '')) {
        lastCover = t.cover || ''; mini.__t = t.title || '';
        var bg = safeImg(t.cover);
        cpCover.style.backgroundImage = bg; mcCover.style.backgroundImage = bg;
        cpCover.classList.toggle('has-img', !!t.cover);
        mini.title = (t.title || '') + (t.artist ? ' — ' + t.artist : '');
        $id('jmCpTitle').textContent = t.title || '—';
        $id('jmCpArtist').textContent = t.artist || '\u00a0';
      }
      if (s.playing !== lastPlaying) {
        lastPlaying = s.playing;
        mini.classList.toggle('playing', s.playing); full.classList.toggle('playing', s.playing);
        var noteBtn = document.querySelector('#jcapNote'); if (noteBtn) noteBtn.classList.toggle('playing', s.playing);
        cpCover.classList.toggle('playing', s.playing);
        $id('jmMcPlayIcon').firstElementChild.setAttribute('d', s.playing ? ICON_PAUSE : ICON_PLAY);
        $id('jmCpPlayIcon').firstElementChild.setAttribute('d', s.playing ? ICON_PAUSE : ICON_PLAY);
        $id('jmCpStatus').textContent = s.playing ? 'Streaming' : 'Paused';
        $id('jmCpSt').textContent = s.playing ? '● Playing' : '○ Paused';
      }
      if (open) {
        $id('jmCpTitle').textContent = t.title || '—';
        $id('jmCpArtist').textContent = t.artist || '\u00a0';
        $id('jmCpCur').textContent = mm(s.curTime); $id('jmCpTot').textContent = mm(s.totalTime);
        $id('jmCpFill').style.width = ratio * 100 + '%';
        var cut = Math.floor(cpBars.length * ratio);
        cpBars.forEach(function (bar, idx) { bar.classList.toggle('past', idx < cut); });
      } else { $id('jmMcFill').style.width = ratio * 100 + '%'; }
    }
    (function loop() { render(); requestAnimationFrame(loop); })();

    function MT(fn) { return function (e) { e.stopPropagation(); window.MusicTerminal && window.MusicTerminal[fn](); }; }
    [['Mc', 'toggle'], ['Cp', 'toggle']].forEach(function (pair) { $id('jm' + pair[0] + 'Play').addEventListener('click', MT(pair[1])); });
    [['Prev', 'prev'], ['Next', 'next']].forEach(function (p) {
      $id('jmMc' + p[0]).addEventListener('click', MT(p[1]));
      $id('jmCp' + p[0]).addEventListener('click', MT(p[1]));
    });

    function bindSeek(el) {
      var on = false;
      function go(x) { var m = window.MusicTerminal; if (!m) return; var r = el.getBoundingClientRect(); m.seek(clamp(0, 1, (x - r.left) / r.width) * m.getState().totalTime); }
      el.addEventListener('pointerdown', function (e) { on = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} go(e.clientX); e.stopPropagation(); });
      window.addEventListener('pointermove', function (e) { if (on) go(e.clientX); });
      var off = function () { on = false; };
      window.addEventListener('pointerup', off); window.addEventListener('pointercancel', off);
    }
    bindSeek($id('jmCpProgress')); bindSeek(cpWave);

    /* 拖拽（mini / full）：pointerdown 在本体，move/up 统一在 window（指针离开元素也不丢） */
    function makeDraggable(el, skip) {
      var down = false, mv = false, sx, sy, bx, by, lx, vx = 0, rng, tm, rotTo;
      if (gsap) rotTo = gsap.quickTo(el, 'rotation', { duration: .35, ease: 'power3.out' });
      el.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest(skip)) return;
        down = true; mv = false; sx = lx = e.clientX; sy = e.clientY; vx = 0; bx = ox; by = oy;
        var r = el.getBoundingClientRect();
        rng = { x0: ox - (r.left - 8), x1: ox + (window.innerWidth - 8 - r.right), y0: oy - (r.top - 8), y1: oy + (window.innerHeight - 8 - r.bottom) };
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        if (!mv) { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 5) return; mv = true; el.style.cursor = 'grabbing'; if (gsap) gsap.set(el, { transformOrigin: '50% 0%' }); }
        ox = clamp(rng.x0, rng.x1, bx + e.clientX - sx); oy = clamp(rng.y0, rng.y1, by + e.clientY - sy);
        if (gsap) gsap.set(root, { x: ox, y: oy }); else { root.style.marginLeft = ox + 'px'; root.style.marginTop = (-oy) + 'px'; }
        vx = vx * .7 + (e.clientX - lx) * .3; lx = e.clientX;
        if (rotTo) { rotTo(clamp(-22, 22, vx * 1.2)); clearTimeout(tm); tm = setTimeout(function () { rotTo(0); }, 90); }
      });
      function end() {
        if (!down) return; down = false; if (!mv) return;
        clearTimeout(tm); el.style.cursor = ''; dragged = true; setTimeout(function () { dragged = false; }, 60);
        if (gsap) gsap.to(el, { rotation: 0, duration: 1.1, ease: 'elastic.out(1,.35)', overwrite: 'auto', onComplete: function () { gsap.set(el, { transformOrigin: '50% 100%' }); } });
      }
      window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    }
    makeDraggable(mini, 'button');
    makeDraggable(full, '.mt-btn,#jmCpWave,#jmCpProgress,.t-stub,#jmFullHd,.jm-hd');

    /* 撕下票根关闭 full（move/up 在 window，甩动不丢） */
    (function tear() {
      var stub = root.querySelector('#jmStub'), down = false, sx, sy;
      stub.title = '向下撕关闭';
      stub.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.mt-btn')) return;
        down = true; sx = e.clientX; sy = e.clientY;
        if (gsap) gsap.set(stub, { transformOrigin: '0% 0%' });
        e.stopPropagation();
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return; var dx = e.clientX - sx, dy = e.clientY - sy;
        if (gsap) gsap.set(stub, { x: dx * .7, y: dy * .7, rotation: clamp(-8, 60, dx * .12 + dy * .25) });
        else stub.style.transform = 'translate(' + dx * .7 + 'px,' + dy * .7 + 'px) rotate(' + clamp(-8, 60, dx * .12 + dy * .25) + 'deg)';
      });
      function end(e) {
        if (!down) return; down = false; var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) >= 70 && dy > 10) {
          if (gsap) {
            gsap.to(stub, { x: dx * 1.2 + (dx >= 0 ? 120 : -120), y: dy * .7 + 260, rotation: '+=40', opacity: 0, duration: .6, ease: 'power2.in' });
            gsap.delayedCall(.35, function () { setOpen(false); });
            gsap.delayedCall(.9, function () { gsap.set(stub, { clearProps: 'all' }); });
          } else { setOpen(false); stub.style.transform = ''; }
        } else if (gsap) gsap.to(stub, { x: 0, y: 0, rotation: 0, duration: .9, ease: 'elastic.out(1,.4)' });
        else stub.style.transform = '';
      }
      window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    })();

    window.JerryMusic = { toggleFull: function () { setOpen(!open); }, setOpen: setOpen };
    return root;
  }

  /* ============================================================
     启动
     ============================================================ */
  function fetchMusicConfig() {
    if (window.JERRY_SITE_CFG && window.JERRY_SITE_CFG.music) return Promise.resolve(window.JERRY_SITE_CFG.music);
    return fetch('/site.config.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { return (c && c.music) || null; }).catch(function () { return null; });
  }

  /* 本地/管理员编辑条 .jl-bar（z-index 最高）出现时，把播放器与滚动条上抬避让；访客无此条 */
  function avoidEditBar() {
    function tick() {
      var jm = document.getElementById('jm'), bar = document.querySelector('.jl-bar');
      var raise = 20, visible = false;
      if (bar) {
        var r = bar.getBoundingClientRect();
        visible = r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 6;
        if (visible) raise = Math.round(window.innerHeight - r.top + 10);
      }
      bottomPad = visible ? raise - 4 : 12;
      if (jm) {
        jm.style.bottom = visible ? raise + 'px' : '';
        // 给正文底部留出播放器高度，使最后一行能滚到悬浮播放器上方，不被永久遮挡
        document.body.style.paddingBottom = Math.round(raise + 64) + 'px';
        // 窄屏右下角有移动动作坞 #mobile-action-dock，播放器收窄并左对齐、右缘让开它
        var mini = jm.querySelector('.jm-mini');
        if (mini) {
          var dock = document.querySelector('#mobile-action-dock');
          var dr = dock ? dock.getBoundingClientRect() : null;
          var narrow = window.innerWidth <= 680 && dr && dr.width > 0 && dr.left < window.innerWidth;
          if (narrow) {
            var w = Math.round(dr.left - 20);
            if (w > 200) {
              mini.style.width = w + 'px';
              // #jm 锚点在屏幕水平中心(vw/2)：用 x 把 mini 左缘钉到屏幕左侧 12px
              if (gsap) gsap.set(mini, { xPercent: 0, x: 12 - window.innerWidth / 2 });
              else { mini.style.left = (12 - window.innerWidth / 2) + 'px'; mini.style.transform = 'none'; }
            }
          } else if (mini.style.width) {
            mini.style.width = ''; mini.style.left = '';
            if (gsap) gsap.set(mini, { xPercent: -50, x: 0 });
          }
        }
      }
    }
    setInterval(tick, 350);
    window.addEventListener('resize', tick);
    tick();
  }

  function start() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    if (!PLAYER_ONLY) mountCapsule();
    avoidEditBar();
    fetchMusicConfig().then(function (mc) {
      if (mc && mc.enabled && (mc.songIds || []).length) {
        createMusicTerminal(mc);
        mountPlayer(mc);
      }
    });
  }

  function boot() {
    loadGsap().then(function (g) {
      gsap = g || window.gsap || null;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    });
  }
  boot();
})();
