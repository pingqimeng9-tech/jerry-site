/* ─── 3 Polka Dots ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'dots',name:'Polka Dots',cat:'Canvas',mat:'弹簧',
spell:'指针穿过点阵 → 圆点被推开、变大变黑；点一下，涟漪扩散。',core:'整片点阵只跑一个循环',tags:['Canvas','Physics','Spring','Pointer'],
credit:{n:'Polka Dots',u:'https://carterogunsola.com/lab/polka-dots'},
notes:['每个点只做三件事：被弹簧拉回自己的格子（SPRING）、被附近的东西推开、被摩擦（FRICTION）带走一部分速度，所以最后会停下，而不是一直晃。','不为每个点建动画。整片点阵是一个循环里的一次积分，一次画到 canvas 上，几千个点也不吃力。','指针同时做两件事：推开（范围 REPEL_R，速度越快推得越狠）和“绽放”（越近越大、越深）。点一下，一圈波环以固定速度向外扩，经过的点被推一下。','静止时用两个正弦波轻轻移动每个点的“家”，让点阵始终在呼吸。'],
knobs:[{k:'SPRING',label:'SPRING 回弹',v:.055,min:.01,max:.15,step:.005},{k:'FRICTION',label:'FRICTION 摩擦',v:.82,min:.6,max:.95,step:.01},{k:'REPEL_R',label:'REPEL_R 推开半径',v:116,min:40,max:260,step:2},{k:'PUSH',label:'PUSH 推力',v:1,min:0,max:3,step:.1},{k:'BLOOM',label:'BLOOM 绽放',v:1,min:0,max:2,step:.1},{k:'GAP',label:'点间距',v:22,min:12,max:40,step:1,remount:true}],
css:`.pd{cursor:crosshair}.pd canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.pd-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg pd"><canvas></canvas><div class="pd-cap">移动 · 点击</div></div>`;
  const root=$('.pd',h),cv=$('canvas',h),c=cv.getContext('2d');
  const dpr=(EMBED&&EMBED.auto?1:Math.min(devicePixelRatio||1,2)),W=root.clientWidth,H=root.clientHeight;cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const gap=Math.round(P.GAP),cols=Math.ceil(W/gap)+1,rows=Math.ceil(H/gap)+1,dots=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=i*gap+(W-(cols-1)*gap)/2,y=j*gap+(H-(rows-1)*gap)/2;dots.push({hx:x,hy:y,x,y,vx:0,vy:0})}
  let px=-999,py=-999,pvx=0,pvy=0,lastP=performance.now(),ink=inkRGB(),inkT=0,ripples=[],virt=0;
  const move=(x,y)=>{const now=performance.now(),dt=Math.max(1,now-lastP);pvx=pvx*.6+((x-px)/dt*1000)*.4;pvy=pvy*.6+((y-py)/dt*1000)*.4;px=x;py=y;lastP=now;virt=0};
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();move(e.clientX-r.left,e.clientY-r.top)});
  root.addEventListener('pointerleave',()=>{px=py=-999});
  root.addEventListener('pointerdown',e=>{const r=root.getBoundingClientRect();ripples.push({x:e.clientX-r.left,y:e.clientY-r.top,t:0})});
  let tt=0;
  const stop=ticker((dt,now)=>{
    tt+=dt;inkT+=dt;if(inkT>.5){inkT=0;ink=inkRGB()}
    if(ctx.auto){const t=tt;move(W*(.5+.38*Math.sin(t*.9)),H*(.5+.36*Math.sin(t*1.37+1)));virt=1;if(Math.floor(t/2.6)!==Math.floor((t-dt)/2.6))ripples.push({x:px,y:py,t:0})}
    const f=dt*60,fr=Math.pow(P.FRICTION,f),sp=Math.min(1,P.SPRING*f),R=P.REPEL_R,speed=Math.hypot(pvx,pvy);
    pvx*=Math.pow(.9,f);pvy*=Math.pow(.9,f);
    ripples.forEach(r=>r.t+=dt);ripples=ripples.filter(r=>r.t<2.4);
    c.clearRect(0,0,W,H);
    for(const d of dots){
      const hx=d.hx+Math.sin(d.hy*.02+tt*.8)*2,hy=d.hy+Math.sin(d.hx*.02+tt*.7)*2;
      let bloom=0;
      const dx=d.x-px,dy=d.y-py,dist=Math.hypot(dx,dy);
      if(dist<R){const k=1-dist/R;bloom=k;const push=k*k*P.PUSH*(.5+Math.min(2.5,speed/500))*1.6;d.vx+=dx/(dist||1)*push*f;d.vy+=dy/(dist||1)*push*f}
      for(const r of ripples){const rx=d.x-r.x,ry=d.y-r.y,rd=Math.hypot(rx,ry),edge=620*r.t,w=46;const e=Math.abs(rd-edge);if(e<w){const k=(1-e/w)*Math.max(0,1-r.t/2.2)*2.2*P.PUSH;d.vx+=rx/(rd||1)*k*f;d.vy+=ry/(rd||1)*k*f;bloom=Math.max(bloom,(1-e/w)*.6)}}
      d.vx+=(hx-d.x)*sp;d.vy+=(hy-d.y)*sp;d.vx*=fr;d.vy*=fr;d.x+=d.vx*f;d.y+=d.vy*f;
      const b=bloom*P.BLOOM,r=1.5*(1+2*b),a=Math.min(1,.2+.8*b);
      c.fillStyle=`rgba(${ink[0]},${ink[1]},${ink[2]},${a})`;c.beginPath();c.arc(d.x,d.y,r,0,6.2832);c.fill();
    }
  });
  ctx.status('IDLE');
  return stop;
}});
