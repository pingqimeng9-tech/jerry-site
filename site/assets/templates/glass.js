/* ─── 17 Liquid Glass ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'glass',name:'Liquid Glass',cat:'Glass',mat:'玻璃',
spell:'一颗玻璃珠跟着指针走 → 身后的色块和文字被磨砂并提亮；动得越快，它越被拉成水滴。',core:'材质靠“背后的东西”才成立',tags:['Glass','CSS','backdrop-filter','Pointer'],
credit:{n:'Skillry · Liquid Glass Landing（风格方向）',u:'https://skillry.dev/',own:1},
notes:['玻璃本身几乎没有“内容”，只是 backdrop-filter：把它背后的像素模糊（BLUR）、提高饱和度和亮度。所以背后必须有颜色和字，否则什么也看不出来。','边缘用 inset box-shadow 做一圈亮边，顶部再叠一道更亮的内阴影，模拟厚度。','高光是一个径向渐变，圆心随速度反向偏移：往右甩时，高光滞后到左边，像光在液面上晃。','形变：沿速度方向拉长（scale 1+k）、垂直方向压扁（1−0.55k），再转回去，k 随速度增加，静止时恢复正圆。'],
knobs:[{k:'SIZE',label:'SIZE 直径',v:150,min:80,max:300,step:5},{k:'BLUR',label:'BLUR 磨砂 px',v:4,min:0,max:16,step:.5},{k:'STRETCH',label:'STRETCH 拉伸',v:1,min:0,max:2.5,step:.1},{k:'LAMBDA',label:'λ 跟随',v:10,min:3,max:30,step:1}],
css:`.gl{background:#14151a;cursor:none;touch-action:none;color:#fff}
.gl-bl{position:absolute;border-radius:50%;filter:blur(36px);animation:gldrift 12s ease-in-out infinite alternate}
.gl-bl:nth-child(1){width:46%;height:70%;left:-6%;top:-12%;background:#ff5a36}
.gl-bl:nth-child(2){width:40%;height:60%;right:-4%;top:6%;background:#3b5bff;animation-delay:-4s}
.gl-bl:nth-child(3){width:38%;height:52%;left:30%;bottom:-18%;background:#19c37d;animation-delay:-8s}
.gl-bl:nth-child(4){width:24%;height:36%;right:22%;bottom:4%;background:#ffc233;animation-delay:-2s}
@keyframes gldrift{to{transform:translate(16%,10%) scale(1.18)}}
.gl-tx{position:absolute;inset:0;display:grid;place-content:center;text-align:center;font-size:clamp(54px,15vw,190px);font-weight:700;letter-spacing:-.06em;line-height:.9;pointer-events:none}
.gl-tx span{display:block}.gl-tx span+span{color:transparent;-webkit-text-stroke:2px #fff}
.gl-lens{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;will-change:transform;-webkit-backdrop-filter:blur(var(--bl,4px)) saturate(1.9) brightness(1.14);backdrop-filter:blur(var(--bl,4px)) saturate(1.9) brightness(1.14);background:linear-gradient(135deg,#ffffff30,#ffffff08);box-shadow:inset 0 0 0 1px #ffffff5c,inset 0 10px 18px #ffffff40,inset 0 -12px 22px #ffffff1a,0 16px 40px #0007}
.gl-lens::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at var(--hx,32%) var(--hy,24%),#ffffffd8,#fff0 36%)}
@media(prefers-reduced-motion:reduce){.gl-bl{animation:none}}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg gl"><div class="gl-bl"></div><div class="gl-bl"></div><div class="gl-bl"></div><div class="gl-bl"></div><div class="gl-tx"><span>Liquid</span><span>glass</span></div><div class="gl-lens"></div></div>`;
  const root=$('.gl',h),lens=$('.gl-lens',h);
  let W=root.clientWidth,H=root.clientHeight,tx=W/2,ty=H/2,x=tx,y=ty,t0=0;
  const set=e=>{const r=root.getBoundingClientRect();tx=e.clientX-r.left;ty=e.clientY-r.top};
  root.addEventListener('pointermove',set);root.addEventListener('pointerdown',set);
  const stop=ticker(dt=>{
    t0+=dt;if(ctx.auto){tx=W*(.5+.3*Math.sin(t0*.9));ty=H*(.5+.26*Math.sin(t0*1.4+.6))}
    const k=1-Math.exp(-P.LAMBDA*dt),ox=x,oy=y;x+=(tx-x)*k;y+=(ty-y)*k;
    const vx=(x-ox)/dt,vy=(y-oy)/dt,sp=Math.hypot(vx,vy),a=Math.atan2(vy,vx)*180/Math.PI,s=clamp(sp/2400*P.STRETCH,0,.5),S=P.SIZE;
    lens.style.width=lens.style.height=S+'px';lens.style.setProperty('--bl',P.BLUR+'px');
    lens.style.setProperty('--hx',clamp(32-vx/50,12,60)+'%');lens.style.setProperty('--hy',clamp(24-vy/50,10,50)+'%');
    lens.style.transform=`translate(${x-S/2}px,${y-S/2}px) rotate(${a}deg) scale(${1+s},${1-s*.55}) rotate(${-a}deg)`;
    ctx.status(sp>200?'FLOW '+Math.round(sp):'IDLE');
  });
  return stop;
}});
