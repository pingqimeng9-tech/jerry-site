/* ─── 27 Fisheye Wall ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'fisheyewall',name:'Fisheye Music Wall',cat:'3D',mat:'音乐卡片墙',
spell:'封面卡片墙贴在球面上，边拖边换氛围色；点一张卡片，它飞到中央翻成播放器，唱片滑出来，墙退到后面，关掉后收成底部迷你条。',core:'球面鱼眼 × 封面主色氛围 × 卡片飞入播放器（FLIP）× 迷你条',tags:['3D','Music','Wall','Player','Ambient'],
credit:{n:'forum.hanakos.cc/music 的卡片墙点歌页，以及 hanaforum-visual-skills · music-visual-system（只参考页面描述，数学、动效与代码为原创）',u:'https://forum.hanakos.cc/music',own:1},
notes:['这是音乐页的“卡片墙点歌”：歌单铺成封面墙，滑动浏览，点开即播，不用先建歌单。','墙是球面鱼眼：每张卡片的平面坐标 (x,y) 映射到半径 RADIUS 的球上，位置用 sin、深度用 cos、朝向取球面法线；坐标对一圈取模，所以墙是无限的。拖动有惯性，滚轮改球半径。','氛围色：每一帧找出离屏幕中心最近的那张卡片，把它的主色（色相）平滑地过渡给背景的两团光——拖着浏览时，背景会跟着“最靠近你”的那张封面变色。','点击（移动小于 6px）打开播放器：用 FLIP 把大封面从被点那张卡片的屏幕位置放大到中央，黑胶从封面后面滑出并旋转，其余的墙被一层带模糊的幕布压到后面。再点幕布、按 Esc 或点 ✕ 关闭。','关闭后曲子继续播，卡片墙下方留一条迷你播放条（旋转小封面 + 实时波形 + 播放暂停），点它重新展开。音乐是现场合成的，每张封面对应一首不同的短曲，所以没有任何外部音频。','先看到的如果与原站细节有出入：原站 skill 里的详细文档我没能读到，这里的点击效果是按页面描述自己设计的。'],
knobs:[
{k:'RADIUS',label:'RADIUS 球半径（越小越弯）',v:640,min:300,max:1200,step:10},
{k:'FACE',label:'FACE 卡片朝向球面程度',v:1,min:0,max:1.5,step:.05},
{k:'PAR',label:'PAR 鼠标视差强度',v:.3,min:0,max:1,step:.05},
{k:'FRIC',label:'FRIC 惯性衰减（越大停得越快）',v:3,min:.5,max:10,step:.5},
{k:'AMB',label:'AMB 氛围色强度',v:1,min:0,max:1.6,step:.1},
{k:'VOL',label:'VOL 音量',v:.5,min:0,max:1,step:.05}],
css:`.fw{background:#07080e;color:#fff;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;touch-action:none;cursor:grab;--a1:#3b2a8f;--a2:#8f2a6b}.fw.dr{cursor:grabbing}
.fw-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;overflow:hidden}
.fw-amb{position:absolute;inset:0}.fw-amb i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.75}.fw-amb i:nth-child(1){width:760px;height:760px;left:-120px;top:-200px;background:var(--a1)}.fw-amb i:nth-child(2){width:700px;height:700px;right:-160px;bottom:-260px;background:var(--a2)}
.fw-pr{position:absolute;inset:0;perspective:1300px;perspective-origin:50% 50%}
.fw-w{position:absolute;left:600px;top:380px;width:0;height:0;transform-style:preserve-3d}
.fw-c{position:absolute;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:14px;overflow:hidden;backface-visibility:hidden;box-shadow:0 14px 34px rgba(0,0,0,.45);will-change:transform;cursor:pointer}
.fw-cv{position:absolute;inset:0;background:var(--cv)}.fw-cv:before{content:"";position:absolute;inset:0;background:var(--pt);opacity:.5}
.fw-cv:after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.3),transparent 45%,rgba(0,0,0,.35))}
.fw-c b{position:absolute;left:11px;right:11px;bottom:24px;font-size:14px;font-weight:800;line-height:1.15;text-shadow:0 2px 8px rgba(0,0,0,.6);z-index:2}.fw-c small{position:absolute;left:11px;bottom:9px;font-size:11px;opacity:.85;z-index:2}
.fw-c.on{outline:3px solid #fff;outline-offset:-3px}
.fw-scr{position:absolute;inset:0;z-index:20;background:rgba(5,6,12,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;pointer-events:none;transition:opacity .45s}.fw-scr.on{opacity:1;pointer-events:auto}
.fw-pl{position:absolute;inset:0;z-index:30;display:grid;place-items:center;pointer-events:none}.fw-pl[hidden]{display:none}
.fw-pi{position:relative;width:860px;height:380px;pointer-events:auto}
.fw-vn{position:absolute;left:230px;top:20px;width:340px;height:340px;border-radius:50%;background:repeating-radial-gradient(circle,#14151c 0 3px,#1d1f28 3px 5px);box-shadow:0 20px 50px rgba(0,0,0,.6);transition:transform .8s cubic-bezier(.2,.9,.2,1);transform:translateX(0)}.fw-vn:after{content:"";position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:var(--cv)}
.fw-pl.open .fw-vn{transform:translateX(120px)}.fw-vn.sp{animation:fw-sp 5s linear infinite}@keyframes fw-sp{to{rotate:360deg}}
.fw-big{position:absolute;left:0;top:10px;width:360px;height:360px;border-radius:20px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.6);z-index:2;transform-origin:0 0}.fw-big .fw-cv:before{opacity:.55}
.fw-big b{position:absolute;left:22px;right:22px;bottom:52px;font-size:34px;line-height:1.1;font-weight:900;text-shadow:0 3px 14px rgba(0,0,0,.5);z-index:2}.fw-big small{position:absolute;left:22px;bottom:24px;font-size:16px;opacity:.9;z-index:2}
.fw-inf{position:absolute;left:560px;top:30px;width:300px;display:flex;flex-direction:column;gap:14px;opacity:0;transform:translateX(-30px);transition:opacity .5s .25s,transform .7s .25s cubic-bezier(.2,.9,.2,1)}.fw-pl.open .fw-inf{opacity:1;transform:none}
.fw-inf small{font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:rgba(255,255,255,.7)}.fw-inf h2{margin:0;font-size:36px;line-height:1.1;letter-spacing:-.02em}.fw-inf p{margin:0;opacity:.75;font-size:15px}
.fw-wv{width:300px;height:80px;display:block}
.fw-pg{height:6px;border-radius:6px;background:rgba(255,255,255,.18);cursor:pointer}.fw-pg i{display:block;height:100%;border-radius:6px;background:#fff;width:0}
.fw-ct{display:flex;align-items:center;gap:14px}.fw-ct button{border:0;border-radius:50%;width:46px;height:46px;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer}.fw-ct button:hover{background:rgba(255,255,255,.28)}.fw-ct .pp{width:62px;height:62px;background:#fff;color:#111;font-size:22px}
.fw-x{position:absolute;right:0;top:-6px;border:0;background:rgba(255,255,255,.14);color:#fff;width:38px;height:38px;border-radius:50%;font-size:16px;cursor:pointer}
.fw-mini{position:absolute;left:50%;bottom:22px;transform:translate(-50%,90px);opacity:0;pointer-events:none;z-index:25;display:flex;align-items:center;gap:14px;padding:9px 20px 9px 10px;border-radius:40px;background:rgba(20,22,34,.7);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.2);cursor:pointer;transition:transform .6s cubic-bezier(.2,.9,.2,1),opacity .4s}.fw-mini.on{transform:translate(-50%,0);opacity:1;pointer-events:auto}
.fw-mc{width:46px;height:46px;border-radius:50%;background:var(--cv);box-shadow:inset 0 0 0 3px rgba(0,0,0,.35)}.fw-mc.sp{animation:fw-sp 4s linear infinite}
.fw-mini b{font-size:14px;display:block;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fw-mini small{font-size:11px;opacity:.7}.fw-mw{width:110px;height:30px}.fw-mini .pp{border:0;width:36px;height:36px;border-radius:50%;background:#fff;color:#111;font-size:14px;cursor:pointer}
.fw-tip{position:absolute;left:28px;top:24px;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.12em;opacity:.6;pointer-events:none;z-index:6}`,
mount(h,ctx){
  const P=ctx.P;
  const COLS=12,ROWS=8,GX=184,GY=184,WX=COLS*GX,WY=ROWS*GY;
  const NAMES=['Neon Drive','Paper Lanterns','Night Bus','Blue Hour','Static Bloom','Glass Rain','Tape Hiss','Orbit','Slow Fade','Cold Brew','Afterglow','Low Tide','Pocket Moon','Velvet','Signal','Chalk','Daydream','Harbor','Amber','Mono'];
  const ARTS=['Synth Demo','Lo-fi Lab','Night Owl','Paper Club','Tape Room'];
  const PATS=['repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 8px,transparent 8px 18px)','radial-gradient(circle at 70% 30%,rgba(255,255,255,.4) 0 28px,transparent 29px)','repeating-radial-gradient(circle at 20% 80%,rgba(255,255,255,.18) 0 6px,transparent 6px 14px)','linear-gradient(90deg,rgba(255,255,255,.14) 50%,transparent 50%) 0 0/24px 24px'];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const hue=i=>(i*47+(i%COLS)*9)%360;
  const cover=i=>`linear-gradient(${140+i*17}deg,hsl(${hue(i)} 75% 58%),hsl(${(hue(i)+70)%360} 70% 30%))`;
  const cards=[];let html='';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const i=r*COLS+c;cards.push({i,x:(c-COLS/2+.5)*GX,y:(r-ROWS/2+.5)*GY,name:NAMES[i%NAMES.length],art:ARTS[i%ARTS.length],hue:hue(i)});
    html+=`<div class="fw-c" data-i="${i}" style="--cv:${cover(i)};--pt:${PATS[i%4]}"><div class="fw-cv"></div><b>${NAMES[i%NAMES.length]}</b><small>${ARTS[i%ARTS.length]}</small></div>`}
  h.innerHTML=`<div class="stg fw"><div class="fw-st"><div class="fw-amb"><i></i><i></i></div><div class="fw-pr"><div class="fw-w">${html}</div></div><div class="fw-tip">DRAG · WHEEL · CLICK</div>
    <div class="fw-scr"></div>
    <div class="fw-pl" hidden><div class="fw-pi"><button class="fw-x">✕</button><div class="fw-vn"></div><div class="fw-big"><div class="fw-cv"></div><b></b><small></small></div>
      <div class="fw-inf"><small>NOW PLAYING</small><h2></h2><p></p><canvas class="fw-wv" width="600" height="160"></canvas><div class="fw-pg"><i></i></div><div class="fw-ct"><button class="pv">⏮</button><button class="pp">❚❚</button><button class="nx">⏭</button></div></div></div></div>
    <div class="fw-mini"><div class="fw-mc"></div><div><b></b><small></small></div><canvas class="fw-mw" width="220" height="60"></canvas><button class="pp">❚❚</button></div></div></div>`;
  const root=$('.fw',h),st=$('.fw-st',h),els=[...h.querySelectorAll('.fw-c')],scr=$('.fw-scr',h),pl=$('.fw-pl',h),big=$('.fw-big',h),vn=$('.fw-vn',h),mini=$('.fw-mini',h),mc=$('.fw-mc',h),wv=$('.fw-wv',h),mw=$('.fw-mw',h),pgI=$('.fw-pg i',h);
  let S=1,px=0,py=0,vx=0,vy=0,mx=0,my=0,gx=0,gy=0,down=null,goto=null,rad=P.RADIUS,sel=-1,isOpen=false,playing=false,ah=250,t=0;
  const ro=new ResizeObserver(()=>{S=Math.min(root.clientWidth/1200,root.clientHeight/760);css(st,'transform',`translate(-50%,-50%) scale(${S})`)});ro.observe(root);
  const wrap=(v,w)=>((v+w/2)%w+w)%w-w/2;
  // ── 音乐：每张封面一首现场合成的短曲 ──
  let AC=null,master,an,bus=null,timer=0,T0=0,step=0;const fq=new Uint8Array(128);
  const SC=[[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,2,3,5,7,9,10]],PR=[[0,5,3,4],[0,3,4,3],[0,2,5,4],[0,4,5,3]],WV=['sawtooth','triangle','square'];
  const mid=m=>440*2**((m-69)/12);
  const rnd=(n,s)=>{let x=(s+Math.imul(n,0x9E3779B9))>>>0;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296};
  const ensure=()=>{if(AC||ctx.auto)return;AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();an=AC.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=.8;master.connect(an);an.connect(AC.destination)};
  const tone=(tm,f,len,type,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,tm);g.gain.linearRampToValueAtTime(v,tm+.01);g.gain.exponentialRampToValueAtTime(.0008,tm+len);o.connect(g);g.connect(bus);o.start(tm);o.stop(tm+len+.05)};
  const kick=tm=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(150,tm);o.frequency.exponentialRampToValueAtTime(42,tm+.14);g.gain.setValueAtTime(.5,tm);g.gain.exponentialRampToValueAtTime(.001,tm+.22);o.connect(g);g.connect(bus);o.start(tm);o.stop(tm+.25)};
  const trk=i=>({bpm:84+(i*7)%40,root:50+(i*5)%12,sc:SC[i%3],prog:PR[i%4],wave:WV[i%3],seed:i*13+5});
  const stopMusic=()=>{clearInterval(timer);if(bus){const b=bus;b.gain.setTargetAtTime(0,AC.currentTime,.03);setTimeout(()=>b.disconnect(),300);bus=null}};
  const startMusic=i=>{ensure();if(!AC)return;stopMusic();const tr=trk(i),sd=60/tr.bpm/4;bus=AC.createGain();bus.connect(master);T0=AC.currentTime;step=0;AC.resume();
    timer=setInterval(()=>{while(T0+step*sd<AC.currentTime+.3){const n=step,tm=T0+n*sd,bar=Math.floor(n/16),s=n%16,deg=tr.prog[bar%4],note=d=>tr.root+tr.sc[((d%7)+7)%7]+12*Math.floor(d/7);
      if(s%8===0){tone(tm,mid(tr.root-12+tr.sc[deg]),sd*7,'triangle',.26);kick(tm)}
      if(rnd(n,tr.seed)<.72&&s%2===0)tone(tm,mid(note(deg+[0,2,4,2,5,4,2,1][s/2%8]+7)),sd*2.2,tr.wave,.055);step++}},50)};
  const setPlay=on=>{playing=on;if(!AC)return;if(on)AC.resume();else AC.suspend();vn.classList.toggle('sp',on&&isOpen);mc.classList.toggle('sp',on);h.querySelectorAll('.pp').forEach(b=>b.textContent=on?'❚❚':'▶')};
  // ── 打开 / 关闭播放器（FLIP：封面从被点的卡片位置飞到中央）──
  const fill=i=>{const c=cards[i];root.style.setProperty('--cv',cover(i));[big,mini,vn,mc].forEach(e=>e.style.setProperty('--cv',cover(i)));big.style.setProperty('--pt',PATS[i%4]);$('b',big).textContent=c.name;$('small',big).textContent=c.art;$('.fw-inf h2',h).textContent=c.name;$('.fw-inf p',h).textContent=c.art+' · Track '+String(i+1).padStart(2,'0');$('b',mini).textContent=c.name;$('small',mini).textContent=c.art;ctx.status('♪ '+c.name);ctx.focus(i,String(i+1).padStart(2,'0'))};
  const rectOf=el=>{const a=el.getBoundingClientRect(),b=st.getBoundingClientRect();return{x:(a.left-b.left)/S,y:(a.top-b.top)/S,w:a.width/S,h:a.height/S}};
  const open=(i,fromEl)=>{
    const was=sel;sel=i;fill(i);isOpen=true;goto=null;
    pl.hidden=false;pl.classList.remove('open');scr.classList.add('on');mini.classList.remove('on');
    const src=rectOf(fromEl||els[i]),dst=rectOf(big);
    const sc=src.w/dst.w;big.getAnimations().forEach(a=>a.cancel());
    big.animate([{transform:`translate(${src.x-dst.x}px,${src.y-dst.y}px) scale(${sc})`,borderRadius:'8px'},{transform:'none',borderRadius:'20px'}],{duration:620,easing:'cubic-bezier(.2,.9,.2,1)',fill:'both'});
    requestAnimationFrame(()=>pl.classList.add('open'));
    els.forEach((e,j)=>e.classList.toggle('on',j===i));
    if(was!==i||!playing){startMusic(i);setPlay(true)}else setPlay(true)};
  const close=()=>{if(!isOpen)return;isOpen=false;stopMusic();setPlay(false);pl.classList.remove('open');scr.classList.remove('on');vn.classList.remove('sp');
    const src=rectOf(els[sel]),dst=rectOf(big),sc=src.w/dst.w;
    const a=big.animate([{transform:'none'},{transform:`translate(${src.x-dst.x}px,${src.y-dst.y}px) scale(${sc})`}],{duration:520,easing:'cubic-bezier(.6,0,.4,1)',fill:'both'});
    a.onfinish=()=>{if(!isOpen)pl.hidden=true};mini.classList.add('on');ctx.status('♪ '+cards[sel].name+' · MINI')};
  const nextTrack=d=>{const i=(sel+d+cards.length)%cards.length;sel=i;fill(i);startMusic(i);setPlay(true);els.forEach((e,j)=>e.classList.toggle('on',j===i))};
  // ── 事件 ──
  root.addEventListener('pointerdown',e=>{if(isOpen||e.target.closest('.fw-mini'))return;down={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,el:e.target.closest('.fw-c')};goto=null;root.classList.add('dr');root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;
    if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)down.moved=true;
    if(down.moved){const dx=(e.clientX-down.lx)/S,dy=(e.clientY-down.ly)/S;px-=dx;py-=dy;vx=-dx*60;vy=-dy*60;down.lx=e.clientX;down.ly=e.clientY}});
  const up=()=>{if(!down)return;const d=down;down=null;root.classList.remove('dr');if(!d.moved&&d.el)open(+d.el.dataset.i,d.el)};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);root.addEventListener('pointerleave',()=>{mx=my=0});
  root.addEventListener('wheel',e=>{if(isOpen)return;e.preventDefault();ctx.set&&ctx.set('RADIUS',Math.round(clamp(P.RADIUS+e.deltaY*.6,300,1200)/10)*10)},{passive:false});
  scr.addEventListener('click',close);$('.fw-x',h).addEventListener('click',close);
  mini.addEventListener('click',e=>{if(e.target.closest('.pp'))return;open(sel,mc)});
  h.querySelectorAll('.pp').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setPlay(!playing)}));
  $('.pv',h).addEventListener('click',()=>nextTrack(-1));$('.nx',h).addEventListener('click',()=>nextTrack(1));
  root.tabIndex=0;root.style.outline='none';root.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key===' '&&sel>=0){setPlay(!playing);e.preventDefault()}});
  // ── 波形 ──
  const bars=(cv,n,live)=>{const g=cv.getContext('2d'),W=cv.width,H=cv.height,w=W/n;g.clearRect(0,0,W,H);
    for(let i=0;i<n;i++){const a=Math.floor(Math.pow(i/n,1.6)*90)+1;let v=live?fq[a]/255:.12+.08*Math.sin(t*3+i*.6);const hh=Math.max(4,v*H);g.fillStyle=`hsla(0,0%,100%,${.5+v*.5})`;g.beginPath();(g.roundRect||g.rect).call(g,i*w+w*.2,H-hh,w*.6,hh,w*.3);g.fill()}};
  const stop=ticker(dt=>{
    t+=dt;
    if(ctx.auto&&!down&&!isOpen){px+=dt*60;py+=Math.sin(t*.6)*dt*30}
    if(isOpen){}else if(goto){px+=(goto.x-px)*(1-Math.exp(-dt*7));py+=(goto.y-py)*(1-Math.exp(-dt*7));if(Math.hypot(goto.x-px,goto.y-py)<.5)goto=null}
    else if(!down){px+=vx*dt;py+=vy*dt;const k=Math.exp(-dt*P.FRIC);vx*=k;vy*=k}
    rad+=(P.RADIUS-rad)*(1-Math.exp(-dt*8));
    const k=1-Math.exp(-dt*6);gx+=(mx-gx)*k;gy+=(my-gy)*k;
    const R=rad,cx=gx*P.PAR*R*.9,cy=gy*P.PAR*R*.7;let best=1e9,bi=0;
    for(let n=0;n<cards.length;n++){
      const c=cards[n],e=els[n],ux=(wrap(c.x-px,WX)-cx)/R,uy=(wrap(c.y-py,WY)-cy)/R,th=Math.hypot(ux,uy);
      if(th<best){best=th;bi=n}
      if(th>1.38){css(e,'display','none');continue}
      css(e,'display','');
      const f=th<1e-4?1:Math.sin(th)/th,x=R*ux*f,y=R*uy*f,z=R*(Math.cos(th)-1)*1.15;
      const ry=Math.asin(Math.sin(ux)*.999)*57.3*P.FACE,rx=-Math.asin(Math.sin(uy)*.999)*57.3*P.FACE;
      css(e,'transform',`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg)`);
      css(e,'opacity',String(Math.max(0,Math.min(1,1.9-th*1.15)).toFixed(2)));css(e,'zIndex',String(Math.round(1000+z)))}
    // 氛围色：跟着离中心最近的封面走（色相走最短路径）
    const tgt=isOpen&&sel>=0?cards[sel].hue:cards[bi].hue;let dh=((tgt-ah+540)%360)-180;ah=(ah+dh*(1-Math.exp(-dt*3))+360)%360;
    const s=Math.min(1,.55*P.AMB),l=Math.min(60,30*P.AMB+12);css(root,'--a1',`hsl(${ah.toFixed(0)} 80% ${l.toFixed(0)}%)`);css(root,'--a2',`hsl(${((ah+55)%360).toFixed(0)} 80% ${(l*.85).toFixed(0)}%)`);css(root.querySelector('.fw-amb'),'opacity',String(s.toFixed(2)));
    // 音频
    if(AC&&master){master.gain.value=P.VOL;if(playing)an.getByteFrequencyData(fq)}
    if(isOpen)bars(wv,40,AC&&playing);else if(sel>=0)bars(mw,16,AC&&playing);
    if(AC&&sel>=0){const pr=((AC.currentTime-T0)%120)/120;css(pgI,'width',(pr*100).toFixed(1)+'%')}
  });
  return()=>{stop();stopMusic();if(AC)AC.close();ro.disconnect()};
}});
