/* ─── 19 Cut-Paper Stack ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'paper',name:'Cut-Paper Stack',cat:'Layout',mat:'剪纸',
spell:'几张撕过边的纸叠成扇形，指针一动各层按深度错位；点一下，最上面那张飞到最底下。',core:'层次靠“撕边 + 投影 + 视差”，不靠渐变',tags:['Layout','Paper','Parallax','Click'],
credit:{n:'Skillry · Cut-Paper Collective Site（风格方向）',u:'https://skillry.dev/',own:1},
notes:['每张纸的轮廓是一个 clip-path polygon：沿四条边每隔一段取一个随机内缩 0–2.4%，边就“撕”出来了。用固定种子的随机数，每次打开形状一致。','投影放在外层，用 filter: drop-shadow；clip-path 在内层。因为 box-shadow 会被 clip-path 一起裁掉，drop-shadow 作用在裁完之后的形状上。','每层有自己的“槽位”（0 为最上）。槽位决定它的偏移、角度和视差系数，位置用阻尼追过去，所以洗牌时有自然的滑动。','点击：最上面一张移到最底，其余各升一档。内容取自同一份数据。'],
knobs:[{k:'DEPTH',label:'DEPTH 视差 px',v:16,min:0,max:40,step:1},{k:'STEP',label:'STEP 扇形间距',v:24,min:6,max:60,step:1},{k:'TILT',label:'TILT 倾斜 °',v:3,min:0,max:8,step:.5},{k:'LAMBDA',label:'λ 跟随',v:9,min:3,max:25,step:1},{k:'LAYERS',label:'层数',v:5,min:3,max:7,step:1,remount:true}],
css:`.pp{cursor:pointer}
.pp-w{position:absolute;left:21%;top:16%;width:58%;height:66%;filter:drop-shadow(0 7px 9px rgba(0,0,0,.3));will-change:transform}
.pp-l{position:absolute;inset:0;padding:6.5% 7%;display:flex;flex-direction:column;justify-content:space-between;color:#1b1a18}
.pp-l small{font:10px var(--mono);opacity:.7}
.pp-l b{font-size:clamp(20px,4.2vw,50px);letter-spacing:-.04em;line-height:1.02;font-weight:650}
.pp-l span{font-size:clamp(11px,1.5vw,15px);line-height:1.5;opacity:.78;max-width:30em}
.pp-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items,L=Math.round(P.LAYERS),PAL=['#e7e1d3','#e4572e','#1f6f8b','#f2b134','#99c1b9','#c9b6e4','#a7c957'],ROT=[0,3,-4,5.5,-6.5,8,-9];
  const torn=r=>{const pts=[],n=9,j=()=>r()*2.4;for(let i=0;i<=n;i++)pts.push([i/n*100,j()]);for(let i=1;i<=n;i++)pts.push([100-j(),i/n*100]);for(let i=n-1;i>=0;i--)pts.push([i/n*100,100-j()]);for(let i=n-1;i>0;i--)pts.push([j(),i/n*100]);return'polygon('+pts.map(p=>p[0].toFixed(1)+'% '+p[1].toFixed(1)+'%').join(',')+')'};
  h.innerHTML=`<div class="stg pp">${Array.from({length:L},(_,i)=>{const it=items[i%items.length];return`<div class="pp-w"><div class="pp-l" style="background:${PAL[i%PAL.length]};clip-path:${torn(rng(i*131+7))}"><small>${it.kind} · ${it.date}</small><b>${esc(it.title)}</b><span>${esc(it.sum)}</span></div></div>`}).join('')}<div class="pp-cap">移动指针 · 点击换一张</div></div>`;
  const root=$('.pp',h),ls=[...h.querySelectorAll('.pp-w')].map((n,i)=>({n,i,slot:i,x:0,y:0,r:0}));
  let pxn=0,pyn=0,txn=0,tyn=0,t0=0;
  const cycle=()=>{audioReady();clickSound(200,.4);ls.forEach(l=>{l.slot=l.slot===0?L-1:l.slot-1});const top=ls.find(l=>l.slot===L-1);top.n.style.zIndex=L+1;setTimeout(()=>{ls.forEach(l=>l.n.style.zIndex=L-l.slot)},260);ctx.focus(ls.find(l=>l.slot===0).i%items.length)};
  ls.forEach(l=>l.n.style.zIndex=L-l.slot);
  root.addEventListener('pointerdown',cycle);
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();txn=(e.clientX-r.left)/r.width*2-1;tyn=(e.clientY-r.top)/r.height*2-1});
  root.addEventListener('pointerleave',()=>{txn=tyn=0});
  const stop=ticker(dt=>{
    t0+=dt;if(ctx.auto){txn=Math.sin(t0*.8)*.8;tyn=Math.sin(t0*1.1+1)*.6}
    const k=1-Math.exp(-P.LAMBDA*dt);pxn+=(txn-pxn)*k;pyn+=(tyn-pyn)*k;
    ls.forEach(l=>{const s=l.slot,f=1-s*.16,tx=(s%2?1:-1)*Math.ceil(s/2)*P.STEP+pxn*P.DEPTH*f*-1,ty=-s*6+pyn*P.DEPTH*f*-.7,tr=ROT[s]*P.TILT/3+(s===0?pxn*1.6:0);
      l.x+=(tx-l.x)*k;l.y+=(ty-l.y)*k;l.r+=(tr-l.r)*k;l.n.style.transform=`translate(${l.x}px,${l.y}px) rotate(${l.r}deg)`});
  });
  ctx.demo(cycle,2300);
  ctx.focus(0);ctx.status('IDLE');
  return stop;
}});
