/* ============================================================
   cine-guide.js — 融合播放器（Cine Stage）新手引导
   首次打开自动弹出分步教程；右上角「小灯泡」按钮随时重看。
   页面接入：<script src="/assets/cine-guide.js" defer></script>
   不依赖 Folia/Cine 挂载，纯 DOM 注入，可独立工作。
   ============================================================ */
(function () {
  'use strict';
  if (window.__cineGuide) return;
  window.__cineGuide = true;

  var KEY = 'jerry.cine.guide.v1';

  var STEPS = [
    { icon: '🎬', title: '欢迎来到 Cine Stage', text: '这是 Folia × Mineradio 融合播放器：一个播放器，两层体验——Folia 负责搜索/播放/歌单，Cine 舞台负责粒子、电影镜头和 3D 歌词。' },
    { icon: '🔍', title: '第 1 步 · 搜索歌曲', text: '在顶部搜索框输入歌名（如「花に亡霊」），回车后从结果里点一首歌。' },
    { icon: '▶️', title: '第 2 步 · 开始播放', text: '点击播放按钮。开始播放后，画面会自动切换到电影舞台。' },
    { icon: '🎶', title: '第 3 步 · 3D 歌词', text: '播放时，歌词会在 3D 空间里逐句高亮、随镜头有透视变化，鼓点来临时粒子和文字一起响应。' },
    { icon: '📚', title: '第 4 步 · 3D 歌单架（桌面端）', text: '桌面端画面右侧是 3D 歌单架，点任意卡片即可打开对应歌单。手机端会自动降级为轻量粒子，不显示歌单架。' },
    { icon: '🌤', title: '第 5 步 · 天气电台', text: '右上角显示当前天气和温度，点 LOCATE 会用浏览器定位到你的城市（需要授权）。' },
    { icon: '🔙', title: '第 6 步 · 切换回经典版', text: '顶部导航栏里的「经典版」可随时切回原来的 Folia 播放器，互不影响。' }
  ];

  var css = [
    '.cg-root{--cg-accent:#7c3aed;--cg-pink:#ff4d9d}',
    '#cg-bulb{position:fixed;top:max(14px,env(safe-area-inset-top));right:16px;z-index:2147483500;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(12,12,18,.62);color:#ffd36e;display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 8px 26px rgba(0,0,0,.35);transition:transform .15s,background .2s}',
    '#cg-bulb:hover{background:rgba(28,28,40,.82);transform:scale(1.06)}',
    '#cg-bulb:active{transform:scale(.94)}',
    '#cg-bulb svg{width:21px;height:21px;fill:currentColor}',
    '#cg-overlay{position:fixed;inset:0;z-index:2147483600;background:rgba(5,6,10,.78);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);display:none;align-items:flex-end;justify-content:center;padding:0 16px calc(20px + env(safe-area-inset-bottom))}',
    '#cg-overlay.open{display:flex}',
    '#cg-card{width:min(460px,100%);background:linear-gradient(145deg,rgba(28,28,40,.96),rgba(16,16,24,.98));border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:22px 20px 18px;color:#f3f5f8;box-shadow:0 30px 80px rgba(0,0,0,.6);position:relative;overflow:hidden}',
    '#cg-card::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(124,58,237,.25),transparent 60%);pointer-events:none}',
    '#cg-icon{font-size:34px;line-height:1;margin-bottom:12px}',
    '#cg-title{font-size:17px;font-weight:800;letter-spacing:-.01em;margin-bottom:8px}',
    '#cg-text{font-size:14px;line-height:1.75;color:rgba(230,235,244,.82);min-height:72px}',
    '#cg-dots{display:flex;gap:6px;margin:16px 0 14px}',
    '#cg-dots i{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.16);transition:background .3s}',
    '#cg-dots i.on{background:var(--cg-pink)}',
    '#cg-actions{display:flex;align-items:center;gap:10px}',
    '#cg-actions button{min-height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:600 13px system-ui,-apple-system,sans-serif;cursor:pointer;padding:0 16px}',
    '#cg-actions button:active{transform:scale(.97)}',
    '#cg-next{margin-left:auto;background:var(--cg-pink)!important;border-color:var(--cg-pink)!important}',
    '#cg-skip{border-color:transparent!important;background:transparent!important;color:rgba(230,235,244,.6)!important}',
    '@media (max-width:640px){#cg-card{padding:20px 16px 16px}#cg-title{font-size:15.5px}#cg-text{font-size:13px}}'
  ].join('');

  var idx = 0;

  function injectStyle() {
    var st = document.createElement('style');
    st.id = 'cg-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var bulb = document.createElement('button');
    bulb.id = 'cg-bulb';
    bulb.type = 'button';
    bulb.setAttribute('aria-label', '打开使用指引');
    bulb.title = '使用指引';
    bulb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.9 10.5c.6.6.9 1.4.9 2.2V16h6v-.3c0-.8.3-1.6.9-2.2A6 6 0 0 0 12 3z"/></svg>';
    document.body.appendChild(bulb);

    var overlay = document.createElement('div');
    overlay.id = 'cg-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '使用指引');
    overlay.innerHTML =
      '<div id="cg-card">' +
        '<div id="cg-icon"></div>' +
        '<div id="cg-title"></div>' +
        '<div id="cg-text"></div>' +
        '<div id="cg-dots">' + STEPS.map(function () { return '<i></i>'; }).join('') + '</div>' +
        '<div id="cg-actions">' +
          '<button id="cg-prev" type="button">上一步</button>' +
          '<button id="cg-skip" type="button">跳过</button>' +
          '<button id="cg-next" type="button">下一步</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    bulb.addEventListener('click', function () { open(0); });
    document.getElementById('cg-prev').addEventListener('click', function () { open(idx - 1); });
    document.getElementById('cg-next').addEventListener('click', function () { open(idx + 1); });
    document.getElementById('cg-skip').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') open(idx + 1);
      else if (e.key === 'ArrowLeft') open(idx - 1);
    });
  }

  function open(i) {
    idx = Math.max(0, Math.min(STEPS.length - 1, i));
    var s = STEPS[idx];
    document.getElementById('cg-icon').textContent = s.icon;
    document.getElementById('cg-title').textContent = s.title;
    document.getElementById('cg-text').textContent = s.text;
    var dots = document.querySelectorAll('#cg-dots i');
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === idx);
    document.getElementById('cg-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
    document.getElementById('cg-next').textContent = idx === STEPS.length - 1 ? '开始使用' : '下一步';
    document.getElementById('cg-overlay').classList.add('open');
  }

  function close() {
    document.getElementById('cg-overlay').classList.remove('open');
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function boot() {
    injectStyle();
    build();
    var seen = false;
    try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (!seen) {
      // 等 Folia 启动遮罩淡出后再显示，避免被 splash 盖住
      setTimeout(function () { open(0); }, 1600);
    }
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
