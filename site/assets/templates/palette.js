/* ─── 11 Command Menu ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'palette',name:'Command Menu',cat:'UI',mat:'面板',
spell:'按 ⌘K → 一个可搜索的命令面板：页面、工具、主题，↑↓ 选择，回车执行。',core:'所有入口收进一个键盘优先的面板',tags:['UI','Keyboard','Navigation','Theme'],
credit:{n:'⌘K 菜单',u:'https://carterogunsola.com'},
notes:['原站每个页面都有 ⌘K：分成 Pages、Tools、Theme 三组，底部提示 ↑↓ 选择、↵ 确认、esc 关闭。','这里复刻了结构和键盘行为：输入即过滤，空组自动隐藏，方向键循环，回车执行并关闭。选中某个“页面”会改变背后页面的标题；选主题会切换这个舞台的明暗。','面板打开时焦点锁在输入框里，Esc 关闭后焦点回到页面。'],
knobs:[],
css:`.pl{--pb:var(--st-bg);--pf:var(--st-ink)}
.pl[data-t=light]{--st-bg:#d6d6d5;--st-ink:#1e1e1e}.pl[data-t=dark]{--st-bg:#1e1e1e;--st-ink:#d6d6d5}
.pl-page{position:absolute;inset:0;padding:5% 6%;display:flex;flex-direction:column;justify-content:center;gap:14px}
.pl-hud{position:absolute;left:14px;top:12px;display:flex;gap:6px;font:10px var(--mono)}
.pl-hud span{padding:3px 7px;border-radius:5px;background:color-mix(in srgb,var(--st-ink) 12%,transparent);opacity:.8}
.pl-title{font-size:clamp(30px,6vw,84px);letter-spacing:-.045em;line-height:1;font-weight:600;max-width:11em}
.pl-sub{font-size:15px;line-height:1.6;max-width:30em;opacity:.7}
.pl-open{align-self:flex-start;font:12px var(--mono);padding:8px 14px;border:1px solid currentColor;border-radius:8px;color:var(--st-ink)}
.pl-scrim{position:absolute;inset:0;background:#0007;display:grid;place-items:start center;padding-top:10%;z-index:5}
.pl-scrim[hidden]{display:none}
.pl-box{width:min(440px,90%);border-radius:14px;background:var(--st-bg);color:var(--st-ink);border:1px solid color-mix(in srgb,var(--st-ink) 22%,transparent);box-shadow:0 30px 80px -20px #000a;overflow:hidden;animation:plin .28s var(--e)}
@keyframes plin{from{transform:translateY(-10px) scale(.97);opacity:0}to{transform:none;opacity:1}}
.pl-box input{width:100%;padding:14px 16px;background:none;border:0;border-bottom:1px solid color-mix(in srgb,var(--st-ink) 18%,transparent);font-size:15px;color:inherit;user-select:text;-webkit-user-select:text}
.pl-box input:focus-visible{outline:none}
.pl-box ul{list-style:none;max-height:260px;overflow:auto;padding:6px}
.pl-g{font:10px var(--mono);opacity:.5;padding:8px 10px 4px}
.pl-i{display:flex;justify-content:space-between;padding:8px 10px;border-radius:7px;font-size:14px;cursor:pointer}
.pl-i small{font:10px var(--mono);opacity:.5}
.pl-i.sel{background:color-mix(in srgb,var(--st-ink) 14%,transparent)}
.pl-box footer{display:flex;gap:14px;padding:9px 14px;border-top:1px solid color-mix(in srgb,var(--st-ink) 18%,transparent);font:10px var(--mono);opacity:.55}
.pl-toast{position:absolute;right:14px;bottom:14px;font:11px var(--mono);padding:8px 12px;border-radius:8px;background:color-mix(in srgb,var(--st-ink) 14%,transparent);opacity:0;transition:opacity .3s}
.pl-toast.show{opacity:1}`,
mount(h,ctx){
  const items=ctx.items;
  h.innerHTML=`<div class="stg pl"><div class="pl-hud"><span>UT::<b class="pl-t">--:--</b></span><span>FPS::60</span><span>PRESENCE::ON</span></div><div class="pl-page"><h1 class="pl-title"></h1><p class="pl-sub"></p><button class="pl-open">⌘K</button></div><div class="pl-scrim" hidden><div class="pl-box"><input placeholder="Search pages, tools, theme…"><ul></ul><footer><span>↑↓ Navigate</span><span>↵ Select</span><span>esc Close</span></footer></div></div><div class="pl-toast"></div></div>`;
  const root=$('.pl',h),scrim=$('.pl-scrim',h),inp=$('input',h),ul=$('ul',h),title=$('.pl-title',h),sub=$('.pl-sub',h),toast=$('.pl-toast',h);
  const clock=setInterval(()=>{$('.pl-t',h).textContent=new Date().toTimeString().slice(0,5)},1000);$('.pl-t',h).textContent=new Date().toTimeString().slice(0,5);
  const GROUPS=[{g:'Pages',a:items.slice(0,5).map((it,i)=>({l:it.title,s:'N°'+pad(i+1),f:()=>setPage(i)}))},{g:'Tools',a:[{l:'Record',s:'/record',f:()=>say('● recording…')},{l:'Toggle live presence',s:'P',f:()=>say('presence toggled')}]},{g:'Theme',a:[{l:'Light',s:'',f:()=>{root.dataset.t='light'}},{l:'Dark',s:'',f:()=>{root.dataset.t='dark'}},{l:'System',s:'',f:()=>{delete root.dataset.t}}]}];
  let rows=[],sel=0,scr=null;
  const say=t=>{toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500)};
  function setPage(i){const it=items[i];const target=it.title;let k=0;clearInterval(scr);scr=setInterval(()=>{k++;title.textContent=target.split('').map((ch,j)=>j<k?ch:String.fromCharCode(0x2591+Math.floor(Math.random()*3))).join('');if(k>=target.length){clearInterval(scr);title.textContent=target}},28);sub.textContent=it.sum;ctx.focus(i)}
  setPage(0);
  function draw(){const q=inp.value.trim().toLowerCase();rows=[];ul.innerHTML='';GROUPS.forEach(g=>{const m=g.a.filter(x=>!q||(x.l+g.g).toLowerCase().includes(q));if(!m.length)return;ul.appendChild(el('div','pl-g',g.g));m.forEach(x=>{const idx=rows.length;rows.push(x);const li=el('div','pl-i'+(idx===sel?' sel':''),`<span>${esc(x.l)}</span><small>${esc(x.s)}</small>`);li.onclick=()=>pick(idx);ul.appendChild(li)})});sel=clamp(sel,0,Math.max(0,rows.length-1));ul.querySelectorAll('.pl-i').forEach((n,i)=>n.classList.toggle('sel',i===sel))}
  function pick(i){const r=rows[i];close();if(r)r.f()}
  function open(){scrim.hidden=false;inp.value='';sel=0;draw();inp.focus();ctx.status('OPEN')}
  function close(){scrim.hidden=true;ctx.status('IDLE')}
  inp.addEventListener('input',()=>{sel=0;draw()});
  inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%rows.length;draw()}else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+rows.length)%rows.length;draw()}else if(e.key==='Enter')pick(sel);else if(e.key==='Escape'){e.stopPropagation();close()}});
  scrim.addEventListener('pointerdown',e=>{if(e.target===scrim)close()});
  $('.pl-open',h).addEventListener('click',open);
  const key=e=>{if(!h.isConnected||false)return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopImmediatePropagation();scrim.hidden?open():close()}};addEventListener('keydown',key,true);
  ctx.demo(async()=>{open();await wait(500);for(const ch of'dr'){inp.value+=ch;sel=0;draw();await wait(260)}await wait(300);sel=Math.min(1,rows.length-1);draw();await wait(500);pick(sel)},7500);
  ctx.status('IDLE');
  return()=>{clearInterval(clock);clearInterval(scr);removeEventListener('keydown',key,true)};
}});
