/* ─── 12 What's New ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'feed',name:"What's New",cat:'UI',mat:'更新流',
spell:'一条按时间排的更新流：分类标签 + 日期 + 标题；按分类筛选，条目依次滑入。',core:'站点的“呼吸”：最近发生了什么',tags:['UI','List','Changelog','Filter'],
credit:{n:"What's new",u:'https://carterogunsola.com/lab'},
notes:['原站把更新流放在页面底部：每条有分类（Lab / Site / Writing / Award）、日期、标题和一句话说明，末尾一个 View all。','这里复刻了这种结构：点分类只显示该类，条目用错开的延迟依次滑入；最新三条带 NEW。悬停时标题右移并露出箭头。','条目来自同一份内容数据，分类是内容的 kind。'],
knobs:[{k:'STAGGER',label:'STAGGER 错开 ms',v:55,min:0,max:200,step:5}],
css:`.fd{overflow:auto}
.fd-in{width:min(760px,88%);margin:0 auto;padding:7% 0 40px}
.fd-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.fd-h b{font-size:clamp(24px,3.4vw,40px);letter-spacing:-.04em;font-weight:600}
.fd-h button{font:11px var(--mono);opacity:.65;color:var(--st-ink)}
.fd-f{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.fd-f button{font:10px var(--mono);padding:5px 10px;border-radius:99px;border:1px solid color-mix(in srgb,var(--st-ink) 30%,transparent);color:var(--st-ink);opacity:.6}
.fd-f button[aria-pressed=true]{opacity:1;background:var(--st-ink);color:var(--st-bg)}
.fd-r{display:grid;grid-template-columns:78px 62px 1fr 18px;gap:12px;align-items:baseline;padding:14px 0;border-top:1px solid color-mix(in srgb,var(--st-ink) 20%,transparent);cursor:pointer;animation:fdin .6s var(--e) both}
@keyframes fdin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.fd-r small{font:10px var(--mono);opacity:.6}
.fd-k{font:10px var(--mono);padding:3px 7px;border-radius:5px;background:color-mix(in srgb,var(--st-ink) 12%,transparent);justify-self:start}
.fd-t b{display:block;font-size:16px;letter-spacing:-.01em;transition:transform .35s var(--e)}
.fd-t>span{display:block;font-size:13px;line-height:1.5;opacity:.65;margin-top:3px}
.fd-r:hover .fd-t b{transform:translateX(6px)}
.fd-r em{font-style:normal;opacity:0;transform:translateX(-6px);transition:.3s}
.fd-r:hover em{opacity:1;transform:none}
.fd-new{display:inline-block;font:9px var(--mono);margin-left:8px;padding:2px 5px;border-radius:4px;background:var(--st-ink);color:var(--st-bg);vertical-align:middle}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items;
  h.innerHTML=`<div class="stg fd"><div class="fd-in"><div class="fd-h"><b>What's new</b><button class="fd-all">View all →</button></div><div class="fd-f"></div><div class="fd-list"></div></div></div>`;
  const root=$('.fd',h),flt=$('.fd-f',h),list=$('.fd-list',h);
  const kinds=['ALL',...new Set(items.map(i=>i.kind))];let cur='ALL',all=false;
  const draw=()=>{list.innerHTML='';let rows=items.map((it,i)=>({it,i})).filter(x=>cur==='ALL'||x.it.kind===cur);if(!all)rows=rows.slice(0,6);rows.forEach((x,n)=>{const r=el('div','fd-r',`<small>${x.it.date.slice(0,6)}</small><span class="fd-k">${x.it.kind}</span><div class="fd-t"><b>${esc(x.it.title)}${x.i<3?'<span class="fd-new">NEW</span>':''}</b><span>${esc(x.it.sum)}</span></div><em>→</em>`);r.style.animationDelay=(n*P.STAGGER)+'ms';r.addEventListener('click',()=>ctx.focus(x.i));list.appendChild(r)});$('.fd-all',h).textContent=all?'Show less ↑':'View all →'};
  kinds.forEach(k=>{const b=el('button','',k);b.setAttribute('aria-pressed',k===cur);b.onclick=()=>{cur=k;flt.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.textContent===k));draw()};flt.appendChild(b)});
  $('.fd-all',h).onclick=()=>{all=!all;draw()};
  draw();
  let di=0;ctx.demo(()=>{const k=kinds[di++%kinds.length];flt.querySelectorAll('button').forEach(x=>{if(x.textContent===k)x.click()});if(di%kinds.length===0){all=!all;draw()}},2600);
  ctx.status('IDLE');
}});
