/* ─── 23 Folder Blog ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'folderblog',name:'Folder Blog',cat:'UI',mat:'文件夹',
spell:'文章按文件夹归档：悬停开盖，点击展开，把文件拖到别的文件夹里就能换分类。',core:'文件夹 = 一个会开盖的容器，文件是可以拖动的卡片',tags:['UI','Folder','Drag','Blog'],
credit:{n:'callmiruko.cc 博客页的“图库 / 列表 / 文件夹”三种视图（交互思路参考，样式与代码为原创）',u:'https://callmiruko.cc/blog.html',own:1},
notes:['博客页有三种看法：文件夹、列表、图库，右上角切换，搜索框对三种视图同时生效（文件夹视图里没命中的会变暗）。','文件夹是纯 CSS 搭的：后板 + 三张纸 + 前盖。悬停时前盖绕底边转开、纸张探头；点击后用 FLIP（先量位置再反推动画）从文件夹的位置放大成文件面板。','打开的面板里，文件卡片可以拖。拖到顶部其他文件夹的小标签上松手，就会换分类，数量同步变化。拖动不到 6px 算点击，会打开阅读面板。','FAN 控制纸张探头的高度，LID 控制前盖开合角度，OPEN 控制展开动画时长，都是实时生效。'],
knobs:[
{k:'FAN',label:'FAN 纸张探头高度',v:14,min:0,max:40,step:1},
{k:'LID',label:'LID 前盖开合角度',v:22,min:0,max:50,step:1},
{k:'OPEN',label:'OPEN 展开时长 ms',v:420,min:100,max:1000,step:20},
{k:'VIEW',label:'VIEW 起始视图（0文件夹 1列表 2图库）',v:0,min:0,max:2,step:1,remount:true}],
css:`.fb{background:#11131b;color:#eceef6;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;--fan:14;--lid:22;--open:420ms}
.fb-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;box-sizing:border-box;padding:22px 28px;display:flex;flex-direction:column;gap:18px;overflow:hidden}
.fb-hd{display:flex;align-items:center;gap:18px}.fb-hd b{font-size:26px;letter-spacing:-.02em}.fb-hd small{color:#8d93a8;font-size:13px}
.fb-q{margin-left:auto;width:240px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:inherit;padding:10px 16px;font-size:14px;font-family:inherit;outline:none}.fb-q:focus{border-color:#f5c451}
.fb-seg{display:flex;padding:4px;border-radius:22px;background:rgba(255,255,255,.06);gap:2px}.fb-seg button{border:0;background:none;color:#9aa0b4;font-weight:600;font-size:13px;font-family:inherit;padding:8px 16px;border-radius:18px;cursor:pointer}.fb-seg button[aria-pressed=true]{background:#f5c451;color:#16130a}
.fb-body{position:relative;flex:1;min-height:0}
.fb-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 26px;padding:34px 10px 0}
.fb-f{position:relative;height:186px;perspective:800px;cursor:pointer;transition:opacity .3s,transform .3s}.fb-f.dim{opacity:.25;transform:scale(.96)}
.fb-fb{position:absolute;left:0;right:0;top:26px;bottom:0;border-radius:8px 18px 18px 18px;background:color-mix(in srgb,var(--c) 62%,#000)}.fb-fb:before{content:"";position:absolute;left:0;top:-20px;width:84px;height:24px;border-radius:9px 9px 0 0;background:color-mix(in srgb,var(--c) 62%,#000)}
.fb-sh{position:absolute;left:14px;right:14px;top:40px;height:130px;border-radius:7px;background:#f3f0e7;color:#2b2d37;font-size:12px;font-weight:600;padding:10px 12px;box-sizing:border-box;line-height:1.4;overflow:hidden;transform:translateY(calc(var(--i)*-2px));transition:transform .5s cubic-bezier(.2,.9,.2,1)}
.fb-f:hover .fb-sh{transform:translateY(calc(var(--fan)*-1px - var(--i)*var(--fan)*.5px))}
.fb-ff{position:absolute;left:0;right:0;top:66px;bottom:0;border-radius:10px 20px 20px 20px;background:linear-gradient(var(--c),color-mix(in srgb,var(--c) 78%,#000));transform-origin:50% 100%;transition:transform .5s cubic-bezier(.2,.9,.2,1);padding:18px 20px;box-sizing:border-box;color:#15130a;box-shadow:0 -6px 18px rgba(0,0,0,.2)}
.fb-f:hover .fb-ff{transform:rotateX(calc(var(--lid)*-1deg))}.fb-ff b{display:block;font-size:20px;font-weight:800}.fb-ff span{font-size:13px;opacity:.75}
.fb-ff em{position:absolute;right:14px;top:14px;min-width:24px;height:24px;border-radius:12px;background:rgba(0,0,0,.2);display:grid;place-items:center;font:700 12px ui-monospace,monospace;font-style:normal;padding:0 6px;box-sizing:border-box}
.fb-list{display:flex;flex-direction:column;gap:6px;overflow:hidden;height:100%}
.fb-gh{font:700 12px ui-monospace,monospace;letter-spacing:.1em;color:var(--c);margin:12px 0 4px}
.fb-row{display:grid;grid-template-columns:1fr 100px 90px 70px;gap:12px;align-items:center;padding:11px 16px;border-radius:12px;background:rgba(255,255,255,.04);cursor:pointer;font-size:14px;transition:background .2s,transform .2s}.fb-row:hover{background:rgba(255,255,255,.1);transform:translateX(4px)}.fb-row span{color:#8d93a8;font-size:13px}
.fb-gal{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding-top:6px;align-content:start}
.fb-card{border-radius:18px;overflow:hidden;background:#1a1d29;cursor:pointer;transition:transform .3s cubic-bezier(.2,.9,.2,1);border:1px solid rgba(255,255,255,.07)}.fb-card:hover{transform:translateY(-6px) rotate(-.6deg)}
.fb-cv{height:110px;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 40%,#1a1d29));display:flex;align-items:flex-end;padding:12px;font-weight:800;font-size:28px;font-family:inherit;color:rgba(0,0,0,.35)}
.fb-ct{padding:14px 16px 16px;font-size:14px;font-weight:700;line-height:1.4}.fb-ct small{display:block;color:#8d93a8;font-weight:500;margin-top:6px}
.fb-open{position:absolute;inset:0;z-index:20;background:#161924;border-radius:22px;border:1px solid rgba(255,255,255,.1);padding:24px 28px;display:flex;flex-direction:column;gap:16px;box-shadow:0 30px 80px rgba(0,0,0,.5)}.fb-open[hidden]{display:none}
.fb-bc{display:flex;align-items:center;gap:12px;font-size:15px}.fb-bc button{border:0;border-radius:18px;background:rgba(255,255,255,.08);color:inherit;font-weight:600;font-size:13px;font-family:inherit;padding:8px 14px;cursor:pointer}.fb-bc b{font-size:22px}
.fb-chips{margin-left:auto;display:flex;gap:10px}.fb-chip{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:14px;border:1.5px dashed rgba(255,255,255,.22);font-size:13px;font-weight:600;transition:all .2s}.fb-chip i{width:10px;height:10px;border-radius:3px;background:var(--c)}.fb-chip.hot{border-style:solid;border-color:var(--c);background:rgba(255,255,255,.1);transform:scale(1.08)}.fb-chip.me{opacity:.35}
.fb-files{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;align-content:start;overflow:hidden}
.fb-file{position:relative;height:150px;border-radius:16px;background:#1f2331;border:1px solid rgba(255,255,255,.08);padding:16px;box-sizing:border-box;cursor:grab;touch-action:none;user-select:none;transition:transform .25s,background .25s;animation:fb-in .5s both;animation-delay:calc(var(--n)*50ms)}.fb-file:hover{background:#262b3d;transform:translateY(-4px)}
@keyframes fb-in{from{opacity:0;transform:translateY(24px) scale(.94)}}
.fb-file:before{content:"";display:block;width:30px;height:38px;border-radius:5px;background:#f3f0e7;margin-bottom:12px;box-shadow:inset 0 -14px 0 var(--c)}.fb-file b{font-size:14px;line-height:1.4;display:block}.fb-file small{position:absolute;left:16px;bottom:14px;color:#8d93a8;font-size:12px}
.fb-ghost{position:absolute;z-index:60;pointer-events:none;opacity:.92;transform:rotate(4deg) scale(1.05);box-shadow:0 20px 40px rgba(0,0,0,.5)}
.fb-read{position:absolute;right:0;top:0;bottom:0;width:480px;z-index:40;background:#f4f1e8;color:#23252f;padding:44px 40px;box-sizing:border-box;transform:translateX(0);transition:transform .5s cubic-bezier(.2,.9,.2,1);overflow:hidden;box-shadow:-30px 0 60px rgba(0,0,0,.4)}.fb-read[hidden]{display:block;transform:translateX(110%);visibility:hidden}
.fb-read h3{font-size:30px;line-height:1.25;margin:10px 0 8px;letter-spacing:-.02em}.fb-read small{color:#7a7c88;font-size:13px}.fb-read p{font-size:16px;line-height:1.85;color:#454856}
.fb-x{position:absolute;right:22px;top:20px;border:0;border-radius:50%;width:36px;height:36px;background:#e0dccf;font-size:16px;cursor:pointer}
.fb-toast{position:absolute;left:50%;bottom:26px;transform:translate(-50%,20px);opacity:0;background:#f5c451;color:#16130a;font-weight:700;font-size:14px;padding:11px 20px;border-radius:24px;transition:all .35s;z-index:70;pointer-events:none}.fb-toast.on{opacity:1;transform:translate(-50%,0)}`,
mount(h,ctx){
  const P=ctx.P;
  // 文件夹与文章：换成自己的数据即可（t 标题 / d 日期 / v 浏览量）
  const DATA=[
    {id:'think',name:'思维输出',c:'#f5c451',posts:[{t:'把目标写下来之前，先问一句为什么',d:'2026-09-28',v:812},{t:'去噪音比获取信息更重要',d:'2026-09-12',v:1304},{t:'第一性原理：从零开始问',d:'2026-08-30',v:655},{t:'每天只死磕一件事',d:'2026-08-11',v:498},{t:'复盘：我为什么总在换方向',d:'2026-07-21',v:377}]},
    {id:'tech',name:'技术笔记',c:'#6df27f',posts:[{t:'把 Notion 当成博客数据库',d:'2026-09-30',v:2210},{t:'静态站上线前的 5 个检查',d:'2026-09-02',v:940},{t:'把 CSS 动画写成时间的函数',d:'2026-08-19',v:1180},{t:'用 WebAudio 做一台迷你合成器',d:'2026-07-30',v:733}]},
    {id:'life',name:'日常记录',c:'#7aa7ff',posts:[{t:'周末的菜市场',d:'2026-09-21',v:301},{t:'一次失败的早起实验',d:'2026-09-05',v:422},{t:'新买的机械键盘',d:'2026-08-02',v:266}]},
    {id:'draft',name:'草稿箱',c:'#f58bb5',posts:[{t:'还没想好的标题',d:'2026-10-03',v:12},{t:'关于出海的几点想法',d:'2026-09-15',v:35}]}];
  const BODY=['这里是文章正文的示意。把你的真实内容接进来之后，阅读面板会从右侧滑出，显示标题、日期和正文。','你可以把这一段换成 Markdown 渲染结果，或者从 Notion、本地文件读取。面板本身只负责滑入滑出和排版。','拖动文件到别的文件夹可以改分类，搜索框会同时过滤三种视图。'];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const esc=s=>s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
  h.innerHTML=`<div class="stg fb"><div class="fb-st">
    <div class="fb-hd"><b>Blog</b><small class="fb-stat"></small><input class="fb-q" placeholder="搜索文章…"><div class="fb-seg"><button data-v="0">文件夹</button><button data-v="1">列表</button><button data-v="2">图库</button></div></div>
    <div class="fb-body"></div>
    <div class="fb-open" hidden><div class="fb-bc"><button class="fb-back">← 全部</button><b class="fb-on"></b><div class="fb-chips"></div></div><div class="fb-files"></div></div>
    <aside class="fb-read" hidden><button class="fb-x">✕</button><small></small><h3></h3><div></div></aside>
    <div class="fb-toast"></div></div></div>`;
  const root=$('.fb',h),st=$('.fb-st',h),body=$('.fb-body',h),panel=$('.fb-open',h),files=$('.fb-files',h),chips=$('.fb-chips',h),rd=$('.fb-read',h),toast=$('.fb-toast',h),q=$('.fb-q',h),segs=[...h.querySelectorAll('.fb-seg button')];
  let S=1,view=P.VIEW|0,openId=null,query='',tt=0;
  const ro=new ResizeObserver(()=>{S=Math.min(root.clientWidth/1200,root.clientHeight/760);css(st,'transform',`translate(-50%,-50%) scale(${S})`)});ro.observe(root);
  const match=p=>!query||p.t.toLowerCase().includes(query);
  const say=t=>{toast.textContent=t;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),1600)};
  const read=(f,p)=>{$('small',rd).textContent=f.name+' · '+p.d+' · 浏览 '+p.v;$('h3',rd).textContent=p.t;$('div',rd).innerHTML=BODY.map(x=>`<p>${esc(x)}</p>`).join('');rd.hidden=false};
  const find=el=>{const f=DATA[+el.dataset.f];return[f,f.posts[+el.dataset.p]]};
  function render(){
    segs.forEach((b,i)=>b.setAttribute('aria-pressed',i===view));
    const total=DATA.reduce((n,f)=>n+f.posts.length,0);$('.fb-stat',h).textContent=DATA.length+' 个文件夹 · '+total+' 篇';
    if(view===0){
      body.innerHTML='<div class="fb-grid">'+DATA.map((f,i)=>{const hit=f.posts.filter(match).length;
        return`<div class="fb-f${query&&!hit?' dim':''}" data-f="${i}" style="--c:${f.c}"><div class="fb-fb"></div>${f.posts.slice(0,3).map((p,k)=>`<div class="fb-sh" style="--i:${k}">${esc(p.t)}</div>`).join('')}<div class="fb-ff"><em>${query?hit+'/':''}${f.posts.length}</em><b>${esc(f.name)}</b><span>${f.posts.length} 篇文章</span></div></div>`}).join('')+'</div>';
    }else if(view===1){
      body.innerHTML='<div class="fb-list">'+DATA.map((f,i)=>{const ps=f.posts.map((p,k)=>[p,k]).filter(([p])=>match(p));return ps.length?`<div class="fb-gh" style="--c:${f.c}">${esc(f.name).toUpperCase()}</div>`+ps.map(([p,k])=>`<div class="fb-row" data-f="${i}" data-p="${k}"><b>${esc(p.t)}</b><span>${esc(f.name)}</span><span>${p.d}</span><span>👁 ${p.v}</span></div>`).join(''):''}).join('')+'</div>';
    }else{
      body.innerHTML='<div class="fb-gal">'+DATA.flatMap((f,i)=>f.posts.map((p,k)=>[f,i,p,k])).filter(([f,i,p])=>match(p)).slice(0,12).map(([f,i,p,k])=>`<div class="fb-card" data-f="${i}" data-p="${k}" style="--c:${f.c}"><div class="fb-cv">${esc(f.name)}</div><div class="fb-ct">${esc(p.t)}<small>${p.d} · 👁 ${p.v}</small></div></div>`).join('')+'</div>';
    }
  }
  function renderOpen(){
    const f=DATA[openId];$('.fb-on',h).textContent=f.name;
    chips.innerHTML=DATA.map((g,i)=>`<div class="fb-chip${i===openId?' me':''}" data-f="${i}" style="--c:${g.c}"><i></i>${esc(g.name)} · ${g.posts.length}</div>`).join('');
    files.innerHTML=f.posts.map((p,k)=>match(p)?`<div class="fb-file" data-f="${openId}" data-p="${k}" style="--c:${f.c};--n:${k}"><b>${esc(p.t)}</b><small>${p.d}</small></div>`:'').join('');
  }
  // 点击文件夹：从它的位置放大成文件面板（FLIP）
  const openFolder=(i,el)=>{
    openId=i;renderOpen();panel.hidden=false;ctx.status('OPEN · '+DATA[i].name);
    const a=el.getBoundingClientRect(),b=st.getBoundingClientRect();
    const sx=a.width/b.width,sy=a.height/b.height,dx=(a.left-b.left)/S,dy=(a.top-b.top)/S;
    panel.style.transformOrigin='0 0';
    panel.animate([{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`,opacity:0},{transform:'none',opacity:1}],{duration:P.OPEN,easing:'cubic-bezier(.2,.9,.2,1)'});
  };
  const closeFolder=()=>{if(openId==null)return;const el=body.querySelector(`.fb-f[data-f="${openId}"]`);openId=null;ctx.status('ALL');
    if(!el){panel.hidden=true;return}
    const a=el.getBoundingClientRect(),b=st.getBoundingClientRect();
    const an=panel.animate([{transform:'none',opacity:1},{transform:`translate(${(a.left-b.left)/S}px,${(a.top-b.top)/S}px) scale(${a.width/b.width},${a.height/b.height})`,opacity:0}],{duration:P.OPEN*.8,easing:'cubic-bezier(.6,0,.4,1)'});
    an.onfinish=()=>{if(openId==null)panel.hidden=true}};
  segs.forEach((b,i)=>b.addEventListener('click',()=>{view=i;render()}));
  q.addEventListener('input',()=>{query=q.value.trim().toLowerCase();render();if(openId!=null)renderOpen()});
  body.addEventListener('click',e=>{const f=e.target.closest('.fb-f');if(f){openFolder(+f.dataset.f,f);return}const r=e.target.closest('[data-p]');if(r){const[g,p]=find(r);read(g,p)}});
  $('.fb-back',h).addEventListener('click',closeFolder);
  $('.fb-x',h).addEventListener('click',()=>{rd.hidden=true});
  root.tabIndex=0;root.style.outline='none';root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!rd.hidden)rd.hidden=true;else closeFolder()}});
  // 拖拽：文件卡片 → 顶部文件夹标签。移动不到 6px 算点击
  let drag=null;
  files.addEventListener('pointerdown',e=>{const el=e.target.closest('.fb-file');if(!el)return;drag={el,x:e.clientX,y:e.clientY,g:null};el.setPointerCapture(e.pointerId);root.focus({preventScroll:true})});
  files.addEventListener('pointermove',e=>{
    if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.g&&Math.hypot(dx,dy)>6){const g=drag.el.cloneNode(true);g.className='fb-file fb-ghost';g.style.cssText=`--c:${DATA[+drag.el.dataset.f].c};width:${drag.el.offsetWidth}px;height:${drag.el.offsetHeight}px;animation:none`;st.appendChild(g);drag.g=g;drag.el.style.opacity=.3}
    if(drag.g){const b=st.getBoundingClientRect();css(drag.g,'left',((e.clientX-b.left)/S-drag.el.offsetWidth/2)+'px');css(drag.g,'top',((e.clientY-b.top)/S-30)+'px');
      const t=h.ownerDocument.elementFromPoint(e.clientX,e.clientY),c=t&&t.closest('.fb-chip');chips.querySelectorAll('.fb-chip').forEach(x=>x.classList.toggle('hot',x===c&&!x.classList.contains('me')))}});
  const end=e=>{
    if(!drag)return;const d=drag;drag=null;
    if(!d.g){const[g,p]=find(d.el);read(g,p);return}
    const t=h.ownerDocument.elementFromPoint(e.clientX,e.clientY),c=t&&t.closest('.fb-chip');d.g.remove();d.el.style.opacity='';
    if(c&&!c.classList.contains('me')){const from=DATA[+d.el.dataset.f],to=DATA[+c.dataset.f],[p]=from.posts.splice(+d.el.dataset.p,1);to.posts.unshift(p);say('已移动到「'+to.name+'」');renderOpen();render()}
    else renderOpen()};
  files.addEventListener('pointerup',end);files.addEventListener('pointercancel',end);
  render();ctx.status('ALL');
  const stop=ticker(()=>{css(root,'--fan',String(P.FAN));css(root,'--lid',String(P.LID))});
  return()=>{stop();ro.disconnect();clearTimeout(tt)};
}});
