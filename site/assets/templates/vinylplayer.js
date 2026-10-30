/* ─── 31 Soft Static ─── */
/* 黑胶唱片机 + 逐字歌词透视排版。内核同时供画廊模板与 /assets/folia-vinyl.js 使用。 */
(function () {
  'use strict';
  window.__JERRY_TEMPLATES = window.__JERRY_TEMPLATES || [];
  window.__JERRY_REGISTER_TEMPLATE = window.__JERRY_REGISTER_TEMPLATE || function (t) { window.__JERRY_TEMPLATES.push(t); };

  var COLS = ['#ef4657', '#f5b83a', '#e0609f', '#7b61ff', '#5b6cff', '#3ddc5a'];
  var REV = 1.8;
  var TK = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]|[^\s\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]+/g;
  var META = /^\s*(作词|作曲|编曲|制作人?|混音|母带|录音|监制|和声|企划|策划|出品|发行|词|曲|lyrics|composer|arranger)\s*[:：]/i;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mod = function (n, m) { return ((n % m) + m) % m; };
  var split = function (s) {
    return Array.from(String(s == null ? '' : s).matchAll(TK)).map(function (m) {
      return { s: m[0], sp: /\s/.test(s[m.index + m[0].length] || '') };
    });
  };

  /* ---------- 歌词：网易云逐字（yrc）或逐行（lrc）→ tokens ---------- */
  function parseLrc(text) {
    var R = [];
    String(text || '').split('\n').forEach(function (row) {
      var tx = row.replace(/\[[^\]]*\]/g, '').trim();
      if (!tx || META.test(tx)) return;
      var re = /\[(\d+):(\d+(?:\.\d+)?)\]/g, m;
      while ((m = re.exec(row))) R.push({ t: (+m[1]) * 60 + (+m[2]), tx: tx });
    });
    R.sort(function (a, b) { return a.t - b.t; });
    return R.map(function (l, i) {
      var w = split(l.tx), d = Math.max(.4, Math.min(R[i + 1] ? R[i + 1].t - l.t : 5, 6) - .1);
      return {
        t: l.t,
        w: w.map(function (x, k) {
          return { s: x.s, sp: x.sp, t: l.t + d * k / w.length, e: l.t + d * (k + 1) / w.length };
        })
      };
    }).filter(function (l) { return l.w.length; });
  }
  function parseYrc(text) {
    var R = [];
    String(text || '').split('\n').forEach(function (row) {
      var h = row.match(/^\[(\d+),(\d+)\]/);
      if (!h) return;
      var w = [], re = /\((\d+),(\d+),\d+\)([^(]*)/g, body = row.slice(h[0].length), m;
      while ((m = re.exec(body))) {
        var s = m[3];
        if (!s.trim()) { if (w.length) w[w.length - 1].sp = true; continue; }
        w.push({ s: s.trim(), sp: /\s$/.test(s), t: (+m[1]) / 1000, e: ((+m[1]) + (+m[2])) / 1000 });
      }
      if (w.length && !META.test(w.map(function (x) { return x.s; }).join(''))) R.push({ t: (+h[1]) / 1000, w: w });
    });
    return R;
  }

  var SVG_PREV = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2h1.6v10H2zM12 2v10L5 7z"/></svg>';
  var SVG_NEXT = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M10.4 2H12v10h-1.6zM2 2l7 5-7 5z"/></svg>';
  var SVG_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2l8 5-8 5z"/></svg>';
  var SVG_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h2.6v10H3zM8.4 2H11v10H8.4z"/></svg>';

  var CSS = '.vd{--bg:#0a0909;--fg:#fff;--dim:#4b4b51;--mut:#8b8b92;--red:#e8604c;position:absolute;inset:0;overflow:hidden;background:var(--bg);color:var(--fg);font-family:Inter,-apple-system,system-ui,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none;touch-action:none;color-scheme:dark;isolation:isolate}'
    + '.vd.stg{background:var(--bg);color:var(--fg)}'
    + '.vd canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '.vd-gl{filter:drop-shadow(0 0 38px rgba(255,40,110,.28))}'
    + '.vd-fb{position:absolute;display:none;z-index:0;pointer-events:none}'
    + '.vd-nogl .vd-fb{display:block}.vd-nogl .vd-gl{display:none}'
    + '.vd-fb i{position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle,#141318 0 2px,#1d1c22 2px 4px);box-shadow:inset 0 0 40px rgba(255,255,255,.06),0 0 60px rgba(255,40,110,.22);transform:rotate(var(--rot,0deg))}'
    + '.vd-fb img{position:absolute;left:50%;top:50%;width:74%;height:74%;transform:translate(-50%,-50%);border-radius:50%;background:#1a1622}'
    + '.vd-st{position:absolute;inset:0;cursor:grab;z-index:1}.vd-st.g{cursor:grabbing}'
    + '.vd-L{position:absolute;left:0;top:0;pointer-events:none;z-index:2}'
    + '.vd .ln{position:absolute;left:0;top:0;white-space:pre;font:500 var(--fs) ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;transform-origin:0 50%;will-change:transform,opacity,filter;line-height:1.5}'
    + '.vd .ln b{position:absolute;right:100%;margin-right:.5em;bottom:.2em;font-weight:500;font-size:.4em;color:var(--red)}'
    + '.vd.p .ln b{right:auto;left:0;bottom:100%;margin:0}'
    + '.vd .n{position:relative;display:inline-block;padding:0 .12em;margin:0 -.12em;border-radius:.16em;color:var(--dim);pointer-events:auto;cursor:pointer}'
    + '.vd-dot{position:absolute;left:0;top:0;width:.26em;height:.26em;margin-left:-.13em;border:2px solid var(--c,#e8604c);background:color-mix(in srgb,var(--c,#e8604c) 45%,transparent);pointer-events:none;will-change:transform;z-index:2}'
    + '.vd-tt{position:absolute;top:4%;right:4%;text-align:right;font-size:15px;line-height:1.5;z-index:3;pointer-events:none;max-width:56%}'
    + '.vd-tt b{display:block;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.vd-tt small{display:block;color:var(--mut);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.vd-tt i{color:var(--red);font-style:normal}'
    + '.vd-ct{position:absolute;left:50%;bottom:3.2%;transform:translateX(-50%);display:flex;align-items:center;gap:clamp(8px,2.2vw,18px);z-index:4}'
    + '.vd-btn{all:unset;box-sizing:border-box;cursor:pointer;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;color:var(--mut);transition:color .15s,background .15s,transform .12s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}'
    + '.vd-btn svg{width:18px;height:18px;fill:currentColor}'
    + '.vd-btn:hover{color:#fff;background:rgba(255,255,255,.08)}'
    + '.vd-btn:active{transform:scale(.92)}'
    + '.vd-btn:focus-visible{box-shadow:0 0 0 2px var(--red);color:#fff}'
    + '.vd-pp{width:56px;height:56px;border:1px solid #3a3a3e;color:#fff;background:rgba(255,255,255,.05)}'
    + '.vd-pp svg{width:20px;height:20px}'
    + '.vd-pp[aria-pressed="true"]{background:var(--red);border-color:var(--red);color:#0a0909}'
    + '.vd-pp[aria-pressed="true"]:hover{background:#f07a66;color:#160a08}'
    + '.vd-tm{position:absolute;right:4%;bottom:4%;font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums;pointer-events:none;z-index:3}'
    + '.vd-tm b{color:#fff;font-weight:400}'
    + '.vd-hint{position:absolute;left:4%;bottom:4.4%;font:10px ui-monospace,"SF Mono",Menlo,Consolas,monospace;color:var(--mut);opacity:.55;pointer-events:none;z-index:3;transition:opacity .7s;max-width:42%;line-height:1.5}'
    + '.vd-hint.gone{opacity:0}'
    + '.vd.p .vd-tt{top:3%;right:6%;font-size:13px;max-width:64%}'
    + '.vd.p .vd-tm{font-size:11px}'
    + '.vd.p .vd-hint{display:none}'
    + '.vd.compact .vd-btn{width:40px;height:40px}'
    + '.vd.compact .vd-pp{width:48px;height:48px}'
    + '.vd.compact .vd-tt{font-size:12px}'
    + '.vd.compact .vd-tt small{font-size:11px}'
    + '.vd.compact .vd-ct{bottom:2.4%}'
    + '@media (prefers-reduced-motion:reduce){.vd .ln{filter:none!important}}';

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FSRC = 'precision highp float;uniform vec2 res,c;uniform float r,rot,t,k;uniform sampler2D tx;\n'
    + 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}\n'
    + 'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}\n'
    + 'float fb(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+7.1;a*=.5;}return s;}\n'
    + 'void main(){vec2 u=vec2(gl_FragCoord.x-c.x,res.y-gl_FragCoord.y-c.y)/r;float d=length(u);if(d>1.){gl_FragColor=vec4(0);return;}\n'
    + 'float cs=cos(rot),sn=sin(rot);vec2 q=mat2(cs,sn,-sn,cs)*u;\n'
    + 'if(d<.37){vec4 lb=texture2D(tx,q/.74+.5);float e=smoothstep(.012,.0,d);gl_FragColor=vec4(mix(lb.rgb,vec3(0),e),1.);return;}\n'
    + 'vec2 w=q*2.1+vec2(t*.05,-t*.04);vec2 a=vec2(fb(w+vec2(0,t*.07)),fb(w+vec2(5.2,1.3)-t*.05));float m=fb(w+3.2*a+t*.03);float m2=fb(w*1.7-2.4*a);\n'
    + 'vec3 col=mix(vec3(.2,.1,.58),vec3(1.,.17,.58),smoothstep(.25,.6,m));col=mix(col,vec3(1.,.6,.15),smoothstep(.55,.8,m2)*.9);col=mix(col,vec3(.36,.3,.9),smoothstep(.62,.35,m2)*.45);\n'
    + 'col*=.82+.18*sin(d*520.+m*6.)*.5+.09*sin(d*130.);col+=pow(abs(cos(2.*atan(u.y,u.x)-1.2)),10.)*.2*vec3(1,.85,.95)*(1.-d*.4);\n'
    + 'col*=1.-smoothstep(.93,1.,d)*.5;col*=mix(.55,1.,smoothstep(.37,.4,d));col+=k*.12;\n'
    + 'float ring=smoothstep(.37,.385,d)*smoothstep(.405,.385,d);col*=1.-ring;\n'
    + 'float al=smoothstep(1.,.995,d);gl_FragColor=vec4(col*al,al);}';

  /* ---------- 三首内置合成曲（离线可用，可切歌） ---------- */
  var NCOL = { c: '#ef4657', d: '#f5b83a', eb: '#e0609f', f: '#7b61ff', g: '#5b6cff', bb: '#3ddc5a' };
  var SEMI = { c: 0, d: 2, eb: 3, f: 5, g: 7, bb: 10 };
  var TRACKS = [
    {
      name: 'Soft Static', sub: 'Claude Code · A side', step: .25, shift: 0, bright: 1,
      song: [
        ['verse', 'g4 g4 bb4 c5 [eb5 d5] [c5 bb4]'],
        ['verse', 'c5 c5 bb4 [c5 eb5] d5 c5 g4 _ _'],
        ['drop', 'c6 g5 eb6 d6 [bb5 g5] [f5 d5]'],
        ['hook', 'eb5 [eb5 f5 g5 f5] eb5 _ _'],
        ['hook', 'c5 c5 d5 eb5 d5 c5 _ _'],
        ['hook', 'eb5 [eb5 f5 g5 f5] eb5 _ _'],
        ['outro', 'g4 [bb4 c5 d5] [eb5 d5] c5 _ _ _']
      ]
    },
    {
      name: 'Soft Return', sub: 'Claude Code · B side', step: .25, shift: 5, bright: .82,
      song: [
        ['verse', 'f4 f4 g4 bb4 [c5 bb4] [g4 f4]'],
        ['verse', 'c5 c5 bb4 [c5 f5] g4 f4 f4 _ _'],
        ['drop', 'f6 c6 f6 eb6 [c6 bb5] [g5 f5]'],
        ['hook', 'bb4 [bb4 c5 f5 c5] bb4 _ _'],
        ['hook', 'f4 f4 g4 bb4 g4 f4 _ _'],
        ['hook', 'bb4 [bb4 c5 f5 c5] bb4 _ _'],
        ['outro', 'f4 [g4 bb4 c5] [bb4 g4] f4 _ _ _']
      ]
    },
    {
      name: 'Paper Sun', sub: 'Claude Code · C side', step: .27, shift: -2, bright: 1.16,
      song: [
        ['verse', 'g4 g4 bb4 d5 [eb5 d5] [bb4 g4]'],
        ['verse', 'd5 d5 c5 [d5 g5] f5 d5 bb4 _ _'],
        ['drop', 'g5 d5 g6 f6 [d6 c6] [bb5 g5]'],
        ['hook', 'c5 [c5 eb5 g5 eb5] c5 _ _'],
        ['hook', 'g4 g4 bb4 c5 bb4 g4 _ _'],
        ['hook', 'c5 [c5 eb5 g5 eb5] c5 _ _'],
        ['outro', 'g4 [bb4 c5 d5] [eb5 d5] bb4 _ _ _']
      ]
    }
  ];
  var CH = [[0, 55, [0, 3, 7]], [8, 48, [0, 3, 7]], [16, 55, [0, 3, 7]], [18, 51, [0, 4, 7]], [22, 53, [0, 4, 7]], [26, 48, [0, 3, 7]], [30, 46, [0, 4, 7]], [34, 48, [0, 3, 7]], [38, 46, [0, 4, 7]], [42, 48, [0, 3, 7]], [46, 46, [0, 4, 7]], [50, 55, [0, 3, 7]], [58, 55, [0, 3, 7]]];

  var dataCache = [];
  function trackData(i) {
    if (dataCache[i]) return dataCache[i];
    var def = TRACKS[i], step = 0, notes = [], lines = [];
    def.song.forEach(function (row) {
      var w = row[1].split(' ').map(function (x) {
        var m = x.match(/^(\[?)([a-z]+)(\d?)(\]?)$/) || [], nn = m[2] || '_';
        var tok = { s: x, sp: true, t: step * def.step, e: (step + 1) * def.step, c: NCOL[nn] || '#888', mute: nn === '_' };
        if (nn !== '_') notes.push({ n: nn, oct: +m[3], t: step * def.step });
        step++;
        return tok;
      });
      lines.push({ lab: row[0], w: w });
    });
    dataCache[i] = { lines: lines, notes: notes, steps: step };
    return dataCache[i];
  }

  function renderTrack(i) {
    var def = TRACKS[i], data = trackData(i), SR = 22050, ST = def.step, steps = data.steps;
    var o = new OfflineAudioContext(2, Math.floor(SR * (steps * ST + 1.2)), SR);
    var mx = o.createGain(); mx.gain.value = .8;
    var cp = o.createDynamicsCompressor(); mx.connect(cp); cp.connect(o.destination);
    var dl = o.createDelay(1); dl.delayTime.value = .375;
    var fb = o.createGain(); fb.gain.value = .3;
    var lp = o.createBiquadFilter(); lp.frequency.value = 2200;
    dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(mx);
    var rv = o.createConvolver(), il = o.createBuffer(2, Math.floor(SR * 1.8), SR);
    for (var c = 0; c < 2; c++) {
      var d = il.getChannelData(c);
      for (var k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / d.length, 3);
    }
    rv.buffer = il;
    var rg = o.createGain(); rg.gain.value = .25; rv.connect(rg); rg.connect(mx);
    var nb = o.createBuffer(1, SR, SR), nd = nb.getChannelData(0);
    for (var n = 0; n < SR; n++) nd[n] = Math.random() * 2 - 1;
    var fr = function (name, oct) { return 440 * Math.pow(2, (12 * (oct + 1) + SEMI[name] - 69) / 12); };
    var env = function (g, t, a, v, r) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + a);
      g.gain.exponentialRampToValueAtTime(1e-4, t + a + r);
    };
    var osc = function (ty, f, t, dur, v, dst, det) {
      var x = o.createOscillator(), g = o.createGain();
      x.type = ty; x.frequency.value = f; x.detune.value = det || 0;
      env(g, t, .01, v, dur); x.connect(g); g.connect(dst); x.start(t); x.stop(t + dur + .05);
    };
    var noise = function (t, dur, v, ty, f) {
      var s = o.createBufferSource(), b = o.createBiquadFilter(), g = o.createGain();
      s.buffer = nb; b.type = ty; b.frequency.value = f;
      env(g, t, .002, v, dur); s.connect(b); b.connect(g); g.connect(mx);
      s.start(t, Math.random() * .5); s.stop(t + dur + .05);
    };
    var send = function (g) { g.connect(mx); g.connect(dl); g.connect(rv); };
    var lead = o.createGain(); lead.gain.value = .5;
    var lf = o.createBiquadFilter(); lf.frequency.value = 2600 * def.bright;
    lead.connect(lf); send(lf);
    data.notes.forEach(function (note) {
      var f = fr(note.n, note.oct), t = note.t;
      osc('triangle', f, t, .34, .5, lead);
      osc('sine', f * 1.5, t, .3, .4, lead, 3);
      osc('sawtooth', f * 2, t, .18, .06, lead, -6);
    });
    var pg = o.createGain(); pg.gain.value = .5;
    var pf = o.createBiquadFilter(); pf.frequency.value = 900;
    pg.connect(pf); send(pf);
    CH.forEach(function (ch, ci) {
      var t = ch[0] * ST, dur = ((CH[ci + 1] ? CH[ci + 1][0] : steps + 6) - ch[0]) * ST, root = ch[1] + def.shift;
      ch[2].forEach(function (iv) {
        var f = 440 * Math.pow(2, (root + 12 + iv - 69) / 12);
        osc('sawtooth', f, t, dur, .05, pg, -8);
        osc('sawtooth', f, t, dur, .05, pg, 8);
      });
      if (ch[0] >= 18 || ch[0] === 0) {
        for (var b = 0; b < dur; b += 1) osc('sine', 440 * Math.pow(2, (root - 69) / 12), t + b, .8, ch[0] >= 18 ? .5 : .25, mx);
      }
    });
    for (var s = 0; s < steps + 6; s++) {
      var ts = s * ST, dr = s >= 18 && s < 60;
      noise(ts, .04, dr ? .12 : .06, 'highpass', 7000);
      if (s % 2) noise(ts + .125, .03, .04, 'highpass', 9000);
      if (dr && (s % 8 === 0 || s % 8 === 6 || s === 18)) {
        var x = o.createOscillator(), g = o.createGain();
        x.frequency.setValueAtTime(130, ts);
        x.frequency.exponentialRampToValueAtTime(42, ts + .14);
        env(g, ts, .004, .9, .3); x.connect(g); g.connect(mx); x.start(ts); x.stop(ts + .4);
      }
      if (dr && s % 8 === 4) { noise(ts, .18, .22, 'bandpass', 1800); osc('triangle', 190, ts, .1, .2, mx); }
    }
    for (var i = 0; i < 14; i++) noise(Math.random() * steps * ST, .012, .07, 'highpass', 3000);
    return o.startRendering();
  }

  /* ---------- 内核 ---------- */
  function create(host, opts) {
    opts = opts || {};
    var P = opts.P || {};
    var ext = opts.external || null;
    var status = typeof opts.onStatus === 'function' ? opts.onStatus : function () {};

    var root = document.createElement('div');
    root.className = 'vd' + (opts.frame ? ' stg' : '');
    root.tabIndex = 0;
    root.innerHTML = '<div class="vd-fb" aria-hidden="true"><i></i><img alt=""></div>'
      + '<canvas class="vd-gl"></canvas><canvas class="vd-ov"></canvas>'
      + '<div class="vd-st"></div><div class="vd-L"></div>'
      + '<div class="vd-tt"><b>Soft Static</b><small><i>✺</i> <span>Claude Code</span></small></div>'
      + '<div class="vd-ct">'
      + '<button class="vd-btn vd-prev" type="button" aria-label="上一首（长按后退 3 秒）">' + SVG_PREV + '</button>'
      + '<button class="vd-btn vd-pp" type="button" aria-label="播放" aria-pressed="false">' + SVG_PLAY + '</button>'
      + '<button class="vd-btn vd-next" type="button" aria-label="下一首（长按前进 3 秒）">' + SVG_NEXT + '</button>'
      + '</div>'
      + '<div class="vd-tm"><b>0:00</b> / 0:00</div>'
      + '<div class="vd-hint">拖唱片转盘 · 拖唱臂跳转 · 滚轮微调</div>';
    host.appendChild(root);

    var q = function (s) { return root.querySelector(s); };
    var Lx = q('.vd-L'), glc = q('.vd-gl'), ov = q('.vd-ov'), stageEl = q('.vd-st');
    var ttName = q('.vd-tt b'), ttSub = q('.vd-tt small span');
    var ppBtn = q('.vd-pp'), prevBtn = q('.vd-prev'), nextBtn = q('.vd-next');
    var tmEl = q('.vd-tm'), hintEl = q('.vd-hint');
    var fb = q('.vd-fb'), fbDisc = q('.vd-fb i'), fbImg = q('.vd-fb img');
    var o2 = ov.getContext('2d');
    var ctrl = new AbortController();
    var on = function (el, ev, fn, op) { el.addEventListener(ev, fn, Object.assign({}, op, { signal: ctrl.signal })); };

    var W = 2, H = 2, dpr = 1, C = { x: 0, y: 0 }, R = 1, fs = 16, x0 = 0, cy = 0, port = false, phi = 12;
    var toks = [], lines = [], noSync = false, en = 0, ea = 0, lf = 0;
    var drag = null, overrideTime = null, trackKey = '', lastLyrics = null, coverUrl = '', uiPlaying = null, lastTm = 0;
    var raf = 0, disposed = false, hintTimer = 0, ro = null;
    var A0 = -51 * Math.PI / 180, A1 = -A0;

    /* ---------- 封面标签 ---------- */
    var lc = document.createElement('canvas'); lc.width = lc.height = 512;
    var gl = null, tex = null, pr = null;

    function gradientLabel(title, sub) {
      var g = lc.getContext('2d'), qq = 256;
      var gr = g.createLinearGradient(0, 0, 512, 512);
      gr.addColorStop(0, '#9aa6ff'); gr.addColorStop(.45, '#ff9fd0'); gr.addColorStop(1, '#ffc79a');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      g.textAlign = 'center'; g.fillStyle = '#4a1633';
      var f = 46;
      do { g.font = '700 ' + f + 'px Inter,system-ui,sans-serif'; f -= 2; } while (g.measureText(title || 'Soft Static').width > 400 && f > 16);
      g.fillText(title || 'Soft Static', qq, qq - 10);
      g.font = '500 20px system-ui';
      g.fillText(sub || '33⅓ rpm', qq, qq + 34);
      g.fillStyle = '#0a0909'; g.beginPath(); g.arc(qq, qq, 9, 0, 7); g.fill();
    }

    function uploadLabel() {
      if (gl && tex) {
        try {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
        } catch (e) { /* 跨域封面会污染纹理，退回渐变标签 */ }
      }
      if (fbImg) { try { fbImg.src = lc.toDataURL('image/png'); } catch (e) { } }
    }

    function setLabel(img, title, sub) {
      var g = lc.getContext('2d');
      if (img) {
        try { g.drawImage(img, 0, 0, 512, 512); } catch (e) { img = null; }
      }
      if (!img) { g.clearRect(0, 0, 512, 512); gradientLabel(title, sub); uploadLabel(); return; }
      if (gl && tex) {
        try {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
        } catch (e) {
          g.clearRect(0, 0, 512, 512); gradientLabel(title, sub); uploadLabel();
        }
      }
      if (fbImg) { try { fbImg.src = lc.toDataURL('image/png'); } catch (e) { } }
    }

    /* ---------- WebGL ---------- */
    try { gl = glc.getContext('webgl', { premultipliedAlpha: true, alpha: true }); } catch (e) { gl = null; }
    if (gl) {
      try {
        var mk = function (type, src) {
          var sh = gl.createShader(type);
          gl.shaderSource(sh, src); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
          return sh;
        };
        pr = gl.createProgram();
        gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS));
        gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FSRC));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
        gl.useProgram(pr);
        var vb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var ap = gl.getAttribLocation(pr, 'p');
        gl.enableVertexAttribArray(ap);
        gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gradientLabel('Soft Static', 'Claude Code');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } catch (e) { gl = null; pr = null; tex = null; }
    }
    if (!gl) {
      root.classList.add('vd-nogl');
      gradientLabel('Soft Static', 'Claude Code');
      uploadLabel();
    }
    var uniform = function (name) { return gl && pr ? gl.getUniformLocation(pr, name) : null; };

    /* ---------- 布局 ---------- */
    function layout() {
      var rect = root.getBoundingClientRect();
      W = Math.max(2, Math.round(rect.width));
      H = Math.max(2, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (root.classList.contains('vd-nogl')) dpr = Math.min(1.5, dpr);
      port = W < H * .9;
      root.classList.toggle('p', port);
      root.classList.toggle('compact', H < 470 || W < 520);
      glc.width = Math.round(W * dpr); glc.height = Math.round(H * dpr);
      ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr);
      if (port) {
        R = Math.min(.4 * W, .22 * H); C = { x: W / 2, y: H * .3 };
        fs = W * .047; x0 = W * .06; cy = H * .72; phi = 9;
      } else {
        R = .47 * H; C = { x: 0, y: H / 2 }; x0 = C.x + R * 1.43;
        fs = Math.min(.044 * H, (W - x0 - W * .04) / 18.8); cy = H / 2; phi = 12;
      }
      fs *= clamp(+P.FONT || 1, .7, 1.6);
      Lx.style.setProperty('--fs', fs + 'px');
      if (gl) gl.viewport(0, 0, glc.width, glc.height);
      if (fb) {
        fb.style.left = (C.x - R) + 'px'; fb.style.top = (C.y - R) + 'px';
        fb.style.width = (R * 2) + 'px'; fb.style.height = (R * 2) + 'px';
      }
      fit();
    }

    function fit() {
      if (!lines.length) return;
      var av = Math.max(40, W - x0 - W * .04), mw = 0;
      lines.forEach(function (l) { mw = Math.max(mw, l.el.offsetWidth); });
      if (mw > av) { fs *= av / mw; Lx.style.setProperty('--fs', fs + 'px'); }
      toks.forEach(function (t) {
        t.cx = (t.el.offsetLeft + t.el.offsetWidth / 2) / fs;
        t.ty = t.el.offsetTop / fs;
      });
    }

    /* ---------- 歌词行 ---------- */
    var dot = document.createElement('i');
    dot.className = 'vd-dot';

    function buildLines(ls) {
      Lx.innerHTML = ''; toks = []; lines = []; noSync = false;
      lf = 0;
      ls.forEach(function (l, li) {
        var d = document.createElement('div');
        d.className = 'ln';
        d.innerHTML = '<b>' + (l.lab != null ? l.lab : String(li + 1).padStart(2, '0')) + '</b>';
        l.w.forEach(function (w) {
          var sp = document.createElement('span'), c = w.c || COLS[toks.length % 6];
          sp.className = 'n';
          sp.dataset.s = toks.length;
          sp.textContent = w.s;
          sp.style.setProperty('--c', c);
          toks.push({ el: sp, t: w.t, e: w.e, line: li, c: c, mute: w.mute });
          d.append(sp);
          if (w.sp) d.append(' ');
        });
        Lx.append(d);
        lines.push({ el: d });
      });
      dot.style.display = '';
      layout();
    }

    function buildFallback(track) {
      var a = split(track && track.name ? track.name : 'Soft Static');
      var b = split(track && track.artist ? track.artist : '');
      var ls = [];
      if (a.length) ls.push({ lab: '', w: a.map(function (x, i) { return { s: x.s, sp: x.sp, t: 0, e: 0, c: COLS[i % 6] }; }) });
      if (b.length) ls.push({ lab: '', w: b.map(function (x, i) { return { s: x.s, sp: x.sp, t: 0, e: 0, c: COLS[(i + 2) % 6] }; }) });
      if (!ls.length) ls.push({ lab: '', w: [{ s: 'Soft Static', sp: false, t: 0, e: 0, c: COLS[0] }] });
      buildLines(ls);
      noSync = true;
      dot.style.display = 'none';
    }

    /* ---------- 内置播放引擎（demo 模式） ---------- */
    var ac = null, gn = null, an = null, wf = new Uint8Array(512);
    var idx = 0, buf = null, rbuf = null, pos = 0, playing = false, node = null, t0 = 0, p0 = 0, sc = null;
    var DUR = trackData(0).steps * TRACKS[0].step, BD = DUR + 1.2;
    var buffers = [], renderJobs = [];

    function ensureAC() {
      if (ac) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      gn = ac.createGain(); an = ac.createAnalyser(); an.fftSize = 512;
      gn.connect(an); an.connect(ac.destination);
    }
    function stopSrc() {
      if (node) { try { node.stop(); } catch (e) { } node = null; }
      if (sc) { try { sc.s.stop(); } catch (e) { } sc = null; }
    }
    function startSrc() {
      if (!ac || !buf) return;
      stopSrc();
      node = ac.createBufferSource();
      node.buffer = buf;
      node.connect(gn);
      gn.gain.setTargetAtTime(1, ac.currentTime, .01);
      node.start(0, Math.min(pos, Math.max(0, BD - .01)));
      t0 = ac.currentTime; p0 = pos;
    }
    function curTime() { return playing && node && ac ? Math.min(DUR, p0 + ac.currentTime - t0) : pos; }
    function setBuf(b) {
      buf = b; BD = b.duration || BD;
      rbuf = ac.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (var c = 0; c < b.numberOfChannels; c++) rbuf.getChannelData(c).set(b.getChannelData(c).slice().reverse());
    }
    function ensureRendered(i) {
      if (buffers[i]) return Promise.resolve(buffers[i]);
      if (renderJobs[i]) return renderJobs[i];
      renderJobs[i] = renderTrack(i).then(function (b) {
        buffers[i] = b; renderJobs[i] = null; return b;
      }, function (err) {
        renderJobs[i] = null; throw err;
      });
      return renderJobs[i];
    }
    function play() {
      ensureAC();
      if (!ac) return Promise.resolve();
      var resume = ac.state !== 'running' ? ac.resume().catch(function () { }) : Promise.resolve();
      return resume.then(function () {
        if (!buf) {
          status('合成中…');
          var target = idx;
          return ensureRendered(target).then(function (b) {
            if (idx !== target) return;
            if (b && !buf) { setBuf(b); DUR = trackData(target).steps * TRACKS[target].step; }
            status('');
            if (buf) {
              if (pos >= DUR - .05) pos = 0;
              playing = true; startSrc();
            }
          }).catch(function () { status('音频不可用'); });
        }
        if (pos >= DUR - .05) pos = 0;
        playing = true; startSrc();
      });
    }
    function pause() { if (playing) { pos = curTime(); playing = false; stopSrc(); } }
    function seekTo(t) {
      pos = clamp(t, 0, DUR);
      if (playing) startSrc();
    }
    function nudge(d) { seekTo(curTime() + d); }
    function go(i) {
      var was = playing;
      stopSrc(); playing = false;
      idx = mod(i, TRACKS.length); pos = 0; buf = null; rbuf = null;
      DUR = trackData(idx).steps * TRACKS[idx].step; BD = DUR + 1.2;
      if (was) play();
    }
    function scrub(v) {
      if (!buf || !ac) return;
      var a = Math.min(4, Math.abs(v)), dir = v < 0 ? -1 : 1, now = ac.currentTime;
      if (a < .04) { gn.gain.setTargetAtTime(0, now, .02); return; }
      if (sc && sc.d === dir && Math.abs(sc.at(now) - pos) < .25) {
        sc.p = sc.at(now); sc.t = now;
        try { sc.s.playbackRate.setTargetAtTime(a, now, .02); } catch (e) { }
      } else {
        stopSrc();
        var s = ac.createBufferSource();
        s.buffer = dir > 0 ? buf : rbuf;
        s.playbackRate.value = a;
        s.connect(gn);
        s.start(0, dir > 0 ? pos : Math.max(0, BD - pos - .02));
        sc = { s: s, d: dir, t: now, p: pos, at: function (n) { return sc.p + dir * a * (n - sc.t); } };
      }
      gn.gain.setTargetAtTime(Math.min(1, .4 + a * .5), now, .02);
    }
    function energyDemo() {
      if (!an) return 0;
      an.getByteTimeDomainData(wf);
      var s = 0;
      for (var i = 0; i < 512; i++) { var v = (wf[i] - 128) / 128; s += v * v; }
      return Math.sqrt(s / 512);
    }
    function loadFile(ab) {
      ensureAC();
      if (!ac) return Promise.resolve();
      return ac.decodeAudioData(ab).then(function (b) {
        stopSrc(); playing = false;
        buf = b; BD = b.duration; DUR = b.duration; pos = 0;
        rbuf = ac.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
        for (var c = 0; c < b.numberOfChannels; c++) rbuf.getChannelData(c).set(b.getChannelData(c).slice().reverse());
        status('');
      }).catch(function () { status('这个音频读不了'); });
    }

    var T = ext ? {
      time: function () { return overrideTime != null ? overrideTime : (ext.getTime() || 0); },
      duration: function () { return ext.getDuration() || 0; },
      playing: function () { return !!ext.isPlaying(); },
      play: function () { if (ext.play) ext.play(); },
      pause: function () { if (ext.pause) ext.pause(); },
      toggle: function () { if (ext.isPlaying()) { if (ext.pause) ext.pause(); } else if (ext.play) ext.play(); },
      next: function () { if (ext.next) ext.next(); },
      prev: function () { if (ext.prev) ext.prev(); },
      seek: function (t) { if (ext.seek) ext.seek(t); },
      nudge: function (d) { if (ext.seek) ext.seek((ext.getTime() || 0) + d); },
      track: function () { return ext.getTrack() || { name: 'Folia', artist: '', cover: '' }; },
      lyrics: function () { return ext.getLyrics ? ext.getLyrics() : null; },
      energy: function () {
        if (!ext.isPlaying()) return 0;
        var t = ext.getTime() || 0;
        return clamp(.42 + .22 * Math.sin(t * 2.05) + .14 * Math.sin(t * 5.13 + 1.3) + .08 * Math.sin(t * 11.7), 0, 1);
      },
      scratch: false
    } : {
      time: function () { return overrideTime != null ? overrideTime : curTime(); },
      duration: function () { return DUR; },
      playing: function () { return playing; },
      play: play,
      pause: pause,
      toggle: function () { if (playing) pause(); else play(); },
      next: function () { go(idx + 1); },
      prev: function () { go(idx - 1); },
      seek: seekTo,
      nudge: nudge,
      track: function () { var d = TRACKS[idx]; return { name: d.name, artist: d.sub, cover: '' }; },
      lyrics: function () { return trackData(idx).lines; },
      energy: energyDemo,
      scratch: true
    };

    /* ---------- 封面 ---------- */
    function applyCover(track) {
      var url = track.cover || '';
      coverUrl = url;
      if (!url) { setLabel(null, track.name || 'Soft Static', track.artist); return; }
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { if (coverUrl === url) setLabel(im, track.name, track.artist); };
      im.onerror = function () { if (coverUrl === url) setLabel(null, track.name, track.artist); };
      im.src = url;
    }

    /* ---------- 唱臂几何 ---------- */
    function armHead(p) {
      var rh = R * (1 - .6 * p);
      var Pv = { x: C.x + .61 * R, y: C.y - 1.06 * R };
      var L = 1.22 * R, dx = Pv.x - C.x, dy = Pv.y - C.y;
      var dd = Math.hypot(dx, dy);
      var aa = (rh * rh - L * L + dd * dd) / (2 * dd);
      var hh = Math.sqrt(Math.max(0, rh * rh - aa * aa));
      var mx = C.x + aa * dx / dd, my = C.y + aa * dy / dd;
      var s1 = { x: mx + hh * dy / dd, y: my - hh * dx / dd };
      var s2 = { x: mx - hh * dy / dd, y: my + hh * dx / dd };
      return { P: Pv, H: s1.y > s2.y ? s1 : s2, L: L };
    }

    function drawOv(p) {
      var g = o2;
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      for (var i = 0; i <= 80; i++) {
        var f = i / 80;
        var a = A0 * 1.18 + (A1 * 1.18 - A0 * 1.18) * f;
        var big = Math.pow(Math.cos(a * .95), 2);
        var len = R * (.025 + .1 * big * (i % 4 ? .55 : 1));
        var r0 = R * 1.1;
        var lit = a < A0 + (A1 - A0) * p;
        g.strokeStyle = lit
          ? 'rgba(236,' + ((90 + 60 * big) | 0) + ',' + ((70 + 30 * big) | 0) + ',' + (.45 + .5 * big) + ')'
          : 'rgba(255,255,255,' + (.08 + .12 * big) + ')';
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(C.x + Math.cos(a) * r0, C.y + Math.sin(a) * r0);
        g.lineTo(C.x + Math.cos(a) * (r0 + len), C.y + Math.sin(a) * (r0 + len));
        g.stroke();
      }
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1;
      g.beginPath(); g.arc(C.x, C.y, R * 1.06, A0, A1); g.stroke();
      var ap = A0 + (A1 - A0) * p;
      g.strokeStyle = '#e2503c'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(C.x, C.y, R * 1.06, A0, ap); g.stroke();
      var mx = C.x + Math.cos(ap) * R * 1.06, my = C.y + Math.sin(ap) * R * 1.06;
      g.fillStyle = '#0a0909'; g.beginPath(); g.arc(mx, my, 5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#e2503c'; g.beginPath(); g.arc(mx, my, 1.8, 0, 7); g.fill();

      var arm = armHead(p), pv = arm.P, hd = arm.H, L = arm.L;
      var ang = Math.atan2(hd.y - pv.y, hd.x - pv.x), w = R * .034;
      g.save();
      g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = R * .05; g.shadowOffsetX = R * .03; g.shadowOffsetY = R * .04;
      g.translate(pv.x, pv.y); g.rotate(ang);
      var lg = g.createLinearGradient(0, -w, 0, w);
      [[0, '#555'], [.3, '#f4f4f4'], [.55, '#9a9a9a'], [1, '#3a3a3a']].forEach(function (s) { lg.addColorStop(s[0], s[1]); });
      g.fillStyle = lg; g.fillRect(0, -w, L * .97, w * 2);
      g.save();
      g.translate(L * .97, 0); g.rotate(.2);
      g.fillStyle = '#0f0f10';
      g.beginPath();
      if (g.roundRect) g.roundRect(-R * .02, -R * .05, R * .17, R * .1, R * .012);
      else g.rect(-R * .02, -R * .05, R * .17, R * .1);
      g.fill();
      g.fillStyle = '#c9c9c9';
      [-1, 1].forEach(function (s) { g.beginPath(); g.arc(R * .045, s * R * .03, R * .011, 0, 7); g.fill(); });
      g.fillStyle = '#e8863a'; g.fillRect(R * .13, -R * .012, R * .025, R * .024);
      g.strokeStyle = '#bbb'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(R * .06, R * .05); g.lineTo(R * .16, R * .1); g.stroke();
      g.restore(); g.restore();

      g.save();
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = R * .05; g.shadowOffsetY = R * .03;
      var bg = g.createRadialGradient(pv.x - R * .04, pv.y - R * .04, R * .01, pv.x, pv.y, R * .15);
      bg.addColorStop(0, '#f6f6f6'); bg.addColorStop(.6, '#9b9b9b'); bg.addColorStop(1, '#3d3d3d');
      g.fillStyle = bg; g.beginPath(); g.arc(pv.x, pv.y, R * .15, 0, 7); g.fill();
      g.restore();
      g.fillStyle = '#6a6a6a'; g.beginPath(); g.arc(pv.x, pv.y, R * .095, 0, 7); g.fill();
      g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(pv.x, pv.y, R * .06, 0, 7); g.fill();
    }

    /* ---------- 传输 UI ---------- */
    function syncPlayBtn(nowPlaying) {
      ppBtn.setAttribute('aria-pressed', nowPlaying ? 'true' : 'false');
      ppBtn.setAttribute('aria-label', nowPlaying ? '暂停' : '播放');
      ppBtn.innerHTML = nowPlaying ? SVG_PAUSE : SVG_PLAY;
      root.classList.toggle('paused', !nowPlaying);
    }
    function fmt(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }

    function hold(btn, tap, held) {
      var timer = 0, fired = false;
      on(btn, 'pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;
        fired = false;
        timer = setTimeout(function () { fired = true; held(); }, 450);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { on(btn, ev, function () { clearTimeout(timer); }); });
      on(btn, 'click', function (e) {
        if (fired) { fired = false; e.preventDefault(); e.stopPropagation(); return; }
        tap();
      });
      on(btn, 'contextmenu', function (e) { e.preventDefault(); });
    }
    hold(prevBtn, function () { T.prev(); }, function () { T.nudge(-3); });
    hold(nextBtn, function () { T.next(); }, function () { T.nudge(3); });
    on(ppBtn, 'click', function () { T.toggle(); });

    on(root, 'keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); T.toggle(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); T.nudge(-3); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); T.nudge(3); }
    });

    /* ---------- 指针：搓碟 / 拖唱臂 / 点击播放 ---------- */
    function localPoint(e) {
      var rect = root.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect: rect };
    }
    function posFromAngle(a) {
      return clamp((a - A0) / (A1 - A0), 0, 1) * Math.max(.001, T.duration());
    }
    on(stageEl, 'pointerdown', function (e) {
      var pt = localPoint(e), dx = pt.x - C.x, dy = pt.y - C.y, rr = Math.hypot(dx, dy) / R;
      var head = armHead(T.time() / Math.max(.001, T.duration())).H;
      var nearHead = Math.hypot(pt.x - head.x, pt.y - head.y) < R * .14;
      var a0 = Math.atan2(dy, dx);
      if (!(rr < 1 || nearHead || (rr > 1.02 && rr < 1.3 && Math.abs(a0) < 1.1))) return;
      if (!ext) { ensureAC(); if (ac && ac.state !== 'running') { ac.resume().catch(function () { }); } }
      try { stageEl.setPointerCapture(e.pointerId); } catch (err) { }
      drag = {
        mode: (nearHead || rr > 1.02) ? 'seek' : (T.scratch ? 'rec' : 'recSeek'),
        a: a0, sx: pt.x, sy: pt.y, moved: 0, was: T.playing(), last: performance.now(),
        np: T.time(), v: 0, seekAt: 0
      };
      if (!ext && T.playing()) T.pause();
      root.classList.add('g');
    });
    on(window, 'pointermove', function (e) {
      if (!drag) return;
      var pt = localPoint(e);
      var a = Math.atan2(pt.y - C.y, pt.x - C.x);
      var now = performance.now(), dt = Math.max(8, now - drag.last) / 1000;
      drag.moved = Math.max(drag.moved, Math.abs(pt.x - drag.sx) + Math.abs(pt.y - drag.sy));
      var dur = Math.max(.001, T.duration());
      var da = a - drag.a;
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      var sens = clamp(+P.SCR || 1, .2, 3);
      var np = drag.mode === 'seek'
        ? posFromAngle(a)
        : clamp(drag.np + da / (Math.PI * 2) * REV * sens, 0, dur);
      var v = (np - drag.np) / dt;
      drag.v += (v - drag.v) * .5;
      if (drag.mode === 'seek') {
        if (ext) {
          overrideTime = np;
          if (now - drag.seekAt > 70) { drag.seekAt = now; T.seek(np); }
        } else pos = np;
      } else if (drag.mode === 'rec') {
        pos = np; scrub(drag.v);
      } else {
        overrideTime = np;
        if (now - drag.seekAt > 90) { drag.seekAt = now; T.seek(np); }
      }
      drag.np = np; drag.a = a; drag.last = now;
    }, { passive: true });
    function endDrag() {
      if (!drag) return;
      var d = drag; drag = null;
      root.classList.remove('g');
      if (sc) { try { sc.s.stop(); } catch (e) { } sc = null; }
      if (gn && ac) gn.gain.setTargetAtTime(1, ac.currentTime, .02);
      if (d.mode !== 'seek' && d.moved < 5) d.was = !d.was;
      if (ext) {
        overrideTime = null;
        T.seek(d.np);
        if (d.was) T.play(); else T.pause();
      } else {
        if (d.was) play(); else pause();
      }
    }
    on(window, 'pointerup', endDrag);
    on(window, 'pointercancel', endDrag);

    on(Lx, 'click', function (e) {
      var n = e.target.closest ? e.target.closest('.n') : null;
      if (!n || n.dataset.s == null) return;
      var tok = toks[+n.dataset.s];
      if (!tok) return;
      T.seek((tok.t || 0) + .001);
      if (!T.playing()) T.play();
    });

    var wheelStop = 0;
    on(root, 'wheel', function (e) {
      var pt = localPoint(e);
      var rr = Math.hypot(pt.x - C.x, pt.y - C.y) / R;
      if (rr > 1.35) return;
      e.preventDefault();
      var step = (e.deltaY || 0) * (e.deltaMode === 1 ? 16 : 1) * .004 * clamp(+P.SCR || 1, .2, 3);
      T.seek(clamp(T.time() + step, 0, Math.max(.001, T.duration())));
      clearTimeout(wheelStop);
      wheelStop = setTimeout(function () { if (hintEl) hintEl.classList.add('gone'); }, 900);
    }, { passive: false });

    /* ---------- 拖入本地音频 / 歌词（仅 demo 模式） ---------- */
    if (!ext) {
      on(root, 'dragover', function (e) { e.preventDefault(); });
      on(root, 'drop', function (e) {
        e.preventDefault();
        var files = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : [];
        Array.prototype.forEach.call(files, function (f) {
          if (/\.(lrc|txt)$/i.test(f.name)) {
            f.text().then(function (txt) {
              var ls = parseLrc(txt);
              if (ls.length) { lastLyrics = ls; buildLines(ls); }
            }).catch(function () { });
          } else if (/^audio\//.test(f.type) || /\.(mp3|wav|m4a|ogg|flac|aac|opus)$/i.test(f.name)) {
            f.arrayBuffer().then(loadFile).catch(function () { status('这个音频读不了'); });
          }
        });
      });
    }

    /* ---------- 帧循环 ---------- */
    var lastUiTick = 0;
    function frame(now) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      var dur = Math.max(.001, T.duration() || 1);
      var t = clamp(T.time(), 0, dur);
      var nowPlaying = T.playing();

      var tr = T.track();
      var key = String(tr.name || '') + '\u0001' + String(tr.artist || '');
      if (key !== trackKey) {
        trackKey = key;
        ttName.textContent = tr.name || 'Soft Static';
        ttSub.textContent = tr.artist || '';
        applyCover(tr);
        var ly = T.lyrics();
        lastLyrics = ly;
        if (ly && ly.length) buildLines(ly); else buildFallback(tr);
      } else {
        var ly2 = T.lyrics();
        if (ly2 !== lastLyrics) {
          lastLyrics = ly2;
          if (ly2 && ly2.length) buildLines(ly2); else if (!ly2) buildFallback(tr);
        }
      }

      if (nowPlaying !== uiPlaying) { uiPlaying = nowPlaying; syncPlayBtn(nowPlaying); }

      if (now - lastUiTick > 150) {
        lastUiTick = now;
        tmEl.innerHTML = '<b>' + fmt(t) + '</b> / ' + fmt(Math.round(dur));
      }

      if (gl) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniform('res'), glc.width, glc.height);
        gl.uniform2f(uniform('c'), C.x * dpr, C.y * dpr);
        gl.uniform1f(uniform('r'), R * dpr);
        gl.uniform1f(uniform('rot'), t / clamp(+P.SPIN || REV, .6, 4) * Math.PI * 2);
        gl.uniform1f(uniform('t'), now / 1000);
        var e0 = T.energy();
        en += (e0 - en) * .4;
        ea += (e0 - ea) * .015;
        gl.uniform1f(uniform('k'), Math.min(1, Math.max(0, (en - ea) * 5)));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (fbDisc) {
        fbDisc.style.setProperty('--rot', (t / clamp(+P.SPIN || REV, .6, 4) * 360) + 'deg');
      }

      drawOv(t / dur);

      var ci = 0;
      if (!noSync && toks.length) {
        var a = 0, b = toks.length - 1;
        while (a < b) {
          var m = (a + b + 1) >> 1;
          if (toks[m].t <= t) a = m; else b = m - 1;
        }
        ci = a;
      }
      var tk = toks[ci] || { line: 0, t: 0, e: 0, cx: 0, ty: 0, c: '#e8604c' };
      var li = tk.line || 0;
      lf += (li - lf) * .14;
      if (Math.abs(li - lf) < .002) lf = li;

      lines.forEach(function (l, i) {
        var dd = i - lf, ad = Math.abs(dd);
        var th = dd * phi * Math.PI / 180;
        var Rc = port ? H * .55 : fs * 3.9 / Math.sin(phi * Math.PI / 180);
        var y = Rc * Math.sin(th);
        var op = Math.pow(Math.max(0, 1 - ad * .42), 1.6);
        var tint = dd < 0 ? 1 : .8;
        l.el.style.opacity = String(op * (ad < .5 ? 1 : tint));
        l.el.style.filter = 'blur(' + Math.min(6, ad * 2.2) + 'px)';
        l.el.style.visibility = op < .02 ? 'hidden' : 'visible';
        l.el.style.transform = 'translate(' + (x0 + Rc * (1 - Math.cos(th)) * .4) + 'px,' + (cy + y - fs * .75) + 'px) rotate(' + (dd * phi) + 'deg) scale(' + (1 - .04 * Math.min(ad, 3)) + ')';
      });

      if (!noSync) {
        toks.forEach(function (tk2, i) {
          var el = tk2.el, age = t - tk2.t, isC = i === ci;
          var st = age < 0 ? 0 : (!isC && age > .9 ? 1 : 2);
          if (st < 2 && tk2.s === st) return;
          tk2.s = st;
          var bg = 'transparent', co = age >= 0 ? '#fff' : 'var(--dim)';
          if (age >= 0 && !tk2.mute) {
            var al = isC ? 1 : Math.max(0, 1 - age / .9);
            bg = tk2.c + (Math.round(al * (isC ? 120 : 90)).toString(16).padStart(2, '0'));
          }
          el.style.background = bg;
          el.style.color = co;
        });
        if (toks.length && lines[li]) {
          var nx = toks[ci + 1], pv = toks[ci - 1];
          var pl = pv && pv.line === li ? pv : null;
          var nl = nx && nx.line === li ? nx : null;
          var dr = Math.max(.1, (tk.e > tk.t ? tk.e : (nl ? nl.t : tk.t + .3)) - tk.t);
          var jj = Math.max(0, Math.min(1, (t - tk.t) / Math.min(.16, dr * .5)));
          var js = jj * jj * (3 - 2 * jj);
          var dx = (pl ? pl.cx + (tk.cx - pl.cx) * js : tk.cx) * fs;
          var dy = (tk.ty - .4 - Math.sin(Math.PI * jj) * .5 - en * .9) * fs;
          var paused = !nowPlaying;
          if (dot.parentNode !== lines[li].el) lines[li].el.append(dot);
          dot.style.setProperty('--c', tk.c);
          dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (paused ? 45 : 0) + 'deg) scale(' + (paused ? .85 : 1) + ')';
        }
      }
    }

    /* ---------- 启动 ---------- */
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { layout(); }); ro.observe(root); }
    on(window, 'resize', layout);
    layout();
    if (ext) {
      buildFallback(T.track());
    } else {
      buildLines(trackData(0).lines);
      setLabel(null, TRACKS[0].name, TRACKS[0].sub);
    }
    syncPlayBtn(T.playing());
    uiPlaying = T.playing();
    hintTimer = setTimeout(function () { if (hintEl) hintEl.classList.add('gone'); }, 7000);
    raf = requestAnimationFrame(frame);
if (!ext) {
      setTimeout(function () { if (!disposed) ensureRendered(0).catch(function () { }); }, 250);
    }
    
    return function destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(hintTimer);
      clearTimeout(wheelStop);
      ctrl.abort();
      if (ro) { try { ro.disconnect(); } catch (e) { } }
      try { stopSrc(); } catch (e) { }
      if (ac && ac.close) { try { ac.close(); } catch (e) { } }
      root.remove();
    };
  }

  window.VinylDeck = {
    create: create,
    parseLrc: parseLrc,
    parseYrc: parseYrc,
    split: split,
    css: CSS
  };

  window.__JERRY_REGISTER_TEMPLATE({
    id: 'vinylplayer', name: 'Soft Static', cat: 'Interaction', mat: '黑胶',
    spell: '拖唱片搓碟、拖唱臂跳转，歌词逐字亮起并沿透视阶梯滚动；上一首 / 播放 / 下一首三大键，长按上一/下一首可快退快进 3 秒。',
    core: '一个 Web Audio 合成引擎 + 一块 WebGL 黑胶 + 逐字歌词透视排版',
    tags: ['Audio', 'Player', 'WebGL', 'Lyrics', 'Vinyl'],
    credit: { n: 'Soft Static（Claude Code 生成的本地演示页）', own: 1 },
    notes: [
      '原来的 Soft Static 是一个整页 HTML：固定铺满视口、只放内置曲、上一首/下一首其实是快退/快进 3 秒。这里把它拆成可复用的容器内核：所有样式锁在 .vd 前缀下、所有坐标按容器尺寸重算，host 多大它就多大，所以既是画廊模板，也能被 Folia 全屏舞台直接调用。',
      '新增三首内置合成曲（Soft Static / Soft Return / Paper Sun），都用 OfflineAudioContext 现场渲染，没有外部音频文件，离线可听；播放/暂停/上一首/下一首/进度/搓碟/拖唱臂都是真的在操作音频。切歌会重建歌词、封面标签和时长。',
      '控制条按 44–56px 触控尺寸重做：上一首 / 播放暂停 / 下一首，长按上一首或下一首 = ±3 秒；播放键用实心强调色表示正在播放，并补了 aria-label、焦点环和空格/方向键快捷键。',
      '歌词支持网易云逐字 yrc 与逐行 lrc；没有歌词时退回歌名/歌手的排版。模板里不含原页面的 NetEase 调试面板（默认指向 localhost，线上没有意义），但保留了把 mp3 / lrc 拖进播放器的能力。',
      'Folia 里由 /assets/folia-vinyl.js 复用同一个内核：不新建音频，只镜像当前 <audio> 的时间、播放态、进度和切歌；因为音频是跨域直链，拿不到频谱，光晕脉冲用合成节拍近似。'
    ],
    knobs: [
      { k: 'SPIN', label: 'SPIN 唱片转一圈秒数', v: 1.8, min: .6, max: 4, step: .1 },
      { k: 'SCR', label: 'SCR 搓碟灵敏度', v: 1, min: .2, max: 3, step: .1 },
      { k: 'FONT', label: 'FONT 歌词字号倍数', v: 1, min: .7, max: 1.6, step: .05 }
    ],
    css: CSS,
    mount: function (h, ctx) {
      return create(h, {
        P: (ctx && ctx.P) || {},
        external: (ctx && ctx.external) || null,
        frame: true,
        onStatus: ctx && ctx.status
      });
    }
  });
})();
