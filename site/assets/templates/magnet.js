/* ─── 14 Magnetic Pills ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'magnet',name:'Magnetic Pills',cat:'Micro',mat:'磁力',
spell:'指针靠近 → 按钮朝你伸过来，里面的字比按钮走得更远一点。',core:'按钮在“迎接”你，而不是等你',tags:['Micro','Pointer','Spring','Hover'],
credit:{n:'Design Spells',u:'https://designspells.com/',own:1},
notes:['每个按钮每帧算一次到指针的距离。进入 RADIUS 之后，位移 = 指针方向 × 距离衰减 × PULL，越近拉得越用力。','里面的文字额外再走 INNER 倍的位移，外壳和文字的“视差”就是磁力的质感。','位移不直接赋值，而是用时间无关的阻尼 1−e^(−λ·dt) 追过去，松开指针后会自己慢慢回位。','没有指针（触屏或手机）时，用一个虚拟指针绕场飞行，所以画廊里的小窗也在动。'],
knobs:[{k:'RADIUS',label:'RADIUS 感应半径',v:150,min:60,max:300,step:5},{k:'PULL',label:'PULL 拉力',v:.5,min:.1,max:1,step:.05},{k:'INNER',label:'INNER 文字视差',v:.55,min:0,max:1.5,step:.05},{k:'LAMBDA',label:'λ 跟随',v:14,min:4,max:40,step:1}],
css:`.mg{cursor:none}
.mg-g{position:absolute;inset:12% 8%;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:12px}
.mg-c{display:grid;place-items:center}
.mg-b{padding:14px 26px;border-radius:99px;border:1.5px solid color-mix(in srgb,var(--st-ink) 55%,transparent);font-size:clamp(14px,2.2vw,20px);letter-spacing:-.01em;will-change:transform;text-align:center}
.mg-b span{display:block;will-change:transform}
.mg-dot{position:absolute;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--st-ink);pointer-events:none;will-change:transform}`,
mount(h,ctx){
  const P=ctx.P,L=['Read','Play','Save','Share','Try it','Copy'];
  h.innerHTML=`<div class="stg mg"><div class="mg-g">${L.map(l=>`<div class="mg-c"><button class="mg-b"><span>${l}</span></button></div>`).join('')}</div><i class="mg-dot"></i></div>`;
  const root=$('.mg',h),dot=$('.mg-dot',h),cells=[...h.querySelectorAll('.mg-c')].map(n=>({n,b:$('.mg-b',n),s:$('span',n),x:0,y:0}));
  let px=-999,py=-999,dx=-999,dy=-999,t0=0;
  const set=e=>{const r=root.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;if(dx<-900){dx=px;dy=py}};
  root.addEventListener('pointermove',set);root.addEventListener('pointerdown',set);root.addEventListener('pointerleave',()=>{px=py=-999});
  const stop=ticker(dt=>{
    t0+=dt;const W=root.clientWidth,H=root.clientHeight,rr=root.getBoundingClientRect();
    if(ctx.auto){px=W*(.5+.4*Math.sin(t0*.8));py=H*(.5+.34*Math.sin(t0*1.3+1));if(dx<-900){dx=px;dy=py}}
    const k=1-Math.exp(-P.LAMBDA*dt);
    if(px>-900){dx+=(px-dx)*k;dy+=(py-dy)*k}
    dot.style.transform=`translate(${dx}px,${dy}px)`;dot.style.opacity=px>-900?1:0;
    let near=-1,nd=1e9;
    cells.forEach((c,i)=>{const r=c.n.getBoundingClientRect(),cx=r.left-rr.left+r.width/2,cy=r.top-rr.top+r.height/2,d=Math.hypot(px-cx,py-cy);
      let tx=0,ty=0,f=0;if(px>-900&&d<P.RADIUS){f=1-d/P.RADIUS;tx=(px-cx)*P.PULL*f*1.6;ty=(py-cy)*P.PULL*f*1.6;if(d<nd){nd=d;near=i}}
      c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k;
      c.b.style.transform=`translate(${c.x}px,${c.y}px) scale(${1+.08*f})`;c.s.style.transform=`translate(${c.x*P.INNER}px,${c.y*P.INNER}px)`;
      c.b.style.background=f>.55?'var(--st-ink)':'transparent';c.b.style.color=f>.55?'var(--st-bg)':'inherit'});
    ctx.status(near>=0?'PULL '+L[near].toUpperCase():'IDLE');
  });
  return stop;
}});
