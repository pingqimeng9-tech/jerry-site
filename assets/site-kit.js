/* ============================================================
   Jerry Site Kit v1 —— 站点组件集（单文件）
   页面侧只需一行：<script src="/assets/site-kit.js"></script>
   ------------------------------------------------------------
   读取 /site.config.json（本地由 CMS「更新本地」生成，线上随仓库部署）
   提供：导航注入 / AI 猫助理 / 悬浮音乐播放器 / 弹幕背景
        氛围特效（樱花·雪·萤火虫）/ 页脚 / 社交链接
   全部组件尊重配置开关，未配置时静默不渲染。
   ============================================================ */
(function () {
  if (window.__jerrySiteKit) return;
  window.__jerrySiteKit = true;

  var CFG = null;
  var API_BASE = ''; // 本地 CMS 存在时可用 /api/*；线上为静态站，AI/音乐元数据自动降级

  var DEFAULTS = {
    profile: { siteName: 'JERRY.DEV', authorName: 'Jerry', bio: '', avatarUrl: '', social: {}, navigation: [] },
    background: { useGradient: true, bgImages: [], effect: 'none' },
    danmaku: { enabled: false, texts: [], speed: 12, opacity: 0.5 },
    aiCat: { enabled: false, name: '小猫', greeting: '喵？' },
    comment: { provider: 'local' },
    music: { enabled: false, songIds: [], defaultVolume: 0.5, playerTitle: 'BGM' },
    footer: { text: '', links: [], beian: '' }
  };

  function loadConfig() {
    return fetch('/site.config.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (c) {
        CFG = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), c || {});
        // 探测本地 CMS（有则启用 AI / 评论等动态能力）
        return fetch('/api/admin/posts', { method: 'POST' }).then(function (r) { return r.ok; }).catch(function () { return false; });
      })
      .then(function (local) { API_BASE = local ? '' : null; boot(local); });
  }
  function deepMerge(base, over) {
    for (var k in over) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], over[k]);
      else base[k] = over[k];
    }
    return base;
  }

  var css = [
    '.jsk-cat-btn{position:fixed;left:22px;bottom:22px;z-index:2147482000;width:58px;height:58px;border-radius:50%;border:1px solid rgba(255,255,255,.3);cursor:pointer;',
    'background:linear-gradient(135deg,#B18CFF,#5CE1E6);box-shadow:0 12px 30px rgba(177,140,255,.4);font-size:28px;line-height:56px;text-align:center;user-select:none;transition:transform .2s;}',
    '.jsk-cat-btn:hover{transform:scale(1.1) rotate(-6deg)}',
    '.jsk-chat{position:fixed;left:22px;bottom:92px;z-index:2147482000;width:min(340px,calc(100vw - 44px));height:440px;display:none;flex-direction:column;border-radius:18px;overflow:hidden;',
    'background:rgba(20,16,45,.85);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.28);box-shadow:0 24px 60px rgba(0,0,0,.5);}',
    '.jsk-chat.open{display:flex}',
    '.jsk-chat-head{padding:12px 16px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.14)}',
    '.jsk-chat-head .x{margin-left:auto;cursor:pointer;opacity:.7;font-weight:400}',
    '.jsk-chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}',
    '.jsk-msg{max-width:82%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word}',
    '.jsk-msg.ai{align-self:flex-start;background:rgba(255,255,255,.12);border-bottom-left-radius:4px}',
    '.jsk-msg.me{align-self:flex-end;background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border-bottom-right-radius:4px}',
    '.jsk-chat-foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.14)}',
    '.jsk-chat-foot input{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:9px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit}',
    '.jsk-chat-foot button{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border:none;border-radius:10px;color:#fff;padding:0 16px;font-weight:700;cursor:pointer;font-family:inherit}',
    '.jsk-music{position:fixed;right:22px;bottom:22px;z-index:2147482000;display:flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:999px;cursor:pointer;',
    'background:rgba(20,16,45,.75);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.22);box-shadow:0 12px 30px rgba(0,0,0,.4);max-width:min(300px,60vw)}',
    '.jsk-music .cover{width:38px;height:38px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.12);animation:jsk-spin 12s linear infinite;animation-play-state:paused}',
    '.jsk-music.playing .cover{animation-play-state:running}',
    '@keyframes jsk-spin{to{transform:rotate(360deg)}}',
    '.jsk-music .info{min-width:0;font-size:12px;line-height:1.4}',
    '.jsk-music .info .t{font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.jsk-music .info .a{color:#c9c6e8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.jsk-danmaku{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}',
    '.jsk-danmaku span{position:absolute;white-space:nowrap;font-size:14px;color:rgba(255,255,255,.85);text-shadow:0 2px 8px rgba(0,0,0,.6);will-change:transform}',
    '.jsk-fx{position:fixed;inset:0;pointer-events:none;z-index:1}',
    '.jsk-footer-links{display:flex;gap:16px;justify-content:center;margin-bottom:6px;flex-wrap:wrap}',
    '.jsk-footer-links a{color:#c9c6e8;text-decoration:none}.jsk-footer-links a:hover{color:#5CE1E6}'
  ].join('');

  function boot(local) {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    injectNav();
    if (CFG.danmaku && CFG.danmaku.enabled) initDanmaku();
    if (CFG.background && CFG.background.effect && CFG.background.effect !== 'none') initAmbient(CFG.background.effect);
    if (CFG.aiCat && CFG.aiCat.enabled && API_BASE === '') initCat();
    if (CFG.music && CFG.music.enabled && (CFG.music.songIds || []).length) initMusic();
    injectFooter();
  }

  /* ---------- 导航注入：把配置的导航项补进 nav .links（已存在的跳过） ---------- */
  function injectNav() {
    var items = (CFG.profile && CFG.profile.navigation) || [];
    if (!items.length) return;
    document.querySelectorAll('nav .links, .mobile-menu').forEach(function (box) {
      items.forEach(function (it) {
        if (!it.href) return;
        if (box.querySelector('a[href="' + it.href + '"]')) return;
        var a = document.createElement('a');
        a.href = it.href; a.textContent = it.label || it.href;
        box.appendChild(a);
      });
    });
  }

  /* ---------- 弹幕背景 ---------- */
  function initDanmaku() {
    var layer = document.createElement('div');
    layer.className = 'jsk-danmaku';
    layer.style.opacity = CFG.danmaku.opacity || 0.5;
    document.body.appendChild(layer);
    var texts = (CFG.danmaku.texts || []).filter(Boolean);
    if (!texts.length) return;
    var speed = (CFG.danmaku.speed || 12) * 1000;
    function spawn(text, i) {
      var s = document.createElement('span');
      s.textContent = text;
      s.style.top = (5 + Math.random() * 85) + 'vh';
      s.style.fontSize = (12 + Math.random() * 8) + 'px';
      s.style.left = '100vw';
      s.style.transform = 'translateX(0)';
      layer.appendChild(s);
      var dur = speed * (0.7 + Math.random() * 0.6);
      s.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-' + (window.innerWidth + 600) + 'px)' }],
        { duration: dur, easing: 'linear' }).onfinish = function () { s.remove(); };
    }
    texts.forEach(function (t, i) { setTimeout(function () { spawn(t, i); }, i * (speed / texts.length / 2)); });
    setInterval(function () { spawn(texts[Math.floor(Math.random() * texts.length)]); }, speed / 2.5);
  }

  /* ---------- 氛围特效：sakura / snow / fireflies ---------- */
  function initAmbient(kind) {
    var canvas = document.createElement('canvas');
    canvas.className = 'jsk-fx';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W, H, parts = [];
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    var N = Math.min(60, Math.floor(W / 24));
    for (var i = 0; i < N; i++) {
      parts.push({
        x: Math.random() * W, y: Math.random() * H,
        r: kind === 'fireflies' ? 1.5 + Math.random() * 2 : 2 + Math.random() * 4,
        vy: kind === 'sakura' ? 0.5 + Math.random() * 0.9 : kind === 'snow' ? 0.4 + Math.random() * 0.8 : (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * (kind === 'sakura' ? 1.2 : 0.6),
        ph: Math.random() * Math.PI * 2, spin: Math.random() * Math.PI
      });
    }
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.x += p.vx + Math.sin(p.ph += 0.01) * 0.6;
        p.y += p.vy;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
        if (kind === 'sakura') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin += 0.01);
          ctx.fillStyle = 'rgba(255,183,214,.75)';
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.4, p.r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (kind === 'snow') {
          ctx.fillStyle = 'rgba(255,255,255,.8)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2); ctx.fill();
        } else {
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, 'rgba(255,230,150,.9)'); g.addColorStop(1, 'rgba(255,230,150,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      });
      requestAnimationFrame(draw);
    })();
  }

  /* ---------- AI 猫助理 ---------- */
  function initCat() {
    var ai = CFG.aiCat;
    var btn = document.createElement('div');
    btn.className = 'jsk-cat-btn';
    btn.textContent = '🐱';
    btn.title = ai.name + '（AI 助理）';
    var panel = document.createElement('div');
    panel.className = 'jsk-chat';
    panel.innerHTML =
      '<div class="jsk-chat-head">🐱 ' + esc(ai.name || '小猫') + '<span class="x">✕</span></div>' +
      '<div class="jsk-chat-body"></div>' +
      '<div class="jsk-chat-foot"><input placeholder="跟' + esc(ai.name || '小猫') + '说点什么…" maxlength="500"><button>发送</button></div>';
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    var body = panel.querySelector('.jsk-chat-body');
    var input = panel.querySelector('input');
    var sendBtn = panel.querySelector('.jsk-chat-foot button');
    var history = [];

    function addMsg(role, text) {
      var d = document.createElement('div');
      d.className = 'jsk-msg ' + (role === 'assistant' ? 'ai' : 'me');
      d.textContent = text;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }
    addMsg('assistant', ai.greeting || '喵？');

    btn.addEventListener('click', function () { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); });
    panel.querySelector('.x').addEventListener('click', function () { panel.classList.remove('open'); });

    function send() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMsg('user', text);
      history.push({ role: 'user', content: text });
      var tip = addMsg('assistant', '…思考中');
      fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) {
          tip.textContent = d.reply;
          history.push({ role: 'assistant', content: d.reply });
        } else {
          tip.textContent = '😴 ' + (d.error || '猫猫睡着了（此功能需要本地 CMS 服务）');
        }
        body.scrollTop = body.scrollHeight;
      }).catch(function () { tip.textContent = '😴 猫猫睡着了（此功能需要本地 CMS 服务）'; });
    }
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  }

  /* ---------- 悬浮音乐播放器（网易云） ---------- */
  function initMusic() {
    var ids = (CFG.music.songIds || []).filter(Boolean);
    var idx = 0;
    var audio = new Audio();
    audio.volume = Math.min(1, Math.max(0, CFG.music.defaultVolume || 0.5));
    audio.preload = 'none';

    var el = document.createElement('div');
    el.className = 'jsk-music';
    el.innerHTML = '<img class="cover" alt=""><div class="info"><div class="t">' + esc(CFG.music.playerTitle || 'BGM') + '</div><div class="a">加载中…</div></div>';
    document.body.appendChild(el);
    var cover = el.querySelector('.cover'), tEl = el.querySelector('.t'), aEl = el.querySelector('.a');

    var meta = {};
    fetch('/api/music?ids=' + ids.join(',')).then(function (r) { return r.json(); }).then(function (d) {
      (d.songs || []).forEach(function (s) { meta[s.id] = s; });
      applyTrack();
    }).catch(function () { applyTrack(); });

    function applyTrack() {
      var id = ids[idx];
      var s = meta[id];
      tEl.textContent = s ? s.name : (CFG.music.playerTitle || 'BGM');
      aEl.textContent = s ? (s.artists + ' · ' + s.album) : '点击播放 ▶';
      if (s && s.pic) cover.src = s.pic;
      audio.src = 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3';
    }
    el.addEventListener('click', function () {
      if (audio.paused) { audio.play().catch(function () { aEl.textContent = '播放失败（版权/网络）'; }); }
      else audio.pause();
    });
    audio.addEventListener('playing', function () { el.classList.add('playing'); aEl.textContent = (meta[ids[idx]] ? meta[ids[idx]].artists + ' · ' : '') + '♪ 播放中'; });
    audio.addEventListener('pause', function () { el.classList.remove('playing'); });
    audio.addEventListener('ended', function () {
      idx = (idx + 1) % ids.length;
      applyTrack();
      audio.play().catch(function () {});
    });
    audio.addEventListener('error', function () { aEl.textContent = '这首歌播不了，试试下一首'; });
  }

  /* ---------- 页脚 ---------- */
  function injectFooter() {
    if (document.querySelector('footer')) return;
    var f = CFG.footer || {};
    var el = document.createElement('footer');
    var links = (f.links || []).filter(function (l) { return l.label && l.href; })
      .map(function (l) { return '<a href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>'; }).join('');
    el.innerHTML =
      (links ? '<div class="jsk-footer-links">' + links + '</div>' : '') +
      esc(f.text || '© ' + (CFG.profile.siteName || 'JERRY.DEV')) +
      (f.beian ? ' · <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener" style="color:inherit">' + esc(f.beian) + '</a>' : '');
    document.body.appendChild(el);
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadConfig);
  else loadConfig();
})();
