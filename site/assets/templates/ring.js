/* ─── 7 Rotating Gallery ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'ring',name:'Rotating Gallery',cat:'Gallery',mat:'景深',
spell:'一圈图板只靠 translateZ 的景深转动；最前面的一张从灰变彩色；点 GRID，同一批卡片飞进网格。',core:'不旋转，只改变远近',tags:['Gallery','3D','Depth','Flip'],
credit:{n:'Rotating Gallery',u:'https://carterogunsola.com/lab/rotating-gallery'},
notes:['这里没有任何卡片在旋转。每张卡沿一个圆走 translateZ，在很深的透视下（4000）靠远近产生大小变化，所以永远不会转成侧面消失。','当前卡片是 round(−角度/每格角度)。不是当前的卡片灰度化，到最前面时用指数缓出绽放成彩色。','切到网格时，不是淡入另一套图，而是同一批卡片节点被搬进网格容器，用 FLIP 从原位置飞到新位置；延迟按“离你正在看的那张的距离”计算，所以动画从那一张向外扩散。','自动漂移很慢（4°/s），甩动产生的动量逐渐衰减，最后漂移接管。'],
knobs:[{k:'AUTO_SPEED',label:'AUTO_SPEED °/s',v:4,min:0,max:30,step:.5},{k:'PERSPECTIVE',label:'PERSPECTIVE',v:4000,min:800,max:8000,step:100},{k:'TILT',label:'TILT 倾斜',v:.1,min:0,max:.3,step:.01},{k:'DECAY',label:'DECAY 动量衰减',v:1.3,min:.4,max:4,step:.1},{k:'FLIP_DUR',label:'FLIP_DUR s',v:1.1,min:.4,max:2.2,step:.1}],
css:`.rg{--cw:200px;--ch:250px}
.rg-scene{position:absolute;inset:0;transform-style:preserve-3d;touch-action:none;cursor:grab}
.rg-card{position:absolute;left:50%;top:46%;width:var(--cw);height:var(--ch);margin:calc(var(--ch)/-2) 0 0 calc(var(--cw)/-2);transform-origin:0 0;border-radius:4px;overflow:hidden;background:#222;will-change:transform}
.rg-card::after{content:'';position:absolute;inset:0;background:#000;opacity:var(--d,0);pointer-events:none}
.rg-ph{position:absolute;inset:0;background-size:cover;background-position:center;filter:grayscale(1) contrast(.92);transition:filter .9s cubic-bezier(.16,1,.3,1)}
.rg-card.on .rg-ph{filter:none}
.rg-n{position:absolute;left:10px;top:8px;font:10px var(--mono);color:#fff;mix-blend-mode:difference}
.rg-t{position:absolute;left:10px;right:10px;bottom:9px;font-size:13px;line-height:1.25;color:#fff;font-weight:600;text-shadow:0 1px 8px #0008}
.rg-grid{position:absolute;inset:0;padding:56px 5% 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;align-content:center;overflow:auto}
.rg-grid[hidden]{display:none}
.rg.is-grid .rg-card{position:relative;left:auto;top:auto;width:auto;height:auto;margin:0;aspect-ratio:4/5}
.rg.is-grid .rg-ph{filter:none}
.rg-btn{position:absolute;right:14px;top:14px;z-index:3;font:11px var(--mono);padding:6px 12px;border:1px solid currentColor;border-radius:99px;color:var(--st-ink)}
.rg-meta{position:absolute;left:16px;bottom:14px;pointer-events:none}
.rg-meta b{display:block;font-size:15px;letter-spacing:-.01em}.rg-meta span{font:10px var(--mono);opacity:.6}
.rg.is-grid .rg-meta{display:none}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items,N=items.length,SL=360/N;
  h.innerHTML=`<div class="stg rg"><div class="rg-scene"></div><div class="rg-grid" hidden></div><button class="rg-btn">GRID</button><div class="rg-meta"><b></b><span></span></div></div>`;
  const root=$('.rg',h),scene=$('.rg-scene',h),grid=$('.rg-grid',h),btn=$('.rg-btn',h),mt=$('.rg-meta b',h),ms=$('.rg-meta span',h);
  const W=root.clientWidth,H=root.clientHeight,cw=Math.round(Math.min(H*.4,W*.17)),chh=Math.round(cw*1.25),RAD=cw*2.8;
  root.style.setProperty('--cw',cw+'px');root.style.setProperty('--ch',chh+'px');
  const cards=items.map((it,i)=>{const c=el('div','rg-card',`<div class="rg-ph" style="background-image:url(${posterURL(i,300,375)})"></div><span class="rg-n">${pad(i+1)}</span><span class="rg-t">${esc(it.title)}</span>`);scene.appendChild(c);return c});
  let ang=0,tgt=0,vel=0,dragging=false,mode='ring',flipping=false,active=-1,prevA=0;
  const setPersp=()=>{scene.style.perspective=P.PERSPECTIVE+'px';scene.style.perspectiveOrigin='50% 40%'};
  const ringT=(i,a)=>{const th=(i*SL+a)*Math.PI/180,x=Math.sin(th)*RAD,z=(Math.cos(th)-1)*RAD,y=z*P.TILT;return`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px)`};
  const layout=a=>{cards.forEach((c,i)=>{c.style.transform=ringT(i,a);const cs=Math.cos((i*SL+a)*Math.PI/180);c.style.setProperty('--d',(.78*(1-(cs+1)/2)).toFixed(3))});const act=mod(Math.round(-a/SL),N);if(act!==active){active=act;cards.forEach((c,i)=>c.classList.toggle('on',i===act));mt.textContent=items[act].title;ms.textContent=`N°${pad(act+1)} · ${items[act].kind}`;ctx.focus(act)}};
  const stop=ticker(dt=>{
    setPersp();
    if(mode==='ring'&&!flipping){
      prevA=ang;
      if(dragging)ang=damp(ang,tgt,8,dt);else{vel*=Math.exp(-P.DECAY*dt);ang+=(vel+P.AUTO_SPEED)*dt;tgt=ang}
      if(dragging)vel=(ang-prevA)/dt;
      layout(ang);
    }
  });
  let lx=0;
  scene.addEventListener('pointerdown',e=>{if(mode!=='ring')return;dragging=true;tgt=ang;lx=e.clientX;scene.setPointerCapture(e.pointerId)});
  scene.addEventListener('pointermove',e=>{if(!dragging)return;tgt+=(e.clientX-lx)*.3;lx=e.clientX});
  const up=()=>{dragging=false};scene.addEventListener('pointerup',up);scene.addEventListener('pointercancel',up);
  scene.addEventListener('wheel',e=>{e.preventDefault();vel+=e.deltaY*.3},{passive:false});
  function flipTo(next){
    if(flipping||next===mode)return;flipping=true;ctx.status('FLIP');
    const act=active,first=cards.map(c=>c.getBoundingClientRect());
    if(next==='grid'){grid.hidden=false;cards.forEach(c=>{c.style.transform='';grid.appendChild(c)})}
    else{ang=tgt=-act*SL;vel=0;cards.forEach(c=>scene.appendChild(c));layout(ang)}
    root.classList.toggle('is-grid',next==='grid');if(next==='grid')cards.forEach(c=>c.style.setProperty('--d',0));
    const last=cards.map(c=>c.getBoundingClientRect()),ac=last[act],anims=[];
    cards.forEach((c,i)=>{const f=first[i],l=last[i],dx=f.left-l.left,dy=f.top-l.top,sx=f.width/l.width,sy=f.height/l.height;
      const dist=Math.hypot((l.left+l.width/2)-(ac.left+ac.width/2),(l.top+l.height/2)-(ac.top+ac.height/2)),delay=clamp(dist/W*.9,0,.6);
      const end=next==='ring'?c.style.transform:'none',start=`translate(${dx}px,${dy}px) scale(${sx},${sy})`+(next==='ring'?' '+c.style.transform:'');
      anims.push(c.animate([{transform:start},{transform:end}],{duration:P.FLIP_DUR*1000,delay:delay*1000,easing:'cubic-bezier(.68,-.55,.27,1.55)',fill:'backwards'}).finished)});
    Promise.all(anims).then(()=>{mode=next;if(next==='ring')grid.hidden=true;btn.textContent=next==='grid'?'RING':'GRID';flipping=false;ctx.status(next==='grid'?'GRID':'RING')}).catch(()=>{flipping=false});
    mode=next==='ring'?'ring':'grid';
  }
  btn.addEventListener('click',()=>flipTo(mode==='ring'?'grid':'ring'));
  cards.forEach((c,i)=>c.addEventListener('click',()=>{if(mode==='grid'&&!flipping){active=i;flipTo('ring')}}));
  ctx.demo(()=>flipTo(mode==='ring'?'grid':'ring'),7000);
  ctx.status('RING');
  return stop;
}});
