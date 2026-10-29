/* ─── 22 One-Screen Home ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'homeone',name:'One-Screen Home',cat:'Layout',mat:'单屏主页',
spell:'一屏装下整个主页：点标签、滚轮、方向键、左右滑动都能换页，不用往下滑。',core:'把长页面改成一屏里的四块面板，用“换页”代替“滚动”',tags:['Layout','Profile','Tabs','No-scroll'],
credit:{n:'callmiruko.cc 个人主页（只参考版块结构，文案和样式均为原创占位）',u:'https://callmiruko.cc/',own:1},
notes:['原主页是“我是谁 / 经历 / 反思 / 系统”四段长页面，下半截基本没人看。这里把四段拆成四块面板放进同一屏，左侧身份卡常驻，右侧只换内容。','换页有五种方式：点顶部标签、鼠标滚轮、键盘 ←/→、触屏左右滑、自动轮播（AUTO 秒数，0 为关）。方向会决定新面板从哪一侧滑入。','“系统”面板里的三个文件夹：悬停时前盖微开、纸张探头，点击后前盖完全打开、纸张扇形展开，里面放入口链接。','文字内容都集中在 mount 开头的 ME / TL / REF / SYS 四个对象里，换成自己的资料即可。'],
knobs:[
{k:'AUTO',label:'AUTO 自动换页秒数（0=关）',v:0,min:0,max:12,step:1},
{k:'HUE',label:'HUE 主题色相',v:72,min:0,max:360,step:1},
{k:'TILT',label:'TILT 身份卡跟随鼠标倾斜',v:6,min:0,max:15,step:.5}],
css:`.hm{background:#0d0f16;color:#eef0f6;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;--h:72;--ac:hsl(var(--h) 85% 62%);--ac2:hsl(var(--h) 85% 62%/.14);--ln:rgba(255,255,255,.1)}
.hm-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;box-sizing:border-box;padding:18px 24px 24px;display:grid;grid-template-columns:300px 1fr;grid-template-rows:54px 1fr;gap:16px 20px;--d:1}
.hm-top{grid-column:1/3;display:flex;align-items:center;justify-content:space-between}
.hm-logo{font-weight:800;letter-spacing:.04em;font-size:18px}.hm-logo i{color:var(--ac);font-style:normal}
.hm-tabs{position:relative;display:flex;gap:4px;padding:5px;border:1px solid var(--ln);border-radius:30px;background:rgba(255,255,255,.04)}
.hm-tabs button{position:relative;z-index:1;border:0;background:none;color:#9aa0b4;font-weight:600;font-size:14px;font-family:inherit;padding:8px 20px;border-radius:24px;cursor:pointer;transition:color .3s}
.hm-tabs button[aria-pressed=true]{color:#10130a}
.hm-ind{position:absolute;left:0;top:5px;bottom:5px;border-radius:24px;background:var(--ac);transition:transform .45s cubic-bezier(.2,.9,.2,1),width .45s cubic-bezier(.2,.9,.2,1)}
.hm-fans{font-size:13px;color:#9aa0b4}.hm-fans b{color:#fff;font-size:18px;margin-left:6px;font-variant-numeric:tabular-nums}
.hm-id{position:relative;border-radius:26px;border:1px solid var(--ln);background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02));padding:30px 26px;display:flex;flex-direction:column;gap:14px;transform-style:preserve-3d;will-change:transform;overflow:hidden}
.hm-id:before{content:"";position:absolute;width:260px;height:260px;right:-90px;top:-90px;border-radius:50%;background:var(--ac);filter:blur(70px);opacity:.28}
.hm-av{width:96px;height:96px;border-radius:50%;background:conic-gradient(from 200deg,var(--ac),#6a7cff,var(--ac));display:grid;place-items:center;font-size:40px;font-weight:800;color:#10130a;box-shadow:0 12px 34px var(--ac2)}
.hm-nm{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:6px}.hm-rl{font-size:14px;color:#aeb4c6;line-height:1.5}
.hm-tg{display:flex;gap:8px;flex-wrap:wrap}.hm-tg span{font-size:12px;padding:5px 11px;border-radius:20px;border:1px solid var(--ln);color:#c9cde0}
.hm-nx{margin-top:auto;border:0;border-radius:16px;background:var(--ac);color:#10130a;font-weight:800;font-size:15px;font-family:inherit;padding:14px;cursor:pointer;transition:transform .2s}.hm-nx:hover{transform:translateY(-2px)}
.hm-main{position:relative;border-radius:26px;border:1px solid var(--ln);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));overflow:hidden}
.hm-p{position:absolute;inset:0;padding:44px 52px;opacity:0;pointer-events:none;transform:translateX(calc(var(--d)*70px));filter:blur(8px);transition:opacity .45s,transform .6s cubic-bezier(.2,.9,.2,1),filter .45s}
.hm-p.on{opacity:1;pointer-events:auto;transform:none;filter:none}.hm-p.out{transform:translateX(calc(var(--d)*-70px))}
.hm-p small{font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:var(--ac)}
.hm-p h2{font-size:44px;line-height:1.18;margin:14px 0 14px;letter-spacing:-.025em;font-weight:800}.hm-p h2 b{color:var(--ac)}
.hm-p>p{font-size:17px;line-height:1.7;color:#aeb4c6;max-width:620px;margin:0}
.hm-deck{position:absolute;right:52px;bottom:46px;width:420px;height:230px}
.hm-q{position:absolute;inset:0;border-radius:22px;padding:24px 26px;box-sizing:border-box;background:#1a1d2a;border:1px solid var(--ln);font-size:16px;line-height:1.6;color:#dfe2ef;cursor:pointer;transition:transform .55s cubic-bezier(.2,.9,.2,1),opacity .4s}
.hm-q em{display:block;font:600 12px ui-monospace,Menlo,monospace;color:var(--ac);font-style:normal;margin-bottom:10px;letter-spacing:.08em}
.hm-q:nth-child(1){transform:translate(0,0) rotate(-2deg);z-index:2}.hm-q:nth-child(2){transform:translate(26px,-22px) rotate(4deg);background:#222638;opacity:.75;z-index:1}
.hm-deck.sw .hm-q:nth-child(1){transform:translate(26px,-22px) rotate(4deg);background:#222638;opacity:.75;z-index:1}.hm-deck.sw .hm-q:nth-child(2){transform:translate(0,0) rotate(-2deg);background:#1a1d2a;opacity:1;z-index:2}
.hm-tl{position:relative;height:120px;margin:50px 0 26px}.hm-tl:before{content:"";position:absolute;left:0;right:0;top:34px;height:2px;background:var(--ln)}
.hm-fill{position:absolute;left:0;top:34px;height:2px;background:var(--ac);width:0;transition:width .5s cubic-bezier(.2,.9,.2,1)}
.hm-nd{position:absolute;top:0;transform:translateX(-50%);text-align:center;cursor:pointer;border:0;background:none;color:#8d93a8;font-family:inherit;padding:0;transition:color .3s}
.hm-nd i{display:block;width:16px;height:16px;border-radius:50%;margin:27px auto 12px;background:#0d0f16;border:2px solid #4b5068;transition:all .35s}
.hm-nd b{display:block;font-size:15px}.hm-nd.on{color:#fff}.hm-nd.on i{background:var(--ac);border-color:var(--ac);box-shadow:0 0 0 7px var(--ac2);transform:scale(1.25)}
.hm-tc{border-radius:22px;padding:26px 30px;background:var(--ac2);border:1px solid var(--ln);max-width:640px;min-height:130px}
.hm-tc strong{font-size:26px;display:block;margin-bottom:8px}.hm-tc span{color:#c4c9dc;font-size:16px;line-height:1.65}
.hm-rfs{margin-top:30px;display:flex;flex-direction:column;gap:20px}
.hm-rf{font-size:27px;line-height:1.4;font-weight:700;letter-spacing:-.01em;margin:0;max-width:760px;opacity:0;transform:translateY(24px);transition:opacity .5s,transform .6s cubic-bezier(.2,.9,.2,1)}
.hm-p.on .hm-rf{opacity:1;transform:none;transition-delay:calc(var(--i)*.14s + .2s)}
.hm-p.on .hm-rfs:hover .hm-rf{opacity:.3;transition-delay:0s}.hm-p.on .hm-rfs .hm-rf:hover{opacity:1}
.hm-sys{display:flex;gap:34px;margin-top:46px}
.hm-fd{position:relative;width:250px;height:230px;cursor:pointer;perspective:800px}
.hm-fb{position:absolute;left:0;right:0;top:34px;bottom:0;border-radius:8px 18px 18px 18px;background:hsl(var(--h) 55% 38%)}.hm-fb:before{content:"";position:absolute;left:0;top:-22px;width:96px;height:26px;border-radius:10px 10px 0 0;background:hsl(var(--h) 55% 38%)}
.hm-sh{position:absolute;left:16px;right:16px;top:50px;height:150px;border-radius:8px;background:#f2efe6;color:#2a2c36;font-size:13px;font-weight:600;padding:12px 14px;box-sizing:border-box;transform:translateY(calc(var(--i)*-3px));transition:transform .55s cubic-bezier(.2,.9,.2,1)}
.hm-fd:hover .hm-sh{transform:translateY(calc(-14px - var(--i)*10px))}.hm-fd.open .hm-sh{transform:translateY(calc(-34px - var(--i)*34px)) rotate(calc((var(--i) - 1)*5deg))}
.hm-ff{position:absolute;left:0;right:0;top:78px;bottom:0;border-radius:10px 20px 20px 20px;background:linear-gradient(hsl(var(--h) 80% 62%),hsl(var(--h) 70% 50%));transform-origin:50% 100%;transition:transform .5s cubic-bezier(.2,.9,.2,1);padding:22px 22px;box-sizing:border-box;color:#10130a;box-shadow:0 -6px 20px rgba(0,0,0,.2)}
.hm-fd:hover .hm-ff{transform:rotateX(-14deg)}.hm-fd.open .hm-ff{transform:rotateX(-34deg)}
.hm-ff b{display:block;font-size:22px;font-weight:800}.hm-ff span{font-size:13px;opacity:.75}
.hm-dots{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px}.hm-dots i{width:8px;height:8px;border-radius:8px;background:#444a60;transition:all .4s}.hm-dots i.on{width:28px;background:var(--ac)}`,
mount(h,ctx){
  const P=ctx.P;
  // 你的资料：换成自己的就行
  const ME={name:'你的名字',role:'你的身份 · 你正在做的事',followers:1280,tags:['创作者','长期主义','AI 工具']};
  const ABOUT={title:'我是 <b>你的名字</b>，正在做 <b>你的方向</b>。',text:'用两三句话说清楚你是谁、做什么、相信什么。把原来长页面里“我是谁”那一整段，压成这里。',quotes:[['// 标签 A','“把一句最想让人记住的话放在这里。”'],['// 标签 B','“再放一句，点击卡片可以换到前面。”']]};
  const TL=[{y:'2022',t:'起点',d:'第一次把内容变成收入，验证了“输出就是生产力”。'},{y:'2023',t:'尝试',d:'抓住新工具的浪潮，也第一次看到理想和现实的落差。'},{y:'2024',t:'重建',d:'退回原点，把基础能力重新搭了一遍。'},{y:'2024.12',t:'转向',d:'找到一个能长期投入的方向，开始系统性地产出。'},{y:'现在',t:'并行',d:'一边做内容，一边做真实的生意，互相验证。'}];
  const REF=['所有目标最初都不是自己定义的，而是外部输入的结果。','稀缺的不是执行力，而是自我定义的能力。','我正在从“被指引的人”，变成“自己定义方向的人”。'];
  const SYS=[{n:'BLOG',d:'长文与思考记录',it:['最新文章','精选合集','归档']},{n:'VIDEO',d:'作品主阵地',it:['最新作品','系列合集','幕后']},{n:'NOTES',d:'工具与实践',it:['工具清单','教程','踩坑记录']}];
  const TABS=['我是谁','经历','反思','系统'];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  h.innerHTML=`<div class="stg hm"><div class="hm-st">
    <div class="hm-top"><div class="hm-logo">${ME.name.toUpperCase()}<i>.</i></div>
      <div class="hm-tabs"><i class="hm-ind"></i>${TABS.map((t,i)=>`<button data-i="${i}">${t}</button>`).join('')}</div>
      <div class="hm-fans">粉丝<b class="hm-fn">0</b></div></div>
    <aside class="hm-id"><div class="hm-av">${ME.name[0]}</div><div class="hm-nm">${ME.name}</div><div class="hm-rl">${ME.role}</div>
      <div class="hm-tg">${ME.tags.map(t=>`<span>${t}</span>`).join('')}</div><button class="hm-nx">下一页 →</button></aside>
    <main class="hm-main">
      <section class="hm-p" data-i="0"><small>01 · 我是谁</small><h2>${ABOUT.title}</h2><p>${ABOUT.text}</p>
        <div class="hm-deck">${ABOUT.quotes.map(([a,b])=>`<div class="hm-q"><em>${a}</em>${b}</div>`).join('')}</div></section>
      <section class="hm-p" data-i="1"><small>02 · 经历</small><h2>一路走来的 <b>五个节点</b></h2>
        <div class="hm-tl"><i class="hm-fill"></i>${TL.map((n,i)=>`<button class="hm-nd" data-i="${i}" style="left:${i/(TL.length-1)*100}%"><i></i><b>${n.y}</b></button>`).join('')}</div>
        <div class="hm-tc"><strong></strong><span></span></div></section>
      <section class="hm-p" data-i="2"><small>03 · 深层反思</small><div class="hm-rfs">${REF.map((r,i)=>`<p class="hm-rf" style="--i:${i}">${r}</p>`).join('')}</div></section>
      <section class="hm-p" data-i="3"><small>04 · 我的系统</small><h2>三个 <b>入口</b>，点开文件夹</h2>
        <div class="hm-sys">${SYS.map(s=>`<div class="hm-fd"><div class="hm-fb"></div>${s.it.map((x,i)=>`<div class="hm-sh" style="--i:${i}">${x}</div>`).join('')}<div class="hm-ff"><b>${s.n}</b><span>${s.d}</span></div></div>`).join('')}</div></section>
      <div class="hm-dots">${TABS.map(()=>'<i></i>').join('')}</div>
    </main></div></div>`;
  const root=$('.hm',h),st=$('.hm-st',h),id=$('.hm-id',h),tabs=[...h.querySelectorAll('.hm-tabs button')],ind=$('.hm-ind',h),pans=[...h.querySelectorAll('.hm-p')],dots=[...h.querySelectorAll('.hm-dots i')];
  const deck=$('.hm-deck',h),fill=$('.hm-fill',h),nds=[...h.querySelectorAll('.hm-nd')],tcT=$('.hm-tc strong',h),tcD=$('.hm-tc span',h),fn=$('.hm-fn',h);
  const ro=new ResizeObserver(()=>css(st,'transform',`translate(-50%,-50%) scale(${Math.min(root.clientWidth/1200,root.clientHeight/760)})`));ro.observe(root);
  let cur=-1,tl=0,idle=0,hover=false,lastWheel=0,tx=0,ty=0,gx=0,gy=0,age=0;
  const pick=i=>{tl=i;nds.forEach((n,j)=>n.classList.toggle('on',j===i));css(fill,'width',(i/(TL.length-1)*100)+'%');tcT.textContent=TL[i].y+' · '+TL[i].t;tcD.textContent=TL[i].d};
  const go=(n,dir)=>{n=(n+TABS.length)%TABS.length;if(n===cur)return;dir=dir||(n>cur?1:-1);if(cur<0)dir=1;st.style.setProperty('--d',dir);
    pans.forEach((p,i)=>{p.classList.toggle('on',i===n);p.classList.toggle('out',i===cur)});
    tabs.forEach((t,i)=>t.setAttribute('aria-pressed',i===n));dots.forEach((d,i)=>d.classList.toggle('on',i===n));
    css(ind,'transform',`translateX(${tabs[n].offsetLeft}px)`);css(ind,'width',tabs[n].offsetWidth+'px');
    cur=n;idle=0;ctx.status(TABS[n]);ctx.focus(n,TABS[n])};
  tabs.forEach((t,i)=>t.addEventListener('click',()=>go(i)));
  $('.hm-nx',h).addEventListener('click',()=>go(cur+1,1));
  deck.addEventListener('click',()=>deck.classList.toggle('sw'));
  nds.forEach((n,i)=>{n.addEventListener('click',()=>pick(i));n.addEventListener('mouseenter',()=>pick(i))});
  h.querySelectorAll('.hm-fd').forEach(f=>f.addEventListener('click',()=>f.classList.toggle('open')));
  // 换页：滚轮 / 方向键 / 左右滑
  root.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<8)return;e.preventDefault();const n=performance.now();if(n-lastWheel<700)return;lastWheel=n;go(cur+(e.deltaY>0?1:-1))},{passive:false});
  root.tabIndex=0;root.style.outline='none';
  root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'){go(cur+1,1);e.preventDefault()}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){go(cur-1,-1);e.preventDefault()}});
  let sx=0,sy=0;root.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;root.focus({preventScroll:true})});
  root.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(cur+(dx<0?1:-1),dx<0?1:-1)});
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5});
  root.addEventListener('pointerenter',()=>{hover=true});root.addEventListener('pointerleave',()=>{hover=false;tx=ty=0});
  pick(0);go(0,1);
  const stop=ticker(dt=>{
    idle+=dt;age+=dt;const A=ctx.auto?3:P.AUTO;if(A>0&&(!hover||ctx.auto)&&idle>=A)go(cur+1,1);
    const k=1-Math.exp(-dt*8);gx+=(tx-gx)*k;gy+=(ty-gy)*k;
    css(id,'transform',`perspective(900px) rotateY(${(gx*P.TILT).toFixed(2)}deg) rotateX(${(-gy*P.TILT).toFixed(2)}deg)`);
    css(root,'--h',String(P.HUE));
    const n=Math.round(ME.followers*(1-(1-Math.min(1,age/1.6))**3)).toLocaleString();if(fn.textContent!==n)fn.textContent=n});
  return()=>{stop();ro.disconnect()};
}});
