/* ─── 28 Ribbon Transition ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'ribbontear',name:'Ribbon Transition',cat:'Transition',mat:'撕纸转场',
spell:'点底部圆环或左右滑：几条撕边色带斜着扫过来盖住旧页面，换页后再扫出去。',core:'一个时序状态机：盖住 → 换页 → 停一拍 → 掀开',tags:['Transition','Paper','Ribbon','Swipe','State machine'],
credit:{n:'hanaforum-visual-skills · page-transition-system（撕纸转场的思路参考，时序与代码为原创）',u:'https://github.com/Miruko2/hanaforum-visual-skills',own:1},
notes:['转场只有四个状态：idle（静止）→ cover（色带扫进来盖住）→ hold（换页，停一拍）→ reveal（色带扫出去）。换页那一刻整屏被色带盖着，所以用户看不到内容突变。','每条色带是一块很长的矩形，整体旋转 ANGLE 度，奇数条从左进、偶数条从右进，进场用四次方缓出、退场用四次方缓入，再按 STAG 错开出发时间。','“撕边”是 clip-path 多边形：沿上下长边每隔一小段随机抖一点，两端再抖一次。抖动用固定种子，所以同一条色带每次撕得一样；JAG 控制抖得多厉害。','色带之间叠了半调圆点和速度线两层装饰，盖满屏的那一拍浮出目标页面的名字。','手势：在页面上左右拖，页面会跟手移动；松手超过 80px 才触发转场，否则弹回。键盘 ←/→ 也行；底部圆环点开后可直接跳到任意页。'],
knobs:[
{k:'DUR',label:'DUR 单程时长（秒）',v:.75,min:.3,max:1.6,step:.05},
{k:'HOLD',label:'HOLD 盖满后停留（秒）',v:.35,min:0,max:1,step:.05},
{k:'RIB',label:'RIB 色带条数',v:6,min:3,max:10,step:1,remount:true},
{k:'ANGLE',label:'ANGLE 倾斜角度',v:-18,min:-40,max:40,step:1},
{k:'JAG',label:'JAG 撕边粗糙度',v:14,min:0,max:40,step:1,remount:true},
{k:'HUE',label:'HUE 主色相',v:350,min:0,max:360,step:1}],
css:`.rb{background:#0c0d12;color:#fff;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;touch-action:pan-y;--h:350;--ac:hsl(var(--h) 92% 58%);--ac2:hsl(calc(var(--h) + 40) 95% 62%)}
.rb-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;overflow:hidden}
.rb-pg{position:absolute;inset:0;padding:70px 90px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center}.rb-pg[hidden]{display:none}
.rb-pg h1{margin:0;font-size:170px;line-height:.9;letter-spacing:-.05em;font-weight:900}.rb-pg h1 em{color:var(--ac);font-style:normal}
.rb-pg p{margin:22px 0 0;font-size:22px;max-width:560px;line-height:1.6;opacity:.8}.rb-pg small{font:700 14px ui-monospace,Menlo,monospace;letter-spacing:.3em;opacity:.6;margin-bottom:18px}
.rb-deco{position:absolute;right:-60px;top:80px;width:520px;height:520px;border-radius:50%;opacity:.9}
.rb-p0{background:linear-gradient(135deg,#14151f,#0b0c12)}.rb-p0 .rb-deco{background:radial-gradient(circle at 35% 35%,var(--ac2),var(--ac) 55%,transparent 70%)}
.rb-p1{background:#f1ece0;color:#14151f}.rb-p1 .rb-deco{background:repeating-radial-gradient(circle,#14151f 0 5px,#2a2c38 5px 8px);box-shadow:0 30px 70px rgba(0,0,0,.3)}.rb-p1 .rb-deco:after{content:"";position:absolute;inset:34%;border-radius:50%;background:var(--ac)}
.rb-p2{background:linear-gradient(160deg,var(--ac),#1a0b14 80%)}.rb-p2 .rb-deco{border-radius:36px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.4);transform:rotate(10deg)}
.rb-p3{background:#fff;color:#111}.rb-p3 .rb-deco{border-radius:0;background:repeating-linear-gradient(135deg,var(--ac) 0 26px,#111 26px 52px);transform:rotate(-8deg);width:420px;height:420px}
.rb-ly{position:absolute;inset:0;pointer-events:none;visibility:hidden;z-index:20}.rb-ly.on{visibility:visible}
.rb-r{position:absolute;left:50%;top:50%;width:2700px;will-change:transform}
.rb-ht{position:absolute;inset:-200px;z-index:2;background:radial-gradient(circle,rgba(0,0,0,.28) 2.2px,transparent 2.8px) 0 0/16px 16px;-webkit-mask:linear-gradient(100deg,transparent 15%,#000 50%,transparent 85%);mask:linear-gradient(100deg,transparent 15%,#000 50%,transparent 85%);opacity:0}
.rb-sp{position:absolute;inset:-300px;z-index:3;background:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 2px,transparent 2px 46px);opacity:0}
.rb-tt{position:absolute;left:0;right:0;top:50%;z-index:6;text-align:center;font-weight:900;font-size:150px;letter-spacing:-.04em;line-height:1;transform:translateY(-50%) skewX(-8deg);color:#fff;mix-blend-mode:difference;opacity:0;white-space:nowrap}
.rb-ring{position:absolute;left:50%;bottom:34px;width:0;height:0;z-index:30}
.rb-ct{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:0;background:#fff;color:#111;font-weight:900;font-size:22px;font-family:inherit;cursor:pointer;z-index:2;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:transform .4s cubic-bezier(.2,.9,.2,1)}.rb-ring.open .rb-ct{transform:rotate(135deg)}
.rb-it{position:absolute;left:-27px;top:-27px;width:54px;height:54px;border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(20,21,31,.85);color:#fff;font-weight:800;font-size:13px;font-family:inherit;cursor:pointer;opacity:0;pointer-events:none;transform:translate(0,0) scale(.4);transition:transform .45s cubic-bezier(.2,1.3,.3,1),opacity .3s,background .2s}
.rb-ring.open .rb-it{opacity:1;pointer-events:auto;transform:translate(var(--x),var(--y)) scale(1)}.rb-it.on{background:var(--ac);border-color:var(--ac)}
.rb-hint{position:absolute;left:30px;bottom:30px;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.12em;opacity:.55;z-index:30;mix-blend-mode:difference}`,
mount(h,ctx){
  const P=ctx.P,N=P.RIB|0,JAG0=P.JAG;
  const PAGES=[{t:'HOME',s:'01 · WELCOME',h:'HELLO<br><em>PAPER.</em>',p:'点底部圆环，或者在页面上左右拖一下。'},{t:'MUSIC',s:'02 · LISTEN',h:'KEEP<br><em>SPINNING.</em>',p:'每一次换页，色带都会重新撕一次。'},{t:'POSTS',s:'03 · READ',h:'FRESH<br><em>THREADS.</em>',p:'盖住的那一拍，页面已经悄悄换好了。'},{t:'ABOUT',s:'04 · MEET',h:'MADE<br><em>BY HAND.</em>',p:'撕边是固定种子生成的，每次都一样。'}];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const rnd=(n,s)=>{let t=(s*9301+n*49297+233280)%233280;t=(t*9301+49297)%233280;return t/233280};
  // 撕边多边形：上下长边每隔 ~110px 抖一下，两端再抖一次
  const RL=2700,RT=Math.ceil(1200/N)+70;
  const poly=(i,jag)=>{const pts=[],st=60;
    for(let k=0;k<=st;k++)pts.push([k/st*RL,rnd(k,i*7+1)*jag*1.3]);
    for(let k=0;k<=8;k++)pts.push([RL-rnd(k,i*7+2)*jag*2.2,RT*.5+(k/8-.5)*RT]);
    for(let k=st;k>=0;k--)pts.push([k/st*RL,RT-rnd(k,i*7+3)*jag*1.3]);
    for(let k=8;k>=0;k--)pts.push([rnd(k,i*7+4)*jag*2.2,RT*.5+(k/8-.5)*RT]);
    return'polygon('+pts.map(p=>p[0].toFixed(0)+'px '+p[1].toFixed(0)+'px').join(',')+')'};
  const COLS=['var(--ac)','#fff','#111','var(--ac2)','#fff','#111','var(--ac)','#fff','var(--ac2)','#111'];
  h.innerHTML=`<div class="stg rb"><div class="rb-st">
    ${PAGES.map((p,i)=>`<section class="rb-pg rb-p${i}" ${i?'hidden':''}><div class="rb-deco"></div><small>${p.s}</small><h1>${p.h}</h1><p>${p.p}</p></section>`).join('')}
    <div class="rb-ly"><div class="rb-ht"></div><div class="rb-sp"></div>${Array.from({length:N},(_,i)=>`<div class="rb-r" style="height:${RT}px;margin-top:${-RT/2}px;margin-left:${-RL/2}px;top:${(i+.5)/N*100}%;background:${COLS[i%COLS.length]};clip-path:${poly(i,JAG0)}"></div>`).join('')}<div class="rb-tt"></div></div>
    <div class="rb-ring"><button class="rb-ct">＋</button>${PAGES.map((p,i)=>{const a=(-150+i*40)*Math.PI/180;return`<button class="rb-it" data-i="${i}" style="--x:${(Math.cos(a)*110).toFixed(0)}px;--y:${(Math.sin(a)*110).toFixed(0)}px">${p.t}</button>`}).join('')}</div>
    <div class="rb-hint">← DRAG →</div></div></div>`;
  const root=$('.rb',h),st=$('.rb-st',h),pgs=[...h.querySelectorAll('.rb-pg')],ly=$('.rb-ly',h),rs=[...h.querySelectorAll('.rb-r')],ht=$('.rb-ht',h),sp=$('.rb-sp',h),tt=$('.rb-tt',h),ring=$('.rb-ring',h),its=[...h.querySelectorAll('.rb-it')];
  let S=1,cur=0,tr=null,dx=0,drag=null,t0=performance.now(),autoT=0;
  const ro=new ResizeObserver(()=>{S=Math.min(root.clientWidth/1200,root.clientHeight/760);css(st,'transform',`translate(-50%,-50%) scale(${S})`)});ro.observe(root);
  const o4=t=>1-(1-t)**4,i4=t=>t**4,cl=clamp;
  const show=i=>{cur=i;pgs.forEach((p,j)=>p.hidden=j!==i);its.forEach((b,j)=>b.classList.toggle('on',j===i));ctx.focus(i,PAGES[i].t)};
  // 状态机：idle → cover → hold（换页）→ reveal → idle
  const go=(to,dir)=>{to=(to+PAGES.length)%PAGES.length;if(tr||to===cur)return;tr={to,dir:dir||(to>cur?1:-1),t:0,swapped:false};ring.classList.remove('open');ly.classList.add('on');tt.textContent='→ '+PAGES[to].t;ctx.status('COVER → '+PAGES[to].t)};
  its.forEach(b=>b.addEventListener('click',()=>go(+b.dataset.i)));
  $('.rb-ct',h).addEventListener('click',()=>ring.classList.toggle('open'));
  root.tabIndex=0;root.style.outline='none';
  root.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(cur+1,1);if(e.key==='ArrowLeft')go(cur-1,-1)});
  // 滑动：页面跟手，松手超过 80px 才触发转场
  root.addEventListener('pointerdown',e=>{if(tr||e.target.closest('.rb-ring'))return;drag={x:e.clientX};root.focus({preventScroll:true});root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(drag){dx=(e.clientX-drag.x)/S}});
  const up=()=>{if(!drag)return;const d=dx;drag=null;if(Math.abs(d)>80)go(cur+(d<0?1:-1),d<0?1:-1)};root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  show(0);ctx.status('IDLE');
  const stop=ticker(dt=>{
    css(root,'--h',String(P.HUE));
    if(ctx.auto&&!tr){autoT+=dt;if(autoT>2.2){autoT=0;go(cur+1,1)}}
    // 页面跟手 / 弹回
    if(!drag&&Math.abs(dx)>.1)dx*=Math.exp(-dt*12);else if(!drag)dx=0;
    css(pgs[cur],'transform',`translateX(${(dx*.45).toFixed(1)}px)`);
    if(!tr)return;
    tr.t+=dt;const D=P.DUR,H=P.HOLD,ST=.055,T=tr.t,tot=D+ST*(N-1);
    const angle=P.ANGLE*(tr.dir<0?-1:1);
    rs.forEach((r,i)=>{const s=(i%2?1:-1)*tr.dir,dl=i*ST;
      let x;if(T<tot+H){x=-s*RL*(1-o4(cl((T-dl)/D,0,1)))}else{x=s*RL*i4(cl((T-tot-H-dl)/D,0,1))}
      css(r,'transform',`rotate(${angle}deg) translateX(${x.toFixed(0)}px)`)});
    const cover=cl((T-tot)/.12,0,1),rv=cl((T-tot-H)/(D*.6),0,1),mid=Math.min(cover,1-rv);
    css(ht,'opacity',String(+mid.toFixed(2)));css(sp,'opacity',String(+(.7*Math.sin(Math.PI*cl((T-D*.2)/(tot+H+D*.8),0,1))).toFixed(2)));css(sp,'transform',`translateX(${(-T*900)%46}px)`);
    css(tt,'opacity',String(+mid.toFixed(2)));css(tt,'transform',`translateY(-50%) skewX(-8deg) translateX(${((1-mid)*(tr.dir*160)).toFixed(0)}px)`);
    if(!tr.swapped&&T>=tot+H*.5){tr.swapped=true;show(tr.to);dx=0;ctx.status('SWAP · '+PAGES[tr.to].t)}
    if(T>=tot+H+D+ST*(N-1)){tr=null;ly.classList.remove('on');ctx.status('IDLE')}
  });
  return()=>{stop();ro.disconnect()};
}});
