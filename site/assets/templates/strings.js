/* ─── 15 Rubber Strings ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'strings',name:'Rubber Strings',cat:'Interaction',mat:'橡皮弦',
spell:'指针划过一根线 → 它被拨动并来回振荡；按住拖拽 → 拉成弓形，松手弹回。',core:'分隔线也可以是乐器',tags:['Interaction','SVG','Spring','Drag','Sound'],
credit:{n:'Design Spells',u:'https://designspells.com/',own:1},
notes:['每根线只记两个数：中点偏移 o 和速度 v，每帧按弹簧 a = −K·o − D·v 积分（K 是 TENSION，D 是 DAMP）。','路径是一条二次贝塞尔曲线，控制点跟着“你拨的位置”走，所以拨在左边和拨在右边，弓形的峰值位置不同。','不按下去也能拨：检测指针这一帧是否穿过了线，穿过就把指针的垂直速度变成线的初速，并播放一声咔哒。','按住时线完全跟着指针，不做弹簧；松手的一瞬间，偏移还在，弹簧接手。'],
knobs:[{k:'TENSION',label:'TENSION 张力',v:220,min:60,max:600,step:10},{k:'DAMP',label:'DAMP 阻尼',v:4.5,min:1,max:14,step:.5},{k:'PLUCK',label:'PLUCK 拨力',v:.4,min:.1,max:1,step:.05},{k:'STRINGS',label:'线数',v:7,min:3,max:14,step:1,remount:true}],
css:`.rs{cursor:grab;touch-action:none}.rs svg{position:absolute;inset:0;width:100%;height:100%}
.rs path{fill:none;stroke:var(--st-ink);stroke-width:2.2;stroke-linecap:round}.rs circle{fill:var(--st-ink)}
.rs-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P,N=Math.round(P.STRINGS);
  h.innerHTML=`<div class="stg rs"><svg></svg><div class="rs-cap">划过 · 按住拖拽</div></div>`;
  const root=$('.rs',h),svg=$('svg',h),W=root.clientWidth,H=root.clientHeight,gy=H/(N+1),NS='http://www.w3.org/2000/svg';
  const S=[];for(let i=0;i<N;i++){const y=gy*(i+1),p=document.createElementNS(NS,'path');svg.appendChild(p);[18,W-18].forEach(x=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',4);svg.appendChild(c)});S.push({y,o:0,v:0,cx:W/2,p,side:0})}
  let px=0,py=0,ppy=0,pvy=0,lt=performance.now(),grab=null;
  const loc=e=>{const r=root.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  const pluck=(s,x,v)=>{s.cx=clamp(x,40,W-40);s.v+=clamp(v,-900,900);clickSound(Math.abs(v)*.6,.5)};
  root.addEventListener('pointerdown',e=>{audioReady();[px,py]=loc(e);ppy=py;let best=null,bd=gy*.5;S.forEach(s=>{const d=Math.abs(py-s.y);if(d<bd){bd=d;best=s}});if(best){grab=best;grab.cx=clamp(px,40,W-40);grab.v=0;root.setPointerCapture(e.pointerId);root.style.cursor='grabbing'}});
  root.addEventListener('pointermove',e=>{const now=performance.now(),dt=Math.max(1,now-lt);lt=now;[px,py]=loc(e);pvy=pvy*.5+((py-ppy)/dt*1000)*.5;
    if(grab){grab.cx=clamp(px,40,W-40);grab.o=clamp(py-grab.y,-gy*2.4,gy*2.4);grab.v=0}
    else S.forEach(s=>{const a=ppy-s.y,b=py-s.y;if(a*b<0&&px>20&&px<W-20)pluck(s,px,pvy*P.PLUCK)});
    ppy=py});
  const rel=()=>{grab=null;root.style.cursor=''};root.addEventListener('pointerup',rel);root.addEventListener('pointercancel',rel);
  const stop=ticker(dt=>{
    S.forEach(s=>{if(s!==grab){s.v+=(-P.TENSION*s.o-P.DAMP*s.v)*dt;s.o+=s.v*dt}
      s.p.setAttribute('d',`M18 ${s.y}Q${s.cx} ${s.y+2*s.o} ${W-18} ${s.y}`)});
  });
  ctx.demo(()=>{const s=S[Math.floor(Math.random()*N)];pluck(s,W*(.2+Math.random()*.6),(Math.random()<.5?-1:1)*(600+Math.random()*300))},700);
  ctx.status('IDLE');
  return stop;
}});
