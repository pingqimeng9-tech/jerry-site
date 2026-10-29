/* ─── 8 Paste-Up ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'pasteup',name:'Paste-Up',cat:'Transition',mat:'印刷',
spell:'同一组印刷品，三种版面：切换版面，所有图自己飞到新家。',core:'转场从没被写出来，只是被暗示',tags:['Transition','Layout','Canvas','Shared element'],
credit:{n:'Paste-Up',u:'https://carterogunsola.com/lab/paste-up'},
notes:['页面里有三个“版面”（索引网格、跨页、条带），它们是真实的 DOM：只有铅笔线框和一个小标签的空盒子，由浏览器排版。','一块画布盖在上面，把每张图画在“它认领的那个盒子”上。盒子用 data-print 声明“我要这张图”，引擎只负责：测量盒子的位置，让图以每帧 0.085 的跟随系数滑过去。','没有任何“网格到跨页”的动画代码。换版面就是盒子换了位置，图自己飞过去；飞行时纸面会像弯曲一样中间领先、边缘拖尾。','右边两个旋钮把两个常见的坑做成了真实的：Fetch 是假装的导航延迟，Memory 是位置缓存——关掉它，旧版面消失时图会塌缩到角落再弹出来。'],
knobs:[{k:'FOLLOW',label:'FOLLOW 跟随系数',v:.085,min:.02,max:.3,step:.005},{k:'FETCH_MS',label:'FETCH 假延迟 ms',v:0,min:0,max:1200,step:50},{k:'MEMORY',label:'MEMORY 位置缓存',v:1,min:0,max:1,step:1},{k:'BOW',label:'BOW 弯曲',v:1,min:0,max:2.5,step:.1}],
css:`.pu canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
.pu-bar{position:absolute;left:14px;top:12px;z-index:3;display:flex;gap:6px}
.pu-bar button{font:11px var(--mono);padding:6px 12px;border:1px solid currentColor;border-radius:99px;opacity:.55;color:var(--st-ink)}
.pu-bar button[aria-pressed=true]{opacity:1;background:var(--st-ink);color:var(--st-bg)}
.pu-board{position:absolute;inset:56px 14px 14px 14px;display:none}
.pu-board.on{display:block}
.pu-box{position:absolute;border:1px solid var(--st-ink);border-color:color-mix(in srgb,var(--st-ink) 45%,transparent);cursor:pointer}
.pu-box::after{content:attr(data-tag);position:absolute;left:4px;top:3px;font:9px var(--mono);opacity:.5}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items.slice(0,6),N=items.length;
  h.innerHTML=`<div class="stg pu"><div class="pu-bar"><button data-b="index" aria-pressed="true">INDEX</button><button data-b="spread" aria-pressed="false">SPREAD</button><button data-b="strip" aria-pressed="false">STRIP</button></div><div class="pu-board on" data-b="index"></div><div class="pu-board" data-b="spread"></div><div class="pu-board" data-b="strip"></div><canvas></canvas></div>`;
  const root=$('.pu',h),cv=$('canvas',h),c=cv.getContext('2d'),dpr=(EMBED&&EMBED.auto?1:Math.min(devicePixelRatio||1,2)),W=root.clientWidth,H=root.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const boards={};root.querySelectorAll('.pu-board').forEach(b=>boards[b.dataset.b]=b);
  const ids=items.map((_,i)=>'p'+(i+1));
  let hero='p1';
  const bw=W-28,bh=H-70;
  function build(){
    Object.values(boards).forEach(b=>b.innerHTML='');
    const box=(b,id,x,y,w,hh)=>{const d=el('div','pu-box');d.dataset.print=id;d.dataset.tag=id.toUpperCase();Object.assign(d.style,{left:x+'px',top:y+'px',width:w+'px',height:hh+'px'});d.addEventListener('click',()=>onPrint(id));boards[b].appendChild(d)};
    // index: 3x2
    const gw=(bw-2*16)/3,gh=(bh-16)/2;ids.forEach((id,i)=>box('index',id,(i%3)*(gw+16),Math.floor(i/3)*(gh+16),gw,gh));
    // spread: hero + rail
    const rest=ids.filter(i=>i!==hero),hw=bw*.5,cwid=(bw-hw-16-10)/2,rh=(bh-2*10)/3;
    box('spread',hero,0,0,hw,bh);rest.forEach((id,i)=>box('spread',id,hw+16+(i%2)*(cwid+10),Math.floor(i/2)*(rh+10),cwid,rh));
    // strip: one row
    const sw=(bw-5*10)/6,shh=Math.min(bh*.5,sw*1.25);ids.forEach((id,i)=>box('strip',id,i*(sw+10),(bh-shh)/2,sw,shh));
  }
  build();
  const imgs=items.map((_,i)=>posterCanvas(i,360,450));
  const planes=ids.map((id,i)=>({id,i,x:0,y:0,w:0,h:0,tx:0,ty:0,tw:0,th:0,vx:0,vy:0,sp:0,has:false}));
  let curB='index',lastRect={};
  function measure(){
    const sr=root.getBoundingClientRect();
    planes.forEach(p=>{const bx=boards[curB].querySelector(`[data-print="${p.id}"]`);let r=bx?bx.getBoundingClientRect():{left:sr.left,top:sr.top,width:0,height:0};
      if(r.width===0&&P.MEMORY>=.5&&lastRect[p.id]){p.tx=lastRect[p.id].x;p.ty=lastRect[p.id].y;p.tw=lastRect[p.id].w;p.th=lastRect[p.id].h}
      else{const ins=r.width>0?7:0;p.tx=r.left-sr.left+ins;p.ty=r.top-sr.top+ins;p.tw=Math.max(0,r.width-ins*2);p.th=Math.max(0,r.height-ins*2);if(r.width>0)lastRect[p.id]={x:p.tx,y:p.ty,w:p.tw,h:p.th}}
      if(!p.has){p.x=p.tx;p.y=p.ty;p.w=p.tw;p.h=p.th;p.has=true}});
  }
  let busy=false;
  async function setBoard(b){
    if(busy||b===curB)return;busy=true;ctx.status('→ '+b.toUpperCase());
    root.querySelectorAll('.pu-bar button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.b===b));
    const old=boards[curB];
    if(P.FETCH_MS>0){old.classList.remove('on');measure();await wait(P.FETCH_MS);curB=b;build();boards[b].classList.add('on');measure()}
    else{curB=b;build();boards[b].classList.add('on');old.classList.remove('on');measure()}
    busy=false;ctx.status(b.toUpperCase());
  }
  function onPrint(id){if(curB==='spread'){if(id!==hero){hero=id;build();measure();ctx.focus(ids.indexOf(id))}}else{hero=id;ctx.focus(ids.indexOf(id));build();setBoard('spread')}}
  root.querySelectorAll('.pu-bar button').forEach(b=>b.addEventListener('click',()=>setBoard(b.dataset.b)));
  measure();
  const TILES=10;
  const stop=ticker(dt=>{
    c.clearRect(0,0,W,H);
    const k=1-Math.pow(1-P.FOLLOW,dt*60);
    planes.forEach(p=>{const ox=p.x+p.w/2,oy=p.y+p.h/2;p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;p.w+=(p.tw-p.w)*k;p.h+=(p.th-p.h)*k;
      const nvx=clamp(p.x+p.w/2-ox,-48,48),nvy=clamp(p.y+p.h/2-oy,-48,48);p.vx=p.vx*.8+nvx*.2;p.vy=p.vy*.8+nvy*.2;p.sp=Math.hypot(p.vx,p.vy)});
    const order=planes.slice().sort((a,b)=>a.sp-b.sp);
    order.forEach(p=>{if(p.w<1||p.h<1)return;const img=imgs[p.i];let iw=img.width,ih=img.height,sx0=0,sy0=0;const ra=p.w/p.h,ia=iw/ih;if(ra>ia){const nh=iw/ra;sy0=(ih-nh)/2;ih=nh}else{const nw=ih*ra;sx0=(iw-nw)/2;iw=nw}const tw=p.w/TILES,th=p.h/TILES;
      for(let j=0;j<TILES;j++)for(let i=0;i<TILES;i++){
        const u=(i+.5)/TILES,v=(j+.5)/TILES,bx=(1-Math.sin(Math.PI*v))*-p.vx*P.BOW*.9,by=(1-Math.sin(Math.PI*u))*-p.vy*P.BOW*.9;
        c.drawImage(img,sx0+i*iw/TILES,sy0+j*ih/TILES,iw/TILES,ih/TILES,p.x+i*tw+bx,p.y+j*th+by,tw+1.2,th+1.2)}});
  });
  let dk=0;
  ctx.demo(()=>{const seq=['spread','strip','index'];setBoard(seq[dk++%3]);if(dk%3===0){hero=ids[(dk/3)%N|0]}},2800);
  ctx.status('INDEX');
  addEventListener('resize',measure);
  return()=>{stop();removeEventListener('resize',measure)};
}});
