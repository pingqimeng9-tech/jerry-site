window.__JERRY_REGISTER_TEMPLATE({id:'asciisharks',name:'Shark Glass Chat',cat:'Glass',mat:'ASCII 海洋',
spell:'深海里游着 ASCII 鲨鱼和小鱼，鼠标划过会扰动洋流；前景是一块半透明白色毛玻璃聊天框，可以直接和“深海”对话。',core:'ASCII 生物场做背景 · 真实 backdrop-filter 毛玻璃做前景 · 聊天输入驱动场景',tags:['Glass','Canvas','ASCII','Shark','Chat','Pointer'],
credit:{n:'ascii-sharks by stackedlol（ASCII 海洋与鲨鱼视觉方向，代码为独立重写）',u:'https://github.com/stackedlol/ascii-sharks',own:1},
notes:['背景不是视频：鲨鱼轮廓用路径裁剪后，再在轮廓里逐格填 ASCII 字符；鱼群是带洋流和指针斥力的字符粒子。','毛玻璃聊天框使用 backdrop-filter: blur() + saturate()，它的材质完全来自背后的 ASCII 洋流，所以鲨鱼游过时玻璃里会跟着变。','鼠标在背景上移动会推开鱼群并留下涟漪；点击水面会炸开一圈 ASCII 浪花。','聊天框可以直接输入，深海会用提前写好的句子回复；输入框聚焦时不会触发水面点击。'],
knobs:[
{k:'SHARKS',label:'SHARKS 鲨鱼数量',v:4,min:1,max:8,step:1},
{k:'FISH',label:'FISH 鱼群密度',v:84,min:20,max:180,step:4},
{k:'SPEED',label:'SPEED 游速',v:1,min:.2,max:2.4,step:.1},
{k:'GLASS',label:'GLASS 玻璃浓度',v:1,min:.3,max:1.8,step:.1}],
css:`.as{background:#03090f;color:#eefbff;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;overflow:hidden;cursor:crosshair;--gl:1}
.as canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.as-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 52% 46%,transparent 28%,rgba(0,4,10,.52) 78%,rgba(0,2,6,.86)),linear-gradient(180deg,rgba(0,8,16,.32),transparent 45%,rgba(0,4,9,.52))}
.as-top{position:absolute;left:38px;top:32px;z-index:5;display:flex;flex-direction:column;gap:5px;pointer-events:none;text-shadow:0 2px 16px rgba(0,0,0,.5)}
.as-top span{font:700 9px ui-monospace,Menlo,monospace;letter-spacing:.28em;color:rgba(153,235,255,.72)}
.as-top b{font-size:24px;letter-spacing:-.03em;font-weight:900}.as-top em{font:600 10px ui-monospace,Menlo,monospace;font-style:normal;letter-spacing:.18em;color:rgba(255,255,255,.48)}
.as-hint{position:absolute;left:38px;bottom:30px;z-index:5;font:600 9px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:rgba(153,235,255,.48);pointer-events:none}
.as-chat{position:absolute;right:82px;bottom:72px;z-index:8;width:430px;max-width:calc(100% - 32px);padding:19px;border-radius:26px;border:1px solid rgba(255,255,255,.44);background:linear-gradient(145deg,rgba(255,255,255,.36),rgba(255,255,255,.14));-webkit-backdrop-filter:blur(calc(24px * var(--gl,1))) saturate(1.45) brightness(calc(1 + .18 * var(--gl,1)));backdrop-filter:blur(calc(24px * var(--gl,1))) saturate(1.45) brightness(calc(1 + .18 * var(--gl,1)));box-shadow:0 36px 90px -28px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.56),inset 0 -1px 0 rgba(255,255,255,.1);color:#f8fdff;display:flex;flex-direction:column;gap:12px;cursor:default}
.as-chat:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at 20% 0%,rgba(255,255,255,.28),transparent 42%);opacity:.72}
.as-chat-head{position:relative;display:flex;align-items:flex-start;gap:10px}.as-chat-head>div{flex:1;min-width:0}
.as-chat-head small{display:block;font:700 8px ui-monospace,Menlo,monospace;letter-spacing:.22em;color:rgba(255,255,255,.58);margin-bottom:3px}
.as-chat-head h2{margin:0;font-size:23px;line-height:1.15;letter-spacing:-.03em;font-weight:800;text-shadow:0 2px 12px rgba(0,0,0,.18)}
.as-live{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.1);font:700 8px ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#d8fbff}
.as-live i{width:5px;height:5px;border-radius:50%;background:#8ef5ca;box-shadow:0 0 8px #8ef5ca;animation:asPulse 1.6s ease-in-out infinite}
@keyframes asPulse{50%{opacity:.35;transform:scale(.7)}}
.as-log{position:relative;display:flex;flex-direction:column;gap:8px;min-height:126px;max-height:238px;overflow:auto;padding:2px 3px 2px 0;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.35) transparent}
.as-log::-webkit-scrollbar{width:5px}.as-log::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border-radius:9px}
.as-msg{display:flex;align-items:flex-start;gap:7px;animation:asMsg .34s cubic-bezier(.2,.9,.2,1) both}
.as-msg .av{width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);font-size:11px;color:#fff}
.as-msg.shark .av{background:linear-gradient(135deg,#b9f7ff,#5ce1e6);color:#042027;font-weight:900}
.as-msg .bub{max-width:318px;padding:8px 11px;border-radius:4px 14px 14px 14px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);font-size:12.5px;line-height:1.55;color:#f0fcff;text-shadow:0 1px 4px rgba(0,0,0,.2)}
.as-msg.user{flex-direction:row-reverse}.as-msg.user .bub{border-radius:14px 4px 14px 14px;background:rgba(95,225,230,.24);border-color:rgba(170,250,255,.4)}
.as-msg.user .av{background:rgba(255,255,255,.24);font-size:10px;font-weight:800}
@keyframes asMsg{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.as-chips{display:flex;gap:5px;flex-wrap:wrap}
.as-chips button{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);color:rgba(255,255,255,.78);border-radius:20px;padding:5px 9px;font:600 9px ui-monospace,Menlo,monospace;cursor:pointer;transition:.16s}
.as-chips button:hover{background:rgba(255,255,255,.24);color:#fff;border-color:rgba(255,255,255,.45)}
.as-form{position:relative;display:flex;align-items:center;gap:7px}
.as-form input{flex:1;min-width:0;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);padding:0 12px;color:#fff;font:500 12px Inter,"PingFang SC",sans-serif;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.as-form input::placeholder{color:rgba(255,255,255,.46)}
.as-form input:focus{border-color:rgba(180,250,255,.65);background:rgba(255,255,255,.18);box-shadow:0 0 0 3px rgba(92,225,230,.12),inset 0 1px 0 rgba(255,255,255,.25)}
.as-form button{width:42px;height:42px;flex:none;border-radius:14px;border:1px solid rgba(255,255,255,.6);background:#f7fdff;color:#04151b;font-size:17px;font-weight:900;cursor:pointer;transition:.16s;box-shadow:0 8px 20px rgba(0,0,0,.22)}
.as-form button:hover{transform:translateY(-2px);background:#9df6ff}
.as-foot{font:600 8px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:rgba(255,255,255,.4);text-align:right}
@media(max-width:760px){.as-top{left:18px;top:18px}.as-top b{font-size:19px}.as-hint{left:18px;bottom:16px}.as-chat{right:12px;left:12px;bottom:12px;width:auto;max-width:none;padding:14px;border-radius:21px;gap:9px}.as-chat-head h2{font-size:20px}.as-log{min-height:92px;max-height:160px}.as-msg .bub{max-width:280px;font-size:12px}.as-chips{display:none}}
@media(prefers-reduced-motion:reduce){.as-live i{animation:none}.as-msg{animation:none}}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg as"><canvas class="as-canvas"></canvas><div class="as-vig"></div>
    <div class="as-top"><span>ASYNC OCEAN / LAYER 404</span><b>ASCII SHARKS</b><em>LIVE · DEEP WATER CHAT</em></div>
    <div class="as-chat"><div class="as-chat-head"><div><small>DEEP CHAT · ONLINE</small><h2>和深海说话</h2></div><span class="as-live"><i></i>LIVE</span></div>
      <div class="as-log"></div>
      <div class="as-chips"><button data-q="这里有鲨鱼吗？">这里有鲨鱼吗？</button><button data-q="你在深海看到什么？">你看到什么？</button><button data-q="讲一个冷知识">冷知识</button></div>
      <form class="as-form"><input aria-label="输入消息" placeholder="对深海的鲨鱼说点什么…" autocomplete="off"><button type="submit" aria-label="发送">↗</button></form>
      <div class="as-foot">背景由 ASCII 生物场实时绘制 · 移动/点击水面</div>
    </div><div class="as-hint">MOVE / CLICK THE WATER</div></div>`;
  const root=h.querySelector('.as'), cvs=h.querySelector('.as-canvas'), g=cvs.getContext('2d');
  root.style.setProperty('--gl', P.GLASS);
  const log=h.querySelector('.as-log'), form=h.querySelector('.as-form'), input=form.querySelector('input');
  const chips=[...h.querySelectorAll('.as-chips button')];
  const FISH_GLYPHS=["'",'`','.','~','-','>','<','·'];
  const SHARK_RAMP=':;t%SX8#@';
  let W=0,H=0,DPR=1,t=0,raf=0,last=performance.now(),running=true;
  let fish=[],sharks=[],ripples=[];
  const pointer={x:0,y:0,active:false,lastRipple:0};
  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;

  function resize(){
    const r=root.getBoundingClientRect();
    W=Math.max(1,r.width);H=Math.max(1,r.height);DPR=Math.min(window.devicePixelRatio||1,2);
    cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);
    g.setTransform(DPR,0,0,DPR,0,0);
    seed();
  }
  function seed(){
    const n=Math.round(P.FISH);
    fish=[];for(let i=0;i<n;i++)fish.push({x:rand(0,W),y:rand(0,H),vx:rand(-1,1),vy:rand(-.4,.4),g:FISH_GLYPHS[i%FISH_GLYPHS.length],a:rand(.18,.8),s:rand(.08,.16)});
    sharks=[];const count=Math.round(P.SHARKS);
    for(let i=0;i<count;i++){const len=rand(150,280)*Math.max(.55,Math.min(1.12,W/1100))*(i===0?1.12:1);const dir=Math.random()<.5?0:Math.PI;sharks.push({x:rand(W*.1,W*.9),y:rand(H*.16,H*.8),vx:Math.cos(dir)*rand(14,28),vy:0,len,phase:rand(0,6.28),seed:i*19+7,depth:rand(.45,1)});}
  }

  function addMsg(text,who,delay){
    const run=()=>{const row=document.createElement('div');row.className='as-msg '+who;row.innerHTML='<span class="av">'+(who==='shark'?'鲨':'你')+'</span><div class="bub"></div>';row.querySelector('.bub').textContent=text;log.appendChild(row);log.scrollTo({top:log.scrollHeight,behavior:'smooth'});};
    if(delay)setTimeout(run,delay);else run();
  }
  const facts=[
    '深海里最吵的不是鲨鱼，是海胆啃石头的声音。',
    '鲨鱼没有鱼鳔，所以它们必须一直游，或者让水流过鳃。',
    '这层玻璃是毛玻璃：它没有自己的颜色，只把背后的 ASCII 洋流磨碎。',
    '你看到的每一道波纹，都是字符在 60 分之一秒里换了一次位置。',
    '锤头鲨的头部像机翼，能帮它在转弯时更省力。',
    '如果我停下来，鱼群会以为我只是一块阴影。'
  ];
  let factI=0;
  function reply(text){
    addMsg(text, 'shark', 420);
    setTimeout(()=>{ctx.status && ctx.status('DEEP CHAT · SHARK ONLINE');}, 430);
  }
  function send(text){
    const msg=String(text||'').trim();if(!msg)return;
    addMsg(msg,'user');
    input.value='';
    setTimeout(()=>reply(facts[factI++%facts.length]),620);
    for(let i=0;i<7;i++)splash(pointer.x||W*.6,pointer.y||H*.7,false);
  }
  form.addEventListener('submit',e=>{e.preventDefault();send(input.value)});
  chips.forEach(b=>b.addEventListener('click',()=>send(b.dataset.q)));
  addMsg('欢迎下潜。这里是 404 层，只有 ASCII 洋流和几条不愿意被看见的鲨鱼。','shark',420);
  addMsg('你可以移动鼠标，或者对水面说点什么。','shark',900);

  function splash(x,y,big){
    ripples.push({x,y,r:0,max:big?180:90,life:1});
    for(let i=0;i<(big?18:7);i++)ripples.push({x:x+rand(-8,8),y:y+rand(-8,8),r:rand(0,12),max:rand(20,big?110:55),life:1});
    for(let i=0;i<(big?18:8);i++){const fishN=fish[Math.floor(Math.random()*fish.length)];if(!fishN)continue;const dx=fishN.x-x,dy=fishN.y-y,d=Math.hypot(dx,dy)||1;if(d<260){fishN.vx+=dx/d*rand(20,65);fishN.vy+=dy/d*rand(20,65);}}
  }
  root.addEventListener('pointermove',e=>{
    const r=root.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=!e.target.closest('.as-chat');
    if(!pointer.active)return;
    const now=performance.now();if(now-pointer.lastRipple>110){pointer.lastRipple=now;ripples.push({x:pointer.x,y:pointer.y,r:0,max:rand(22,42),life:1});}
  });
  root.addEventListener('pointerleave',()=>{pointer.active=false});
  root.addEventListener('pointerdown',e=>{if(e.target.closest('.as-chat'))return;const r=root.getBoundingClientRect();splash(e.clientX-r.left,e.clientY-r.top,true);ctx.status && ctx.status('SPLASH');});

  function drawBackdrop(dt){
    g.clearRect(0,0,W,H);
    const bg=g.createRadialGradient(W*.52,H*.42,10,W*.52,H*.42,Math.max(W,H)*.72);
    bg.addColorStop(0,'#082638');bg.addColorStop(.48,'#041522');bg.addColorStop(1,'#02070c');
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.textBaseline='middle';
    const step=18;
    for(let y=0;y<H+step;y+=step){for(let x=0;x<W+step;x+=step){
      const w=Math.sin(x*.011+t*.35)+Math.cos(y*.016-t*.22)+Math.sin((x+y)*.008+t*.2);
      if(w<.35)continue;
      const a=.035+w*.035;
      g.fillStyle='rgba(124,225,247,'+a.toFixed(3)+')';
      g.font='600 '+(step*.62)+'px "JetBrains Mono",monospace';
      g.fillText(w>1.5?'.':'`',x+Math.sin(t*.4+y)*1.5,y+Math.cos(t*.3+x)*1.2);
    }}
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.r+=(r.max-r.r)*Math.min(1,dt*5.4);r.life-=dt*.75;if(r.life<=0){ripples.splice(i,1);continue;}
      g.globalAlpha=Math.max(0,r.life)*.36;g.strokeStyle='rgba(160,248,255,.75)';g.lineWidth=1;g.beginPath();g.arc(r.x,r.y,r.r,0,6.283);g.stroke();g.globalAlpha=1;
    }
  }

  function updateFish(dt){
    const flowX=(x,y)=>Math.sin(y*.008+t*.3)*7+9;
    const flowY=(x,y)=>Math.cos(x*.011+t*.24)*5;
    for(const f of fish){
      f.vx+=(flowX(f.x,f.y)-f.vx)*dt*.55;
      f.vy+=(flowY(f.x,f.y)-f.vy)*dt*.55;
      if(pointer.active){const dx=f.x-pointer.x,dy=f.y-pointer.y,d= Math.hypot(dx,dy);if(d<150&&d>1){const p=(150-d)/150;f.vx+=dx/d*p*260*dt;f.vy+=dy/d*p*260*dt;}}
      f.x+=f.vx*dt*P.SPEED;f.y+=f.vy*dt*P.SPEED;
      if(f.x<-28)f.x=W+28;if(f.x>W+28)f.x=-28;if(f.y<-18)f.y=H+18;if(f.y>H+18)f.y=-18;
      const a=f.a*(.62+.38*Math.sin(t*1.4+f.x*.04));
      g.fillStyle='rgba(167,242,255,'+a.toFixed(3)+')';
      g.font='600 '+(9+f.s*16).toFixed(1)+'px "JetBrains Mono",monospace';
      g.fillText(f.vx<0?f.g==='>'?'<':f.g:f.g,f.x,f.y);
      if(dt>0&&Math.random()<.0012){g.fillStyle='rgba(167,242,255,.18)';g.fillText('·',f.x-f.vx*.8,f.y+6);}
    }
  }

  function sharkPath(L,Hh){
    g.beginPath();
    g.moveTo(L*.5,0);
    g.bezierCurveTo(L*.36,-Hh*.8,L*.03,-Hh*.92,-L*.37,-Hh*.24);
    g.lineTo(-L*.5,-Hh*.58);g.lineTo(-L*.43,0);g.lineTo(-L*.5,Hh*.58);g.lineTo(-L*.37,Hh*.24);
    g.bezierCurveTo(L*.03,Hh*.92,L*.36,Hh*.8,L*.5,0);
    g.moveTo(-L*.14,-Hh*.52);g.lineTo(-L*.04,-Hh*1.22);g.lineTo(L*.14,-Hh*.55);g.closePath();
    g.moveTo(L*.07,Hh*.42);g.lineTo(-L*.03,Hh*1.02);g.lineTo(L*.23,Hh*.4);g.closePath();
  }
  function drawShark(s){
    const L=s.len,Hh=L*.17,dir=s.vx<0?-1:1;
    g.save();g.translate(s.x,s.y);g.rotate(Math.sin(t*.7+s.phase)*.035);g.scale(dir,1);
    g.beginPath();g.rect(-L*.56,-Hh*1.3,L*1.1,Hh*2.6);g.clip();
    sharkPath(L,Hh);
    g.save();g.clip();
    const step=Math.max(6,L*.032);
    for(let y=-Hh*1.24;y<=Hh*1.24;y+=step){for(let x=-L*.51;x<=L*.51;x+=step){
      const cx=x/L,cy=y/Hh;const light=clamp(0.92-cy*.22+Math.sin(cx*8+s.phase)*.12,0,1);
      const ch=SHARK_RAMP[clamp(Math.floor(light*(SHARK_RAMP.length-1)),0,SHARK_RAMP.length-1)];
      g.fillStyle='hsla('+(188+s.seed%18)+', 48%, '+(62+light*18)+'%, '+(.38+s.depth*.4)+')';
      g.font='600 '+step.toFixed(1)+'px "JetBrains Mono",monospace';
      g.fillText(ch,x+Math.sin(t*2+cx*7)*.8,y+Math.cos(t*1.7+cy*5)*.5);
    }}
    g.restore();
    g.strokeStyle='rgba(195,252,255,.3)';g.lineWidth=1;g.stroke();
    g.fillStyle='rgba(220,255,255,.9)';g.beginPath();g.arc(L*.32,-Hh*.22,Math.max(1.6,L*.008),0,6.283);g.fill();
    g.fillStyle='rgba(255,93,170,.9)';g.beginPath();g.arc(L*.32,-Hh*.22,Math.max(.8,L*.004),0,6.283);g.fill();
    g.restore();
    g.globalAlpha=.28;g.fillStyle='rgba(160,248,255,.8)';g.font='600 '+Math.max(7,L*.035)+'px "JetBrains Mono",monospace';
    for(let i=0;i<3;i++){const bx=s.x-dir*(L*.54+i*11),by=s.y+Math.sin(t*1.6+i+s.phase)*7;g.fillText(i?'·':'.',bx,by);}
    g.globalAlpha=1;
  }

  function updateSharks(dt){
    for(const s of sharks){
      s.x+=s.vx*dt*P.SPEED;s.y+=s.vy*dt*P.SPEED+Math.sin(t*.9+s.phase)*dt*4;
      if(s.x<-s.len*.7)s.x=W+s.len*.55;if(s.x>W+s.len*.7)s.x=-s.len*.55;
      if(s.y<H*.12)s.vy=Math.abs(s.vy);if(s.y>H*.86)s.vy=-Math.abs(s.vy);
      s.y+=Math.sin(t*.7+s.phase)*dt*2;
      drawShark(s);
    }
  }

  function frame(now){
    if(!running)return;
    const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;t+=dt;
    drawBackdrop(dt);
    updateFish(dt);
    updateSharks(dt);
    raf=requestAnimationFrame(frame);
  }
  const ro=new ResizeObserver(resize);ro.observe(root);resize();
  raf=requestAnimationFrame(frame);
  const demoTimer=ctx.auto?setInterval(()=>{addMsg(facts[factI++%facts.length],'shark');},5200):0;
  return()=>{running=false;cancelAnimationFrame(raf);ro.disconnect();if(demoTimer)clearInterval(demoTimer)};
}});
