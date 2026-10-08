/* ─── 18 Mask Reveal ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'reveal',name:'Mask Reveal',cat:'Motion',mat:'遮罩',
spell:'标题逐字从遮罩下升起；之后一束聚光跟着指针，把空心字填成实心。',core:'一次入场 + 一次由人触发的揭示，其余静止',tags:['Motion','Text','Mask','CSS'],
credit:{n:'Skillry · Minimal Motion Hero（风格方向）',u:'https://skillry.dev/',own:1},
notes:['每个字符套两层：外层 overflow:hidden 当遮罩，内层从 translateY(110%) 升到 0。字符的延迟 = 序号 × STAGGER，整行就有了波浪感。','聚光是同一段文字的第二层：描边层在下，实心层在上，上层只用 mask-image 的径向渐变露出指针附近。','半径不是瞬间变化：指针进入时 --r 阻尼到 RADIUS，离开时收回 0，所以聚光“长出来”和“缩回去”。','点击任意处重播入场动画。尊重 prefers-reduced-motion：开启时直接显示。'],
knobs:[{k:'STAGGER',label:'STAGGER 错开 ms',v:45,min:10,max:140,step:5},{k:'DUR',label:'DUR 单字时长 ms',v:900,min:300,max:1800,step:50},{k:'RADIUS',label:'RADIUS 聚光半径',v:130,min:50,max:300,step:5}],
css:`.rv{display:grid;place-items:center;cursor:crosshair}
.rv-in{position:relative;font-size:clamp(44px,11.5vw,140px);font-weight:600;letter-spacing:-.05em;line-height:.95;text-align:center}
.rv-l{display:block}.rv-line{display:block;white-space:nowrap}
.rv-base{color:transparent;-webkit-text-stroke:1.3px color-mix(in srgb,var(--st-ink) 70%,transparent)}
.rv-top{position:absolute;inset:0;color:var(--st-ink);-webkit-mask-image:radial-gradient(circle var(--r,0px) at var(--mx,50%) var(--my,50%),#000 96%,#0000);mask-image:radial-gradient(circle var(--r,0px) at var(--mx,50%) var(--my,50%),#000 96%,#0000)}
.rv-ch{display:inline-block;overflow:hidden;vertical-align:top;padding:.06em 0 .14em;margin:-.06em 0 -.14em}
.rv-ch i{display:inline-block;font-style:normal;transform:translateY(112%)}
.rv.play .rv-ch i{animation:rvup var(--d,900ms) var(--io) both;animation-delay:calc(var(--n)*var(--s,45ms))}
@keyframes rvup{from{transform:translateY(112%)}to{transform:none}}
.rv-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}
@media(prefers-reduced-motion:reduce){.rv-ch i{transform:none!important;animation:none!important}}`,
mount(h,ctx){
  const P=ctx.P,lines=['Move with','intent.'];let n=0;
  const build=()=>lines.map(l=>`<span class="rv-line">${[...l].map(ch=>ch===' '?'<span class="rv-sp">&nbsp;</span>':`<span class="rv-ch"><i style="--n:${n++}">${ch}</i></span>`).join('')}</span>`).join('');
  const a=build();n=0;const b=build();
  h.innerHTML=`<div class="stg rv"><div class="rv-in"><span class="rv-l rv-base" aria-hidden="true">${a}</span><span class="rv-l rv-top" aria-label="Move with intent.">${b}</span></div><div class="rv-cap">移动指针 · 点击重播</div></div>`;
  const root=$('.rv',h),inn=$('.rv-in',h);
  root.style.setProperty('--s',P.STAGGER+'ms');root.style.setProperty('--d',P.DUR+'ms');
  const play=()=>{root.classList.remove('play');void root.offsetWidth;root.classList.add('play');ctx.status('PLAY')};
  play();root.addEventListener('pointerdown',play);
  let tx=-999,ty=-999,mx=0,my=0,r=0,t0=0,inside=false;
  root.addEventListener('pointermove',e=>{const q=inn.getBoundingClientRect();tx=e.clientX-q.left;ty=e.clientY-q.top;inside=true;if(r<2){mx=tx;my=ty}});
  root.addEventListener('pointerleave',()=>{inside=false});
  const stop=ticker(dt=>{
    t0+=dt;const q=inn.getBoundingClientRect();
    if(ctx.auto){tx=q.width*(.5+.42*Math.sin(t0*.8));ty=q.height*(.5+.3*Math.sin(t0*1.2+1));inside=true}
    mx+=(tx-mx)*(1-Math.exp(-16*dt));my+=(ty-my)*(1-Math.exp(-16*dt));r+=((inside?P.RADIUS:0)-r)*(1-Math.exp(-9*dt));
    inn.style.setProperty('--mx',mx+'px');inn.style.setProperty('--my',my+'px');inn.style.setProperty('--r',r+'px');
  });
  ctx.demo(play,6500);
  ctx.status('IDLE');
  return stop;
}});
