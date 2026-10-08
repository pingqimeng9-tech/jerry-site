/* ─── 25 Ticket Player ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'ticketplayer',name:'Ticket Player',cat:'UI',mat:'票据',
spell:'滚动时右侧细条长成时钟胶囊；底部是网易云迷你播放条，点开展开成票据，拖着甩、往下撕票根就关掉。',core:'一个播放引擎（<audio> + 网易云外链）+ 两种外形：玻璃条 ↔ 打孔票据',tags:['UI','Audio','Scrollbar','Netease','Drag'],
credit:{n:'jerry-site / capsule-player.js（胶囊滚动条 + 网易云票据播放器）',u:'https://github.com/pingqimeng9-tech/jerry-site'},
notes:['这是 capsule-player.js 的完整移植：一个全站组件做两件事——胶囊滚动条和底部播放器。滚动条跟着原生滚动走（不锁滚动、不用 transform 劫持），拖胶囊就是 scrollTo。静止时是 5×64 的细条，滚动、悬停、拖动时长成 50×188 的黑色毛玻璃时钟，停下 REST 毫秒后收回；拖过之后会“钉住”，点别处才松开。','播放器有两种外形：底部 mini 玻璃条（唱片 + 跳动的波形 + 上一首/播放/下一首 + 底部细进度），点开后淡入成票据。票据两侧的半圆缺口不是图片，是 radial-gradient 抠出来的；中间的虚线是打孔线。mini 和票据都能拖，甩动时带旋转，松手用弹簧回正；把票根往下撕出去，票据收起。','网易云的接法：播放走官方外链 music.163.com/song/media/outer/url?id=…，一首放不了（VIP、下架）就自动跳下一首，全部失败才提示“暂不可播”；歌名、歌手、封面、时长走站内接口 /api/assist?do=music&ids=，返回 {songs:[{id,name,artists,pic,dt}]}。这个模板没有后端，所以歌名显示 Track + 歌曲 ID；把代码里 CFG.api 换成你自己的接口，歌名封面就出来了。','和原版的差别：GSAP 换成库里自带的 tween，不用再加载外部脚本；原版里 clamp 的参数顺序在拖拽和进度条处写反了（下限不生效），失败计数在 play 事件上清零会让“全部放不了”时无限轮询，这两处都改正了；跨页续播（localStorage）和避让本地编辑条是站内专用逻辑，没带。SIM 旋钮：断网或歌曲都放不了时，用计时器模拟播放，方便看界面；设为 0 就是原版行为。'],
knobs:[
{k:'REST',label:'REST 胶囊收回延迟 ms',v:700,min:0,max:2000,step:50},
{k:'MORPH',label:'MORPH 胶囊变形时长 s',v:.6,min:.2,max:1.4,step:.05},
{k:'VOL',label:'VOL 音量',v:.5,min:0,max:1,step:.05},
{k:'SIM',label:'SIM 放不了时模拟播放（0关 1开）',v:1,min:0,max:1,step:1}],
css:`.tp-cap{position:absolute;top:0;right:12px;width:5px;height:64px;border-radius:999px;background:rgba(255,255,255,.32);
-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);
box-shadow:inset 0 0 0 1px rgba(255,255,255,.45),0 8px 32px rgba(0,0,0,.18);overflow:hidden;
z-index:30;cursor:grab;touch-action:none;color:#fff;will-change:transform,width,height;display:none}
.tp-cap.grabbing{cursor:grabbing}
.tp-cap .jcap-panel{position:absolute;inset:0;opacity:0;visibility:hidden;filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}
.tp-cap .jcap-t{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:10px;letter-spacing:0;opacity:.9;line-height:1}
.tp-cap .jcap-pct{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:9px;letter-spacing:0;opacity:.55;line-height:1}
.tp-cap .jcap-note{width:22px;height:22px;display:grid;place-items:center;border:0;background:none;color:#ff4d00;cursor:pointer;opacity:0;pointer-events:none;padding:0}
.tp-cap.clock .jcap-note{opacity:1;pointer-events:auto}
.tp-cap .jcap-note .eq{display:none;gap:2px;align-items:flex-end;height:14px}
.tp-cap .jcap-note.playing .eq{display:flex}
.tp-cap .jcap-note.playing .ico{display:none}
.tp-cap .jcap-note .eq i{width:3px;height:100%;background:#ff4d00;border-radius:1px;transform-origin:bottom;animation:jm-eqb .6s ease-in-out infinite alternate}
.tp-cap .jcap-note .eq i:nth-child(2){animation-duration:.45s;animation-delay:-.2s}
.tp-cap .jcap-note .eq i:nth-child(3){animation-duration:.75s;animation-delay:-.4s}
@keyframes jm-eqb{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
/* ============ 票据播放器（作用域全部锁在 .tp-jm 内） ============ */
.tp-jm{position:absolute;left:50%;bottom:20px;z-index:40;width:0;height:0;
--ta:#7c3aed;--tag:rgba(124,58,237,.5);font-family:"Space Grotesk","Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tp-jm .jm-mini,.tp-jm .jm-full{position:absolute;bottom:0;left:0;transform-origin:50% 100%}
.tp-jm .glass{background:rgba(28,28,34,.55);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);
box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 12px 40px rgba(0,0,0,.35);color:#fff}
.tp-jm .jm-mini{width:min(360px,calc(var(--vw,800px) - 72px));height:56px;border-radius:16px;display:flex;align-items:center;gap:10px;padding:0 12px;cursor:grab}
.tp-jm .jm-mini .mc{width:38px;height:38px;flex:none;border-radius:50%;background:conic-gradient(from 200deg,#2b2b36,#7c3aed,#2b2b36) center/cover;border:2px solid rgba(255,255,255,.18);animation:jm-spin 18s linear infinite;animation-play-state:paused}
.tp-jm .jm-mini.playing .mc{animation-play-state:running}
.tp-jm .jm-mini .w{flex:1;height:30px;display:flex;align-items:center;gap:3px;min-width:0}
.tp-jm .jm-mini .w span{flex:1;border-radius:2px;background:var(--ta);box-shadow:0 0 8px var(--tag);transform:scaleY(.2);height:100%;animation:jm-wv var(--t) ease-in-out var(--d) infinite alternate;animation-play-state:paused}
.tp-jm .jm-mini.playing .w span{animation-play-state:running}
@keyframes jm-wv{from{transform:scaleY(var(--lo,.2))}to{transform:scaleY(var(--hi,1))}}
.tp-jm .jm-mini .mbar{position:absolute;left:14px;right:14px;bottom:3px;height:2px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;pointer-events:none}
.tp-jm .jm-mini .mbar b{display:block;height:100%;width:0;background:var(--ta)}
.tp-jm .mt-btn{background:none;border:none;color:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.85;transition:.2s;padding:.2em}
.tp-jm .mt-btn:hover{opacity:1;transform:scale(1.08)}
.tp-jm .mt-btn svg{width:18px;height:18px}
.tp-jm .jm-mini .mt-btn.play{width:34px;height:34px;border-radius:50%;background:var(--ta);box-shadow:0 0 15px var(--tag)}
.tp-jm .jm-mini .mt-btn.play svg{width:16px;height:16px}
.tp-jm .jm-full{width:240px;padding:10px;border-radius:20px;touch-action:none;cursor:grab}
.tp-jm .jm-hd{cursor:pointer;padding:2px 4px 8px;display:flex;align-items:center;justify-content:space-between;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;gap:6px}
.tp-jm .jm-hd .d{display:flex;gap:4px}
.tp-jm .jm-hd .d i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35)}
.tp-jm .jm-hd .d i:first-child{background:#ff4d00}
.tp-jm .jm-hd .st{white-space:nowrap}
.tp-jm .ticket-canvas{display:flex;align-items:center;justify-content:center;min-height:0}
.tp-jm .ticket-wrapper{--t-bg:#1e1e24;--t-bg-light:#2b2b36;--t-text-main:#f8fafc;--t-text-muted:#94a3b8;font-size:10px;perspective:1000px;display:block;width:100%}
.tp-jm .ticket{position:relative;width:100%;color:var(--t-text-main);transform-style:preserve-3d;border-radius:1em;
box-shadow:0 20px 40px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.05);background:transparent;filter:drop-shadow(0 0 10px rgba(0,0,0,.4))}
.tp-jm .t-main{padding:1.6em;position:relative;overflow:hidden;background:radial-gradient(circle at bottom left,transparent 1em,var(--t-bg) 1.05em),radial-gradient(circle at bottom right,transparent 1em,var(--t-bg) 1.05em);background-size:51% 100%;background-position:bottom left,bottom right;background-repeat:no-repeat;border-top-left-radius:1em;border-top-right-radius:1em}
.tp-jm .t-main::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.15) 1px,transparent 1px);background-size:2em 2em;opacity:.5;z-index:0;pointer-events:none;transform:perspective(500px) rotateX(20deg) scale(1.5);animation:jm-grid 20s linear infinite;animation-play-state:paused}
.tp-jm .jm-full.playing .t-main::after{animation-play-state:running}
@keyframes jm-grid{from{background-position:0 0}to{background-position:0 4em}}
.tp-jm .t-content{position:relative;z-index:1}
.tp-jm .t-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.4em;gap:8px}
.tp-jm .t-logo{display:flex;align-items:center;gap:.4em;font-weight:900;font-size:1.15em;letter-spacing:-.04em;color:#fff}
.tp-jm .t-logo svg{width:1.4em;height:1.4em;fill:var(--ta);filter:drop-shadow(0 0 5px var(--ta));animation:jm-logo 3s ease-in-out infinite alternate;animation-play-state:paused}
.tp-jm .jm-full.playing .t-logo svg{animation-play-state:running}
@keyframes jm-logo{from{filter:drop-shadow(0 0 2px var(--ta))}to{filter:drop-shadow(0 0 10px var(--ta)) brightness(1.2)}}
.tp-jm .t-type{font-size:.6em;text-transform:uppercase;letter-spacing:.16em;color:var(--ta);border:1px solid var(--ta);padding:.4em .7em;border-radius:99em;font-weight:700;white-space:nowrap}
.tp-jm .t-title{font-size:2.1em;font-weight:900;line-height:1.1;margin-bottom:.2em;text-transform:uppercase;background:linear-gradient(135deg,#fff 0%,#a5b4fc 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-jm .t-subtitle{color:var(--t-text-muted);font-size:.9em;margin-bottom:1.6em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-jm .t-details{display:grid;grid-template-columns:1fr 1fr;gap:1.2em;margin-bottom:.6em}
.tp-jm .t-detail-item{display:flex;flex-direction:column;gap:.2em}
.tp-jm .t-label{font-size:.6em;text-transform:uppercase;letter-spacing:.1em;color:var(--t-text-muted)}
.tp-jm .t-value{font-size:1.05em;font-weight:700;color:var(--t-text-main)}
.tp-jm .mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:0}
.tp-jm .t-wide{grid-column:1/-1}
.tp-jm .mt-wave{display:flex;align-items:center;gap:2px;height:2em;padding:0 2px;margin-bottom:.7em;cursor:pointer}
.tp-jm .mt-wave span{flex:1 1 auto;min-width:1.5px;border-radius:1px;background:rgba(255,255,255,.18);transform-origin:center;animation:jm-wv var(--t,.5s) ease-in-out var(--d,0s) infinite alternate;animation-play-state:paused}
.tp-jm .mt-wave span.past{background:var(--ta)}
.tp-jm .jm-full.playing .mt-wave span{animation-play-state:running}
.tp-jm .mt-progress{height:4px;border-radius:4px;background:rgba(255,255,255,.12);cursor:pointer;overflow:hidden}
.tp-jm .mt-progress-fill{height:100%;width:0;background:linear-gradient(90deg,var(--ta),var(--tag));border-radius:4px}
.tp-jm .t-perforation{display:flex;justify-content:space-between;height:1em;align-items:center;position:relative;z-index:2}
.tp-jm .t-perf-line{flex-grow:1;border-top:2px dashed rgba(255,255,255,.2);margin:0 1.2em}
.tp-jm .t-stub{padding:1.4em;background:radial-gradient(circle at top left,transparent 1em,var(--t-bg-light) 1.05em),radial-gradient(circle at top right,transparent 1em,var(--t-bg-light) 1.05em);background-size:51% 100%;background-position:top left,top right;background-repeat:no-repeat;border-bottom-left-radius:1em;border-bottom-right-radius:1em;display:flex;justify-content:space-between;align-items:center;position:relative;cursor:grab;touch-action:none}
.tp-jm .mt-controls{display:flex;align-items:center;gap:.9em}
.tp-jm .mt-controls .mt-btn svg{width:1.4em;height:1.4em}
.tp-jm .mt-controls .mt-btn.play{width:2.5em;height:2.5em;border-radius:50%;background:var(--ta);box-shadow:0 0 15px var(--tag)}
.tp-jm .mt-controls .mt-btn.play svg{width:1.2em;height:1.2em}
.tp-jm .t-barcode-id{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.7em;color:var(--t-text-muted);letter-spacing:.18em;margin-top:.5em}
.tp-jm .t-admit-text{font-size:.7em;text-transform:uppercase;letter-spacing:.1em;color:var(--t-text-muted);text-align:right}
.tp-jm .mt-cover{width:3.2em;height:3.2em;border-radius:50%;margin-left:auto;background:conic-gradient(from 200deg,var(--t-bg-light),var(--ta),var(--t-bg-light)) center/cover;border:2px solid rgba(255,255,255,.18);box-shadow:0 0 15px var(--tag);display:flex;align-items:center;justify-content:center;font-size:.5em;color:var(--t-text-muted);animation:jm-spin 18s linear infinite;animation-play-state:paused}
.tp-jm .mt-cover.playing{animation-play-state:running}
.tp-jm .mt-cover.has-img{color:transparent}
@keyframes jm-spin{to{transform:rotate(360deg)}}
@media (max-width:560px){.tp-jm .jm-full{width:224px}}
.tp-cap{transition:background-color .7s}
.tp-cap.clock{background:rgba(28,28,34,.55)}
.tp-cap .jcap-panel{transition:opacity .4s,filter .4s,visibility .4s}
.tp-cap.clock .jcap-panel{opacity:1;visibility:visible;filter:blur(0)}
.tp-jm .jm-mini{transition:opacity .4s,transform .4s cubic-bezier(.215,.61,.355,1),filter .4s,visibility .4s}
.tp-jm .jm-full{opacity:0;visibility:hidden;filter:blur(8px);transform:translateX(-50%) translateY(10px) scale(.92);transition:opacity .28s,transform .28s,filter .28s,visibility .28s}
.tp-jm.open .jm-mini{opacity:0;visibility:hidden;filter:blur(8px);transform:translateX(-50%) scale(.94);transition-duration:.22s}
.tp-jm.open .jm-full{opacity:1;visibility:visible;filter:blur(0);transform:translateX(-50%);transition:opacity .45s,transform .45s cubic-bezier(.215,.61,.355,1),filter .45s,visibility .45s}
.tp-jm .jm-mini{transform:translateX(-50%)}
.tp-jm .jm-mini .mbar{pointer-events:none}
.tp{background:radial-gradient(900px 560px at 18% 12%,#3a2a6a 0,transparent 60%),radial-gradient(800px 520px at 90% 90%,#6a2a2a 0,transparent 60%),#0f1220;color:#f2f2f4;font-family:"Space Grotesk","Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tp-view{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-ms-overflow-style:none}
.tp-view::-webkit-scrollbar{width:0;height:0;display:none}
.tp-sec{height:100%;box-sizing:border-box;padding:0 12% 0 8%;display:flex;flex-direction:column;justify-content:center;gap:14px}
.tp-sec small{font:11px var(--mono);color:#d4d6df}
.tp-sec h2{font-size:clamp(30px,5vw,68px);letter-spacing:-.045em;line-height:1;font-weight:600;max-width:12em}
.tp-sec p{font-size:15px;line-height:1.65;max-width:34em;opacity:.78}
.tp-sec pre{font:11px/1.6 var(--mono);color:#d4d6df}
.tp-sec:last-child{padding-bottom:110px}`,
mount(h,ctx){
  const P=ctx.P,doc=h.ownerDocument,win=doc.defaultView;
  const offs=[],timers=[];
  const on=(t,e,f,o)=>{t.addEventListener(e,f,o);offs.push(()=>t.removeEventListener(e,f,o))};
  const later=(f,ms)=>{const id=setTimeout(f,ms);timers.push(id);return id};
  // ── 站点配置（原版从 /site.config.json 读 music 节点）──
  const CFG={songIds:['186016','347230','186001'],playerTitle:'BGM',api:'/api/assist?do=music&ids='};
  const ids=CFG.songIds;
  const secs=[...ctx.items.map((it,i)=>({n:pad(i+1),t:it.title,b:it.body,c:it.code})),{n:pad(ctx.items.length+1),t:'听一段',b:'右侧的胶囊会在滚动时长成时钟，点里面的音符；底部的播放条点一下，展开成票据。',c:'♪ cloud music · outer url'}];
  const SVG_PREV='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z"/></svg>';
  const SVG_NEXT='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>';
  const SVG_PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  h.innerHTML=`<div class="stg tp"><div class="tp-view"></div>
  <div class="tp-cap"><div class="jcap-panel">
    <svg id="jcapFace" width="36" height="36" viewBox="0 0 36 36"></svg>
    <div class="jcap-t" id="jcapTm">00:00</div><div class="jcap-pct" id="jcapPc">0%</div>
    <button class="jcap-note" id="jcapNote" title="音乐" aria-label="音乐播放器"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="3.5"/><circle cx="17.5" cy="16" r="3.5"/></svg><span class="eq"><i></i><i></i><i></i></span></button>
  </div></div>
  <div class="tp-jm">
    <div class="jm-mini glass" title="点击展开"><div class="mc" id="jmMcCover"></div><div class="w" id="jmMcWave"></div>
      <button class="mt-btn" id="jmMcPrev" aria-label="上一首">${SVG_PREV}</button>
      <button class="mt-btn play" id="jmMcPlay" aria-label="播放/暂停"><svg viewBox="0 0 24 24" fill="currentColor" id="jmMcPlayIcon"><path d="M8 5v14l11-7z"/></svg></button>
      <button class="mt-btn" id="jmMcNext" aria-label="下一首">${SVG_NEXT}</button>
      <div class="mbar"><b id="jmMcFill"></b></div></div>
    <div class="jm-full glass">
      <div class="jm-hd" id="jmFullHd" title="收起"><span class="d"><i></i><i></i><i></i></span><span>Music Terminal</span><span class="st" id="jmCpSt">○ Paused</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
      <div class="ticket-canvas"><div class="ticket-wrapper"><div class="ticket"><div class="t-main"><div class="t-content">
        <div class="t-header"><div class="t-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>CLOUD</div><div class="t-type">Now Playing</div></div>
        <div class="t-title" id="jmCpTitle">—</div><div class="t-subtitle" id="jmCpArtist">&nbsp;</div>
        <div class="t-details">
          <div class="t-detail-item"><span class="t-label">Time</span><span class="t-value mono"><span id="jmCpCur">00:00</span> / <span id="jmCpTot">00:00</span></span></div>
          <div class="t-detail-item"><span class="t-label">Status</span><span class="t-value" id="jmCpStatus">Paused</span></div>
          <div class="t-detail-item t-wide"><div class="mt-wave" id="jmCpWave"></div><div class="mt-progress" id="jmCpProgress"><div class="mt-progress-fill" id="jmCpFill"></div></div></div>
        </div></div>
        <div class="t-perforation" style="position:absolute;bottom:0;left:0;width:100%;transform:translateY(50%)"><div class="t-perf-line"></div></div>
      </div><div class="t-stub" id="jmStub">
        <div><div class="mt-controls">
          <button class="mt-btn" id="jmCpPrev" aria-label="上一首">${SVG_PREV}</button>
          <button class="mt-btn play" id="jmCpPlay" aria-label="播放/暂停"><svg viewBox="0 0 24 24" fill="currentColor" id="jmCpPlayIcon"><path d="M8 5v14l11-7z"/></svg></button>
          <button class="mt-btn" id="jmCpNext" aria-label="下一首">${SVG_NEXT}</button>
        </div><div class="t-barcode-id" id="jmBarcode">CLOUD MUSIC · LIVE</div></div>
        <div><div class="t-admit-text">Cover</div><div class="mt-cover" id="jmCpCover">COVER</div></div>
      </div></div></div></div>
    </div>
  </div></div>`;
  const root=$('.tp',h),view=$('.tp-view',h),cap=$('.tp-cap',h),jm=$('.tp-jm',h);
  const ro=new ResizeObserver(()=>root.style.setProperty('--vw',root.clientWidth+'px'));ro.observe(root);
  secs.forEach(s=>view.appendChild(el('section','tp-sec',`<small>${s.n} / ${pad(secs.length)}</small><h2>${esc(s.t)}</h2><p>${esc(s.b)}</p><pre>${esc(s.c)}</pre>`)));
  const mm=s=>{s=Math.max(0,Math.floor(s||0));return pad(Math.floor(s/60))+':'+pad(s%60)};
  const safeImg=u=>/^https?:\/\//.test(u||'')?('url("'+u.replace(/"/g,'%22')+'")'):'';

  /* ══ 一、网易云引擎（原 createMusicTerminal）══ */
  const previewOnly=!!ctx.auto;
  const audio=new Audio();audio.preload=previewOnly?'none':'metadata';audio.volume=clamp(+P.VOL,0,1);
  const outer=id=>'https://music.163.com/song/media/outer/url?id='+id+'.mp3';
  const S={playing:false,curTime:0,totalTime:0,curIndex:0,playlist:ids.map(id=>({id,title:'加载中…',artist:CFG.playerTitle,cover:'',src:outer(id),duration:0}))};
  let failChain=0,sim=previewOnly,want=false,dead=false;
  function applyMeta(list){
    const by={};(list||[]).forEach(s=>{by[String(s.id)]=s});
    S.playlist=ids.map(id=>{const s=by[id];
      return s?{id:String(s.id),title:s.name||('Track '+id),artist:s.artists||s.album||CFG.playerTitle||'网易云音乐',cover:s.pic||'',src:outer(id),duration:s.dt?s.dt/1000:0}
              :{id,title:'Track '+id,artist:CFG.playerTitle||'网易云音乐',cover:'',src:outer(id),duration:0}});
  }
  if(!previewOnly){
    fetch(CFG.api+encodeURIComponent(ids.join(','))).then(r=>r.ok?r.json():null)
      .then(d=>{if(dead)return;if(d&&d.songs){applyMeta(d.songs);S.totalTime=S.playlist[S.curIndex].duration||0}else applyMeta([])}).catch(()=>{if(!dead)applyMeta([])});
  }
  function go(i,autoplay){
    S.curIndex=mod(i,ids.length);S.curTime=0;const t=S.playlist[S.curIndex];
    if(sim){S.totalTime=t.duration||150;S.playing=!!autoplay;return}
    S.playing=false;
    if(!autoplay)return;
    audio.src=t.src;if(t.duration)S.totalTime=t.duration;
    audio.play().catch(()=>{});
  }
  audio.addEventListener('timeupdate',()=>{S.curTime=audio.currentTime});
  audio.addEventListener('loadedmetadata',()=>{S.totalTime=isFinite(audio.duration)?audio.duration:0;S.playlist[S.curIndex].duration=S.totalTime});
  audio.addEventListener('play',()=>{S.playing=true});
  audio.addEventListener('playing',()=>{failChain=0}); // 原版在 play 上清零：全部失败时会无限轮询，这里改成真正出声才清零
  audio.addEventListener('pause',()=>{S.playing=false});
  audio.addEventListener('ended',()=>go(S.curIndex+1,true));
  audio.addEventListener('error',()=>{
    if(dead||sim)return;failChain++;
    if(!want){S.playing=false;return}
    if(failChain>=ids.length){
      if(+P.SIM){sim=true;S.playing=want;S.curTime=0;S.totalTime=S.playlist[S.curIndex].duration||150;audio.removeAttribute('src')}
      else{S.playing=false;const tr=S.playlist[S.curIndex];if(tr)tr.title='歌曲暂不可播（版权/网络）'}
    }else go(S.curIndex+1,true);
  });
  go(0,false);
  const MT={
    play(){want=true;if(sim){S.playing=true;return}if(audio.src!==S.playlist[S.curIndex].src)audio.src=S.playlist[S.curIndex].src;return audio.play().catch(()=>{})},
    pause(){want=false;if(sim){S.playing=false;return}audio.pause()},
    toggle(){const playing=sim?S.playing:!audio.paused;want=!playing;if(sim){S.playing=!playing;return}if(playing)return audio.pause();if(audio.src!==S.playlist[S.curIndex].src)audio.src=S.playlist[S.curIndex].src;return audio.play().catch(()=>{})},
    next(){const resume=sim?S.playing:!audio.paused;want=resume;go(S.curIndex+1,resume)},
    prev(){const resume=sim?S.playing:!audio.paused;want=resume;go(S.curIndex-1,resume)},
    seek(x){if(sim){S.curTime=clamp(x,0,S.totalTime);return}if(isFinite(audio.duration)&&audio.duration>0)audio.currentTime=clamp(x,0,audio.duration)},
    getState(){return S}
  };

  /* ══ 二、胶囊滚动条（原 mountCapsule：跟随原生滚动）══ */
  const THUMB={w:5,h:64},MIN={w:50,h:188},PAD=12,BOT=12;
  const face=$('#jcapFace',cap),tm=$('#jcapTm',cap),pc=$('#jcapPc',cap),note=$('#jcapNote',cap);
  let hh,mh,sh;
  (function(){
    let fx='<circle cx="18" cy="18" r="17" fill="none" stroke="#fff" stroke-opacity=".35"/>';
    for(let i=0;i<12;i++)fx+='<line x1="18" y1="'+(i%3?3.5:3)+'" x2="18" y2="'+(i%3?5:6)+'" stroke="#fff" stroke-opacity=".6" transform="rotate('+(i*30)+' 18 18)"/>';
    fx+='<line id="jcapHh" x1="18" y1="18" x2="18" y2="10" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line id="jcapMh" x1="18" y1="18" x2="18" y2="6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><line id="jcapSh" x1="18" y1="21" x2="18" y2="5" stroke="#ff4d00" stroke-width="1" stroke-linecap="round"/><circle cx="18" cy="18" r="1.6" fill="#ff4d00"/>';
    face.innerHTML=fx;hh=$('#jcapHh',face);mh=$('#jcapMh',face);sh=$('#jcapSh',face);
  })();
  const size={w:THUMB.w,h:THUMB.h};
  let cstate='bar',dragging=false,hov=false,pinned=false,lastMove=0,startY=0,moved=false,cancelSz=null,lastSec=-1;
  const maxScroll=()=>Math.max(1,view.scrollHeight-view.clientHeight);
  const applySize=()=>{cap.style.width=size.w+'px';cap.style.height=size.h+'px'};
  function setState(s){
    if(s===cstate)return;cstate=s;const d=s==='bar'?THUMB:MIN,f={w:size.w,h:size.h};
    cap.classList.toggle('clock',s==='clock');
    if(cancelSz)cancelSz();
    cancelSz=tween(s==='clock'?P.MORPH:P.MORPH*.92,u=>{size.w=f.w+(d.w-f.w)*u;size.h=f.h+(d.h-f.h)*u;applySize()},E.p3io);
    ctx.status(s.toUpperCase());
  }
  on(cap,'pointerdown',e=>{
    if(e.target.closest('.jcap-note'))return;
    dragging=true;moved=false;startY=e.clientY;cap.classList.add('grabbing');
    try{cap.setPointerCapture(e.pointerId)}catch(_){}
    lastMove=performance.now();setState('clock');
  });
  on(win,'pointermove',e=>{
    if(!dragging)return;
    if(!moved&&Math.abs(e.clientY-startY)>4)moved=true;
    if(moved){const R=root.getBoundingClientRect(),vh=root.clientHeight,ratio=clamp((e.clientY-R.top-PAD)/(vh-PAD-BOT),0,1);view.scrollTop=ratio*maxScroll();lastMove=performance.now()}
  },{passive:true});
  const endDrag=()=>{if(dragging){dragging=false;pinned=true;cap.classList.remove('grabbing')}};
  on(win,'pointerup',endDrag);on(win,'pointercancel',endDrag);
  on(cap,'pointerenter',()=>{hov=true;if(cstate==='bar')setState('clock')});
  on(cap,'pointerleave',()=>{hov=false;lastMove=performance.now()});
  on(win,'pointerdown',e=>{if(!cap.contains(e.target))pinned=false},true);
  on(doc,'keydown',e=>{if(e.key==='Escape'){pinned=false;if(open)setOpen(false)}});
  on(note,'click',e=>{e.stopPropagation();setOpen(!open)});
  on(view,'scroll',()=>{lastMove=performance.now();if(cstate==='bar')setState('clock')},{passive:true});
  function tickClock(){
    const d=new Date(),sec=d.getSeconds(),s=sec+d.getMilliseconds()/1000,m=d.getMinutes()+s/60,hr=d.getHours()%12+m/60;
    if(sec===lastSec&&cstate!=='clock')return;lastSec=sec;
    sh.setAttribute('transform','rotate('+(s*6)+' 18 18)');mh.setAttribute('transform','rotate('+(m*6)+' 18 18)');hh.setAttribute('transform','rotate('+(hr*30)+' 18 18)');
    tm.textContent=pad(d.getHours())+':'+pad(d.getMinutes());
  }
  function capLoop(){
    const vh=root.clientHeight,ms=maxScroll(),y0=view.scrollTop;
    if(view.scrollHeight-vh<=4){cap.style.display='none';return}
    cap.style.display='block';
    const p=clamp(y0/ms,0,1),railH=vh-PAD-BOT,hgt=size.h;
    const y=clamp(PAD+p*railH-hgt/2,PAD,vh-BOT-hgt);
    cap.style.transform='translate3d(0,'+y+'px,0)';
    if(cstate==='clock'&&!dragging&&!pinned&&!hov&&performance.now()-lastMove>P.REST)setState('bar');
    if(cstate==='clock'){pc.textContent=Math.round(p*100)+'%';tickClock()}
  }
  applySize();

  /* ══ 三、mini ↔ 票据（原 mountPlayer）══ */
  const mini=$('.jm-mini',jm),full=$('.jm-full',jm),$id=id=>$('#'+id,jm);
  const cpCover=$id('jmCpCover'),mcCover=$id('jmMcCover'),cpWave=$id('jmCpWave'),mcWave=$id('jmMcWave'),cpBars=[];
  for(let i=0;i<40;i++){
    const v=Math.sin(i*.45)*.5+Math.sin(i*.17+1.3)*.3+Math.sin(i*.9+.6)*.2,b=document.createElement('span');
    b.style.height=Math.round(25+(v+1)/2*65)+'%';b.style.setProperty('--t',(.3+Math.random()*.5).toFixed(2)+'s');b.style.setProperty('--d',(-Math.random()*.8).toFixed(2)+'s');
    cpWave.appendChild(b);cpBars.push(b);
  }
  for(let k=0;k<28;k++){const mb=document.createElement('span');mb.style.setProperty('--t',(.35+Math.random()*.5).toFixed(2)+'s');mb.style.setProperty('--d',(-Math.random()*.8).toFixed(2)+'s');mcWave.appendChild(mb)}
  let open=false,ox=0,oy=0,dragged=false;
  function setOpen(v){if(v===open)return;open=v;jm.classList.toggle('open',v)}
  on(mini,'click',e=>{if(!dragged&&!e.target.closest('button'))setOpen(true)});
  on($id('jmFullHd'),'click',()=>{if(!dragged)setOpen(false)});
  const ICON_PLAY='M8 5v14l11-7z',ICON_PAUSE='M7 5h4v14h-4zM13 5h4v14h-4z';
  let lastCover=null,lastPlaying=null,lastSim=null;
  function render(){
    const s=MT.getState(),t=s.playlist[s.curIndex]||{},ratio=s.totalTime>0?clamp(s.curTime/s.totalTime,0,1):0;
    if((t.cover||'')!==lastCover||(t.title||'')!==(mini.__t||'')){
      lastCover=t.cover||'';mini.__t=t.title||'';const bg=safeImg(t.cover);
      cpCover.style.backgroundImage=bg;mcCover.style.backgroundImage=bg;cpCover.classList.toggle('has-img',!!t.cover);
      mini.title=(t.title||'')+(t.artist?' — '+t.artist:'');
    }
    if(s.playing!==lastPlaying){
      lastPlaying=s.playing;
      mini.classList.toggle('playing',s.playing);full.classList.toggle('playing',s.playing);note.classList.toggle('playing',s.playing);cpCover.classList.toggle('playing',s.playing);
      $id('jmMcPlayIcon').firstElementChild.setAttribute('d',s.playing?ICON_PAUSE:ICON_PLAY);
      $id('jmCpPlayIcon').firstElementChild.setAttribute('d',s.playing?ICON_PAUSE:ICON_PLAY);
      $id('jmCpStatus').textContent=s.playing?'Streaming':'Paused';$id('jmCpSt').textContent=s.playing?'● Playing':'○ Paused';
    }
    if(sim!==lastSim){lastSim=sim;$id('jmBarcode').textContent=sim?'CLOUD MUSIC · SIM':'CLOUD MUSIC · LIVE'}
    if(open){
      $id('jmCpTitle').textContent=t.title||'—';$id('jmCpArtist').textContent=t.artist||'\u00a0';
      $id('jmCpCur').textContent=mm(s.curTime);$id('jmCpTot').textContent=mm(s.totalTime);$id('jmCpFill').style.width=ratio*100+'%';
      const cut=Math.floor(cpBars.length*ratio);cpBars.forEach((bar,idx)=>bar.classList.toggle('past',idx<cut));
    }else $id('jmMcFill').style.width=ratio*100+'%';
  }
  const MTbtn=fn=>e=>{e.stopPropagation();MT[fn]()};
  on($id('jmMcPlay'),'click',MTbtn('toggle'));on($id('jmCpPlay'),'click',MTbtn('toggle'));
  on($id('jmMcPrev'),'click',MTbtn('prev'));on($id('jmCpPrev'),'click',MTbtn('prev'));
  on($id('jmMcNext'),'click',MTbtn('next'));on($id('jmCpNext'),'click',MTbtn('next'));
  function bindSeek(elm){
    let down=false;
    const go2=x=>{const r=elm.getBoundingClientRect();MT.seek(clamp((x-r.left)/r.width,0,1)*S.totalTime)};
    on(elm,'pointerdown',e=>{down=true;try{elm.setPointerCapture(e.pointerId)}catch(_){}go2(e.clientX);e.stopPropagation()});
    on(win,'pointermove',e=>{if(down)go2(e.clientX)});
    const off=()=>{down=false};on(win,'pointerup',off);on(win,'pointercancel',off);
  }
  bindSeek($id('jmCpProgress'));bindSeek(cpWave);

  /* 拖拽 mini / full：甩动带旋转，松手弹簧回正 */
  const rots=[];
  function makeDraggable(elm,skip){
    const d={rot:0,tgt:0,free:false,cancel:null,last:null};rots.push({elm,d});
    let down=false,mv=false,sx,sy,bx,by,lx,vx=0,rg,tmr;
    on(elm,'pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;if(e.target.closest(skip))return;
      down=true;mv=false;sx=lx=e.clientX;sy=e.clientY;vx=0;bx=ox;by=oy;
      const r=elm.getBoundingClientRect(),R=root.getBoundingClientRect();
      rg={x0:ox-(r.left-R.left-8),x1:ox+(R.right-8-r.right),y0:oy-(r.top-R.top-8),y1:oy+(R.bottom-8-r.bottom)};
    });
    on(win,'pointermove',e=>{
      if(!down)return;
      if(!mv){if(Math.hypot(e.clientX-sx,e.clientY-sy)<5)return;mv=true;elm.style.cursor='grabbing';elm.style.transformOrigin='50% 0%';if(d.cancel)d.cancel();d.free=false}
      ox=clamp(bx+e.clientX-sx,rg.x0,Math.max(rg.x0,rg.x1));oy=clamp(by+e.clientY-sy,rg.y0,Math.max(rg.y0,rg.y1));
      jm.style.transform='translate('+ox+'px,'+oy+'px)';
      vx=vx*.7+(e.clientX-lx)*.3;lx=e.clientX;d.tgt=clamp(vx*1.2,-22,22);
      clearTimeout(tmr);tmr=setTimeout(()=>{d.tgt=0},90);timers.push(tmr);
    });
    const end=()=>{
      if(!down)return;down=false;if(!mv)return;
      clearTimeout(tmr);elm.style.cursor='';dragged=true;later(()=>{dragged=false},60);
      const from=d.rot;d.free=true;d.tgt=0;
      d.cancel=tween(1.1,u=>{d.rot=from*(1-u)},t=>E.elastic(t,1,.35),()=>{d.free=false;d.rot=0;elm.style.transformOrigin=''});
    };
    on(win,'pointerup',end);on(win,'pointercancel',end);
  }
  makeDraggable(mini,'button');
  makeDraggable(full,'.mt-btn,#jmCpWave,#jmCpProgress,.t-stub,#jmFullHd,.jm-hd');

  /* 撕下票根关闭票据 */
  (function(){
    const stub=$id('jmStub');let down=false,sx,sy,cancel=null;
    stub.title='向下撕关闭';
    const put=(x,y,r,o)=>{stub.style.transform='translate('+x+'px,'+y+'px) rotate('+r+'deg)';stub.style.opacity=o==null?'':String(o)};
    on(stub,'pointerdown',e=>{
      if(e.target.closest('.mt-btn'))return;
      if(cancel){cancel();cancel=null}
      down=true;sx=e.clientX;sy=e.clientY;stub.style.transformOrigin='0% 0%';stub.style.opacity='';e.stopPropagation();
    });
    on(win,'pointermove',e=>{if(!down)return;const dx=e.clientX-sx,dy=e.clientY-sy;put(dx*.7,dy*.7,clamp(dx*.12+dy*.25,-8,60))});
    const end=e=>{
      if(!down)return;down=false;
      const dx=e.clientX-sx,dy=e.clientY-sy,x0=dx*.7,y0=dy*.7,r0=clamp(dx*.12+dy*.25,-8,60);
      if(Math.hypot(dx,dy)>=70&&dy>10){
        const x1=dx*1.2+(dx>=0?120:-120),y1=dy*.7+260;
        cancel=tween(.6,u=>put(x0+(x1-x0)*u,y0+(y1-y0)*u,r0+40*u,1-u),t=>t*t);
        later(()=>setOpen(false),350);
        later(()=>{stub.style.transform='';stub.style.opacity=''},900);
      }else{
        cancel=tween(.9,u=>put(x0*(1-u),y0*(1-u),r0*(1-u)),t=>E.elastic(t,1,.4),()=>{stub.style.transform=''});
      }
    };
    on(win,'pointerup',end);on(win,'pointercancel',end);
  })();

  /* 主循环：胶囊位置 + 模拟播放 + 视图刷新 + 旋转阻尼 */
  let lastVol=P.VOL;
  const stop=ticker(dt=>{
    if(P.VOL!==lastVol){lastVol=P.VOL;audio.volume=clamp(+P.VOL,0,1)}
    if(sim&&S.playing){S.curTime+=dt;if(S.totalTime>0&&S.curTime>=S.totalTime)go(S.curIndex+1,true)}
    capLoop();render();
    rots.forEach(({elm,d})=>{
      if(!d.free)d.rot=damp(d.rot,d.tgt,12,dt);
      const v=Math.abs(d.rot)<.01?0:+d.rot.toFixed(2);
      if(v!==d.last){d.last=v;elm.style.rotate=v?v+'deg':''}
    });
  });
  // 预览自动演示：滚到下一屏，隔几轮打开票据、开始播放，再收起
  let dn=0;
  ctx.demo(()=>{
    dn++;
    if(dn%8===3){setOpen(true);if(!S.playing)MT.toggle()}
    else if(dn%8===6)setOpen(false);
    view.scrollTo({top:(dn%secs.length)*view.clientHeight,behavior:'smooth'});
  },2600);
  ctx.status('BAR');
  return()=>{
    dead=true;stop();offs.forEach(f=>f());timers.forEach(clearTimeout);if(cancelSz)cancelSz();
    rots.forEach(({d})=>{if(d.cancel)d.cancel()});
    audio.pause();audio.removeAttribute('src');audio.load();ro.disconnect();
  };
}});
