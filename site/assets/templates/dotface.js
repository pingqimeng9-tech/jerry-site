/* ─── 20 Dot Avatar ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'dotface',name:'Dot Avatar',cat:'Canvas',mat:'点阵',
spell:'一张只由圆点组成的脸 → 眼睛盯着你的指针，靠近时会笑，点一下眨眼。',core:'头像也是一张会回应的场',tags:['Canvas','Dots','Face','Pointer'],
credit:{n:'Skillry · Dot Avatar Maker（风格方向）',u:'https://skillry.dev/',own:1},
notes:['没有图片。脸是几个简单形状的有向距离（头、肩、眼窝、嘴），每个点取它到形状边界的距离，换算成 0–1 的“覆盖度”，覆盖度就是点的半径。','眼睛是挖掉的洞，里面再放一颗更小的瞳孔，瞳孔朝指针方向偏移（LOOK 控制范围）；头整体也向指针微微偏。','嘴是一条抛物线：弧度 = 基础笑意 + 指针越近越大 + 点击时的脉冲。眨眼是把眼洞的纵向压到 8%。','点阵背景留了一圈很淡的小点，让“没有被填充”的地方也有纹理。'],
knobs:[{k:'GAP',label:'点间距',v:12,min:7,max:22,step:1,remount:true},{k:'LOOK',label:'LOOK 视线范围',v:1,min:0,max:2,step:.1},{k:'SMILE',label:'SMILE 笑意',v:1,min:0,max:2,step:.1}],
css:`.df{cursor:crosshair}.df canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.df-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg df"><canvas></canvas><div class="df-cap">看着它 · 靠近 · 点击</div></div>`;
  const root=$('.df',h),cv=$('canvas',h),c=cv.getContext('2d');
  const dpr=Math.min(devicePixelRatio||1,2),W=root.clientWidth,H=root.clientHeight;cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const gap=Math.round(P.GAP),cols=Math.ceil(W/gap)+1,rows=Math.ceil(H/gap)+1,ox=(W-(cols-1)*gap)/2,oy=(H-(rows-1)*gap)/2;
  const s=Math.min(W,H),R=s*.3,cx0=W/2,cy0=H*.44;
  let px=W/2,py=H/2,lx=0,ly=0,hx=0,hy=0,smile=.08,pulse=0,blink=0,nextBlink=2,t0=0,ink=inkRGB(),inkT=0;
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top});
  root.addEventListener('pointerdown',()=>{pulse=1;blink=.18;ctx.status('WINK')});
  const cov=d=>clamp(.5-d/gap,0,1);
  const stop=ticker(dt=>{
    t0+=dt;inkT+=dt;if(inkT>.5){inkT=0;ink=inkRGB()}
    if(ctx.auto){px=W*(.5+.38*Math.sin(t0*.9));py=H*(.45+.36*Math.sin(t0*1.3+1))}
    const k=1-Math.exp(-12*dt);
    const dxp=px-cx0,dyp=py-cy0,dist=Math.hypot(dxp,dyp)||1,ux=dxp/dist,uy=dyp/dist,near=clamp(1-dist/(s*.55),0,1);
    lx+=(ux*clamp(dist/(s*.4),0,1)-lx)*k;ly+=(uy*clamp(dist/(s*.4),0,1)-ly)*k;hx+=(lx*R*.07-hx)*k;hy+=(ly*R*.05-hy)*k;
    pulse=Math.max(0,pulse-dt*1.8);smile+=((.08+near*.2*P.SMILE+pulse*.12)*R-smile)*k;
    if(blink>0)blink-=dt;else if(t0>nextBlink){blink=.14;nextBlink=t0+2+Math.random()*3}
    const bl=blink>0?.08:1;
    const hcx=cx0+hx,hcy=cy0+hy,ex=R*.38,ey=hcy-R*.08,er=R*.21,pr=R*.09,pOff=R*.09*P.LOOK,mx=hcx,my=hcy+R*.42,hw=R*.36,th=R*.055;
    const e1=hcx-ex,e2=hcx+ex,p1x=e1+lx*pOff,p2x=e2+lx*pOff,py2=ey+ly*pOff*bl;
    c.clearRect(0,0,W,H);
    for(let j=0;j<rows;j++){const y=oy+j*gap;for(let i=0;i<cols;i++){const x=ox+i*gap;
      let f=Math.max(cov(Math.hypot(x-hcx,y-hcy)-R),cov(Math.hypot((x-cx0)/(R*1.55),(y-(cy0+R*1.95))/(R*.95))*R*.95-R*.95));
      const de=(ax)=>Math.hypot(x-ax,(y-ey)/bl)-er;
      let hole=Math.max(cov(de(e1)),cov(de(e2)));
      const t=(x-mx)/hw;if(Math.abs(t)<1.08){const cy=my+smile*(1-t*t)*1.0,dm=Math.abs(y-cy)-th;hole=Math.max(hole,cov(dm)*clamp((1.08-Math.abs(t))*14,0,1))}
      let v=f*(1-hole);
      v=Math.max(v,cov(Math.hypot(x-p1x,y-py2)-pr)*hole,cov(Math.hypot(x-p2x,y-py2)-pr)*hole);
      const r=v>.02?gap*.5*Math.pow(v,.8):.9,a=v>.02?1:.22;
      c.fillStyle=`rgba(${ink[0]},${ink[1]},${ink[2]},${a})`;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill()}}
  });
  ctx.status('IDLE');
  return stop;
}});
