/* ─── 26 Glass Ladder ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'glassladder',name:'Glass Ladder',cat:'Glass',mat:'毛玻璃阶梯',
spell:'十一档毛玻璃从清透排到厚重，卡片可以拖到彩色背景上看差别；再点三个“高斯模糊动效”重播。',core:'一档玻璃 = blur + saturate + brightness + 底色 + 描边，五个值配成一套',tags:['Glass','Blur','Tokens','Drag'],
credit:{n:'hanaforum-visual-skills · site-visual-system（十一档毛玻璃与高斯模糊动效的思路参考，数值与代码为原创）',u:'https://github.com/Miruko2/hanaforum-visual-skills',own:1},
notes:['把“毛玻璃”拆成 11 档令牌，每档是 5 个值：模糊半径、饱和度、亮度、底色透明度、描边透明度。档位越高越“厚”：模糊更大、颜色更饱和、底色更白。','卡片只用 2D 平移，不放进 3D 变换里——毛玻璃（backdrop-filter）和 3D 叠在一起在一些设备上会闪，这里刻意避开。','拖一张卡片到不同背景上，能直接看到每一档在大字、色块、细线上的差别。点卡片会在右侧生成这一档的 CSS，可以复制。','三个“高斯模糊动效”：Blur In（从糊到清）、Focus Pull（前后景对焦互换）、Blur Swap（新旧文字交叉模糊）。点一下重播。','BLUR 整体放大/缩小所有档位的模糊半径，SAT 调饱和度，TINT 调底色浓度，FLOW 调背景色块流动的速度。'],
knobs:[
{k:'BLUR',label:'BLUR 模糊半径 ×',v:1,min:0,max:2,step:.1},
{k:'SAT',label:'SAT 饱和度 ×',v:1,min:.5,max:1.6,step:.05},
{k:'TINT',label:'TINT 底色浓度 ×',v:1,min:0,max:2.5,step:.1},
{k:'FLOW',label:'FLOW 背景流动速度',v:1,min:0,max:3,step:.1},
{k:'HUE',label:'HUE 背景色相',v:250,min:0,max:360,step:1}],
css:`.gl{background:#0b0c14;color:#fff;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif}
.gl-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;overflow:hidden}
.gl-bg{position:absolute;inset:0}.gl-bl{position:absolute;border-radius:50%;filter:blur(30px)}
.gl-big{position:absolute;left:30px;top:40px;font-weight:900;font-size:230px;line-height:.8;letter-spacing:-.05em;color:rgba(255,255,255,.92);white-space:nowrap;mix-blend-mode:normal}
.gl-big+.gl-big{top:300px;left:200px;color:transparent;-webkit-text-stroke:3px rgba(255,255,255,.85)}
.gl-big+.gl-big+.gl-big{top:520px;left:-60px;color:#ffd84a}
.gl-ln{position:absolute;left:0;right:0;height:3px;background:rgba(255,255,255,.7)}
.gl-grid{position:absolute;left:30px;top:30px;width:790px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.gl-c{position:relative;height:150px;border-radius:24px;cursor:grab;touch-action:none;user-select:none;padding:16px 18px;box-sizing:border-box;border:1px solid rgba(255,255,255,var(--bd));background:rgba(255,255,255,var(--tn));-webkit-backdrop-filter:blur(var(--b)) saturate(var(--s)) brightness(var(--br));backdrop-filter:blur(var(--b)) saturate(var(--s)) brightness(var(--br));box-shadow:0 14px 40px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.35);transition:box-shadow .3s,translate .45s cubic-bezier(.2,.9,.2,1)}
.gl-c.sel{box-shadow:0 0 0 2.5px #fff,0 18px 50px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.4)}.gl-c.drag{cursor:grabbing;z-index:9;transition:box-shadow .3s;box-shadow:0 30px 70px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.4)}
.gl-c b{display:block;font:800 26px ui-monospace,Menlo,monospace;letter-spacing:-.02em}.gl-c small{display:block;margin-top:6px;font:600 12px ui-monospace,Menlo,monospace;opacity:.85;line-height:1.55}
.gl-in{opacity:0;filter:blur(24px);translate:0 26px;animation:gl-in .9s cubic-bezier(.2,.9,.2,1) forwards;animation-delay:calc(var(--n)*55ms)}@keyframes gl-in{to{opacity:1;filter:blur(0);translate:0 0}}
.gl-side{position:absolute;right:30px;top:30px;width:320px;bottom:30px;border-radius:28px;padding:22px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;border:1px solid rgba(255,255,255,.3);background:rgba(10,12,24,.35);-webkit-backdrop-filter:blur(28px) saturate(1.6);backdrop-filter:blur(28px) saturate(1.6)}
.gl-side h3{margin:0;font:800 30px ui-monospace,Menlo,monospace}.gl-side p{margin:0;font-size:13px;opacity:.75;line-height:1.5}
.gl-code{font:12px/1.65 ui-monospace,Menlo,monospace;background:rgba(0,0,0,.35);border-radius:14px;padding:12px 14px;white-space:pre-wrap;word-break:break-all}
.gl-cp{align-self:flex-start;border:1px solid rgba(255,255,255,.4);background:none;color:#fff;border-radius:16px;font-weight:700;font-size:12px;font-family:inherit;padding:7px 14px;cursor:pointer}.gl-cp:hover{background:rgba(255,255,255,.15)}
.gl-mo{display:flex;gap:6px}.gl-mo button{flex:1;border:0;border-radius:14px;background:rgba(255,255,255,.14);color:#fff;font-weight:700;font-size:12px;font-family:inherit;padding:9px 4px;cursor:pointer}.gl-mo button.on{background:#fff;color:#111}
.gl-demo{position:relative;flex:1;min-height:110px;border-radius:18px;background:rgba(0,0,0,.28);overflow:hidden;display:grid;place-items:center;text-align:center}
.gl-d1,.gl-d2{position:absolute;font-weight:900;font-size:34px;letter-spacing:-.03em;line-height:1.1}.gl-d2{opacity:0}
.gl-fp{position:absolute;inset:0;display:grid;place-items:center}.gl-fp[hidden]{display:none}.gl-fp i{position:absolute;border-radius:50%}`,
mount(h,ctx){
  const P=ctx.P;
  // 十一档令牌：[模糊 px, 饱和度, 亮度, 底色透明度, 描边透明度]
  const TIERS=[[0,1,1,.04,.14],[2,1.1,1,.06,.16],[4,1.2,1.02,.07,.18],[6,1.3,1.04,.08,.2],[9,1.4,1.05,.1,.22],[12,1.5,1.06,.12,.24],[16,1.6,1.08,.14,.26],[20,1.7,1.1,.17,.28],[26,1.8,1.12,.2,.3],[34,1.9,1.14,.25,.32],[44,2,1.16,.32,.36]];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const BLOBS=[[220,260,420,'#ff4d8d',.5,.7,0],[900,180,360,'#27d3ff',.4,.9,2],[620,520,460,'#7a5cff',.35,.6,4],[300,640,340,'#ffb84a',.5,.8,1],[1000,600,300,'#3dff9a',.45,1.1,3]];
  h.innerHTML=`<div class="stg gl"><div class="gl-st">
    <div class="gl-bg">${BLOBS.map(b=>`<div class="gl-bl" style="width:${b[2]}px;height:${b[2]}px;background:${b[3]}"></div>`).join('')}
      <div class="gl-big">GLASS</div><div class="gl-big">11 TIERS</div><div class="gl-big">BLUR</div>
      <div class="gl-ln" style="top:250px"></div><div class="gl-ln" style="top:480px"></div><div class="gl-ln" style="top:690px"></div></div>
    <div class="gl-grid">${TIERS.map((t,i)=>`<div class="gl-c gl-in" data-i="${i}" style="--n:${i}"><b>G${String(i).padStart(2,'0')}</b><small></small></div>`).join('')}</div>
    <aside class="gl-side"><h3 class="gl-nm"></h3><p>点左侧任意一档；拖卡片到不同背景上看差别。</p><div class="gl-code"></div><button class="gl-cp">复制 CSS</button>
      <div class="gl-mo"><button data-m="0" class="on">Blur In</button><button data-m="1">Focus Pull</button><button data-m="2">Blur Swap</button></div>
      <div class="gl-demo"><div class="gl-d1">Frosted<br>Glass</div><div class="gl-d2">Clear<br>Sight</div><div class="gl-fp" hidden><i style="width:170px;height:170px;background:#ff4d8d"></i><i style="width:110px;height:110px;background:#ffd84a"></i></div></div></aside>
  </div></div>`;
  const root=$('.gl',h),st=$('.gl-st',h),cards=[...h.querySelectorAll('.gl-c')],blobs=[...h.querySelectorAll('.gl-bl')],code=$('.gl-code',h),nm=$('.gl-nm',h),d1=$('.gl-d1',h),d2=$('.gl-d2',h),fp=$('.gl-fp',h),mo=[...h.querySelectorAll('.gl-mo button')];
  let S=1,sel=7,mode=0,t=0,drag=null;
  const ro=new ResizeObserver(()=>{S=Math.min(root.clientWidth/1200,root.clientHeight/760);css(st,'transform',`translate(-50%,-50%) scale(${S})`)});ro.observe(root);
  const spec=i=>{const[b,s,br,tn,bd]=TIERS[i];return{b:+(b*P.BLUR).toFixed(1),s:+Math.min(2.4,s*(1+(P.SAT-1)*(i/10+.3))).toFixed(2),br,tn:+Math.min(.7,tn*P.TINT).toFixed(3),bd}};
  const pick=i=>{sel=i;cards.forEach((c,j)=>c.classList.toggle('sel',j===i));const v=spec(i);nm.textContent='G'+String(i).padStart(2,'0');
    code.textContent=`.glass-${String(i).padStart(2,'0')} {\n  background: rgba(255,255,255,${v.tn});\n  border: 1px solid rgba(255,255,255,${v.bd});\n  backdrop-filter: blur(${v.b}px)\n    saturate(${v.s}) brightness(${v.br});\n}`;ctx.status('G'+String(i).padStart(2,'0')+' · blur '+v.b+'px');ctx.focus(i,'G'+String(i).padStart(2,'0'))};
  // 三个高斯模糊动效
  const A=(el,kf,o)=>el.animate(kf,Object.assign({duration:900,easing:'cubic-bezier(.2,.9,.2,1)',fill:'both'},o));
  const play=m=>{mode=m;mo.forEach((b,i)=>b.classList.toggle('on',i===m));d1.getAnimations().forEach(a=>a.cancel());d2.getAnimations().forEach(a=>a.cancel());fp.hidden=m!==1;d1.style.opacity=m===1?0:1;d2.style.opacity=0;
    if(m===0)A(d1,[{filter:'blur(22px)',opacity:0,transform:'translateY(22px) scale(1.06)'},{filter:'blur(0)',opacity:1,transform:'none'}]);
    if(m===1){const[a,b]=fp.children;A(a,[{filter:'blur(0)',transform:'translate(-40px,0)'},{filter:'blur(16px)',transform:'translate(-60px,6px)'},{filter:'blur(0)',transform:'translate(-40px,0)'}],{duration:2400,iterations:Infinity,easing:'ease-in-out'});A(b,[{filter:'blur(16px)',transform:'translate(50px,0)'},{filter:'blur(0)',transform:'translate(70px,6px)'},{filter:'blur(16px)',transform:'translate(50px,0)'}],{duration:2400,iterations:Infinity,easing:'ease-in-out'})}
    if(m===2){A(d1,[{filter:'blur(0)',opacity:1},{filter:'blur(18px)',opacity:0}],{duration:700,easing:'ease-in'});A(d2,[{filter:'blur(18px)',opacity:0},{filter:'blur(0)',opacity:1}],{duration:800,delay:350})}};
  mo.forEach((b,i)=>b.addEventListener('click',()=>play(i)));
  $('.gl-cp',h).addEventListener('click',()=>{try{navigator.clipboard.writeText(code.textContent);ctx.status('已复制 '+nm.textContent)}catch(e){}});
  // 拖卡片：只用 translate，不进 3D
  cards.forEach(c=>{
    c.addEventListener('pointerdown',e=>{const o=c._o||(c._o=[0,0]);drag={c,x:e.clientX,y:e.clientY,ox:o[0],oy:o[1],moved:false};c.setPointerCapture(e.pointerId);c.classList.add('drag');c.classList.remove('gl-in');c.style.opacity=1;c.style.filter='none'});
    c.addEventListener('pointermove',e=>{if(!drag||drag.c!==c)return;const dx=(e.clientX-drag.x)/S,dy=(e.clientY-drag.y)/S;if(Math.hypot(dx,dy)>5)drag.moved=true;c._o=[drag.ox+dx,drag.oy+dy];c.style.translate=c._o[0]+'px '+c._o[1]+'px'});
    const up=()=>{if(!drag||drag.c!==c)return;c.classList.remove('drag');if(!drag.moved)pick(+c.dataset.i);drag=null};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up)});
  pick(sel);play(0);
  const stop=ticker(dt=>{
    t+=dt*P.FLOW;
    blobs.forEach((b,i)=>{const[x,y,s,c,ax,sp,ph]=BLOBS[i];css(b,'transform',`translate(${(x-s/2+Math.sin(t*sp*.6+ph)*160*ax*2).toFixed(1)}px,${(y-s/2+Math.cos(t*sp*.5+ph)*110*ax*2).toFixed(1)}px)`)});
    css(h.querySelector('.gl-bg'),'filter',`hue-rotate(${P.HUE-250}deg)`);
    cards.forEach((c,i)=>{const v=spec(i);css(c,'--b',v.b+'px');css(c,'--s',String(v.s));css(c,'--br',String(v.br));css(c,'--tn',String(v.tn));css(c,'--bd',String(v.bd));
      const sm=c.querySelector('small'),tx=`blur ${v.b}px\nsat ${v.s} · α ${v.tn}`;if(sm.textContent!==tx)sm.textContent=tx});
    if(ctx.auto&&((t*1)|0)%5===0&&mode!==((((t/5)|0)%3)))play(((t/5)|0)%3)});
  return()=>{stop();ro.disconnect();h.querySelectorAll('.gl-d1,.gl-d2,.gl-fp i').forEach(e=>e.getAnimations().forEach(a=>a.cancel()))};
}});
