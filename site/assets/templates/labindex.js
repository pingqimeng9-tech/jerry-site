/* ─── 10 Lab Index（List / Wheel / Grid） ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'labindex',name:'Lab Index',cat:'UI',mat:'轮盘',
spell:'同一组条目，三种浏览方式：LIST / WHEEL / GRID，切换时每一项自己走到新位置。',core:'条目只记得自己的目标位置',tags:['UI','Navigation','Wheel','Layout'],
credit:{n:'Lab 首页的 List / Wheel / Grid',u:'https://carterogunsola.com/lab'},
notes:['每个条目保存位置、缩放、旋转和透明度，每帧用阻尼靠近各自的“目标”。三种模式只是三套目标：List 是直排；Wheel 是按距离缩小、倾斜、变淡的轮盘；Grid 是网格。所以模式切换不需要任何转场代码。','当前项右侧显示它的预览，换项时两层预览用模糊交叉淡入淡出。','滚轮、拖动、方向键和点击都能选择；左下角偶尔弹出“有人加入”的小提示，借自原站的在线人数。','原站条目是图片海报加标签；这里用程序生成的海报代替。'],
knobs:[{k:'LAMBDA',label:'LAMBDA 跟随',v:10,min:3,max:30,step:1}],
css:`.li{cursor:default}
.li-list{position:absolute;inset:0;overflow:hidden;touch-action:none}
.li-it{position:absolute;left:0;top:0;transform-origin:0 50%;will-change:transform,opacity;cursor:pointer}
.li-name{white-space:nowrap;font-size:38px;font-weight:600;letter-spacing:-.04em;line-height:1}
.li-tags{position:absolute;left:100%;top:50%;transform:translateY(-50%);display:flex;gap:5px;margin-left:12px;opacity:0;transition:opacity .3s}
.li-tags i{font:10px var(--mono);font-style:normal;padding:4px 8px;border-radius:5px;background:color-mix(in srgb,var(--st-ink) 14%,transparent)}
.li-it.act .li-tags{opacity:1}
.li-card{position:absolute;left:0;top:0;width:var(--cw);height:var(--chh);border-radius:6px;background-size:cover;background-position:center;opacity:0;transition:opacity .4s}
.li.m-grid .li-card{opacity:1}
.li.m-grid .li-name{position:absolute;left:0;top:calc(var(--chh) + 6px);font-size:14px;letter-spacing:-.01em}
.li.m-grid .li-tags{display:none}
.li-prev{position:absolute;right:5%;top:50%;transform:translateY(-50%);width:min(30%,300px);aspect-ratio:4/5;border-radius:10px;overflow:hidden;pointer-events:none;transition:opacity .4s}
.li.m-grid .li-prev{opacity:0}
.li-prev div{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .5s,filter .5s}
.li-modes{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;padding:4px;gap:2px;border-radius:10px;background:color-mix(in srgb,var(--st-ink) 10%,transparent);z-index:2}
.li-modes button{font:11px var(--mono);padding:6px 12px;border-radius:7px;opacity:.6;color:var(--st-ink)}
.li-modes button[aria-pressed=true]{opacity:1;background:color-mix(in srgb,var(--st-ink) 16%,transparent)}
.li-toast{position:absolute;left:14px;bottom:14px;padding:10px 14px;border-radius:10px;background:color-mix(in srgb,var(--st-ink) 12%,transparent);font-size:13px;line-height:1.35;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s;pointer-events:none}
.li-toast.show{opacity:1;transform:none}.li-toast small{display:block;font:11px var(--mono);opacity:.6}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items,N=items.length;
  h.innerHTML=`<div class="stg li m-wheel"><div class="li-list"></div><div class="li-prev"><div class="pa"></div><div class="pb"></div></div><div class="li-modes"><button data-m="list" aria-pressed="false">LIST</button><button data-m="wheel" aria-pressed="true">WHEEL</button><button data-m="grid" aria-pressed="false">GRID</button></div><div class="li-toast"></div></div>`;
  const root=$('.li',h),list=$('.li-list',h),pa=$('.pa',h),pb=$('.pb',h),toast=$('.li-toast',h);
  const W=root.clientWidth,H=root.clientHeight,wide=W>760,cols=wide?5:3,rowsN=Math.ceil(N/cols),gap=16,cw=Math.min((W*.9-gap*(cols-1))/cols,((H-110)/rowsN-36)/1.15),chh=cw*1.15,gridW=cols*cw+(cols-1)*gap;
  root.style.setProperty('--cw',cw+'px');root.style.setProperty('--chh',chh+'px');
  const st=items.map((it,i)=>{const d=el('div','li-it',`<div class="li-card" style="background-image:url(${posterURL(i,200,230)})"></div><div class="li-name">${esc(it.title)}</div><div class="li-tags"><i>${it.kind}</i>${i<3?'<i>NEW</i>':''}</div>`);list.appendChild(d);return{d,x:0,y:0,s:1,r:0,o:0,init:false}});
  let mode='wheel',pos=0,posT=0,active=-1,front=true,wheelT=null;
  const lineH=Math.max(54,H/9);
  const setActive=i=>{if(i===active)return;active=i;st.forEach((s,k)=>s.d.classList.toggle('act',k===i));const nx=front?pb:pa,ot=front?pa:pb;nx.style.backgroundImage=`url(${posterURL(i,300,375)})`;nx.style.opacity=1;nx.style.filter='none';ot.style.opacity=0;ot.style.filter='blur(8px)';front=!front;ctx.focus(i)};
  function targets(){
    return st.map((s,i)=>{
      if(mode==='grid'){const col=i%cols,row=Math.floor(i/cols),x0=(W-gridW)/2+col*(cw+gap),y0=(H-90-rowsN*(chh+36))/2+16+row*(chh+36);return{x:x0,y:y0,s:1,r:0,o:1}}
      const d=i-pos,ad=Math.abs(d);
      if(mode==='list')return{x:W*.06,y:H/2+d*lineH*.8-18,s:.72,r:0,o:ad>5?0:clamp(1.15-ad*.14,.25,1)};
      return{x:W*.05+Math.min(ad,3)*8,y:H/2+d*lineH-18,s:Math.max(.3,1.45-ad*.38),r:clamp(d*5.5,-24,24),o:ad>4?0:clamp(1.1-ad*.3,.1,1)};
    });
  }
  const stop=ticker(dt=>{
    pos=damp(pos,posT,7,dt);
    const tg=targets(),k=P.LAMBDA;
    st.forEach((s,i)=>{const t=tg[i];if(!s.init){Object.assign(s,t,{init:true})}else{s.x=damp(s.x,t.x,k,dt);s.y=damp(s.y,t.y,k,dt);s.s=damp(s.s,t.s,k,dt);s.r=damp(s.r,t.r,k,dt);s.o=damp(s.o,t.o,k,dt)}
      s.d.style.transform=`translate(${s.x}px,${s.y}px) rotate(${s.r}deg) scale(${s.s})`;s.d.style.opacity=s.o;s.d.style.pointerEvents=s.o<.2?'none':'auto'});
    if(mode!=='grid')setActive(mod(Math.round(pos),N)>=0?clamp(Math.round(pos),0,N-1):0);
  });
  const go=i=>{posT=clamp(i,0,N-1);if(mode==='grid')setActive(posT)};
  st.forEach((s,i)=>s.d.addEventListener('click',()=>go(i)));
  root.addEventListener('wheel',e=>{if(mode==='grid')return;e.preventDefault();posT=clamp(posT+e.deltaY*.006,0,N-1);clearTimeout(wheelT);wheelT=setTimeout(()=>{posT=Math.round(posT)},120)},{passive:false});
  let ly=0,on=false;
  list.addEventListener('pointerdown',e=>{if(mode==='grid')return;on=true;ly=e.clientY;list.setPointerCapture(e.pointerId)});
  list.addEventListener('pointermove',e=>{if(!on)return;posT=clamp(posT-(e.clientY-ly)/lineH,0,N-1);ly=e.clientY});
  const up=()=>{if(on){on=false;posT=Math.round(posT)}};list.addEventListener('pointerup',up);list.addEventListener('pointercancel',up);
  const key=e=>{if(!h.isConnected||false||e.target.tagName==='INPUT')return;if(e.key==='ArrowDown'||e.key==='ArrowRight')go(Math.round(posT)+1);if(e.key==='ArrowUp'||e.key==='ArrowLeft')go(Math.round(posT)-1)};addEventListener('keydown',key);
  const setMode=m=>{mode=m;root.classList.remove('m-list','m-wheel','m-grid');root.classList.add('m-'+m);root.querySelectorAll('.li-modes button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));ctx.status(m.toUpperCase());if(m==='grid')setActive(Math.round(posT))};
  root.querySelectorAll('.li-modes button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
  let n=17;const popToast=()=>{n+=1;toast.innerHTML=`Someone joined<small>${n} online</small>`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)};
  const tt=setInterval(popToast,6500);setTimeout(popToast,1800);
  let mi=0;ctx.demo(()=>{if(mi%6===5)setMode('list');else if(mi%6===1)setMode('grid');else if(mi%6===3)setMode('wheel');if(mode!=='grid')go((Math.round(posT)+1)%N);mi++},1700);
  setActive(0);ctx.status('WHEEL');
  return()=>{stop();clearInterval(tt);removeEventListener('keydown',key)};
}});
