/* ─── 23 Folder Blog ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'folderblog',name:'Folder Blog',cat:'UI',mat:'文件夹',
spell:'博客的文件夹视图：文件夹 / 列表 / 图库三种看法，点文件夹翻开章节卡，背景沿用文章封面。',
core:'文章文件夹 + 三种预览方式 + 原位翻开的多张章节卡',
tags:['UI','Folder','Blog','List','Gallery'],
credit:{n:'callmiruko.cc 博客页的文件夹 / 列表 / 图库三视图与「脱离固有思维」封面',u:'https://callmiruko.cc/p/detach-from-fixed-mindset',own:1},
notes:['顶部三个切换按钮对应博客原有的文件夹、列表、图库三种看法；搜索框同时过滤三种视图。','文件夹是后板 + 封面 + 正面玻璃标题板：点一下原位翻开三张章节卡，再点封面打开文章。','背景固定使用「脱离固有思维」的封面图；文件夹封面也使用各文章自己的缩略图。','模板里的标题和摘要可以直接点击编辑，方便替换成自己的内容。'],
knobs:[
{k:'OPEN',label:'OPEN 展开时长 ms',v:520,min:180,max:1000,step:20},
{k:'GAP',label:'GAP 文件夹间距',v:22,min:8,max:40,step:1}],
css:`.fb{position:absolute;inset:0;background:#080b13;color:#f3f0e8;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;--open:520ms;--gap:22px}
.fb-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;transform:translate(-50%,-50%);box-sizing:border-box;padding:24px 32px;overflow:hidden}
.fb-bg{position:absolute;inset:-28px;background:linear-gradient(110deg,rgba(5,8,16,.85),rgba(5,8,16,.34) 52%,rgba(5,8,16,.76)),url('/images/posts/thumbs/ndfc39abe-cover.webp') center/cover no-repeat;filter:blur(2px) saturate(.9);transform:scale(1.035)}
.fb-bg:after{content:"";position:absolute;inset:0;background:radial-gradient(65% 80% at 60% 45%,transparent,rgba(5,8,16,.55) 72%,rgba(5,8,16,.88))}
.fb-head{position:relative;z-index:4;display:flex;align-items:center;gap:16px;height:58px}
.fb-brand{display:flex;align-items:baseline;gap:10px}.fb-brand b{font-size:25px;letter-spacing:-.04em}.fb-brand small{font:10px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#ffd15c}
.fb-stats{font:10px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:rgba(243,240,232,.45)}
.fb-search{margin-left:auto;width:230px;border:1px solid rgba(255,255,255,.16);background:rgba(9,13,22,.42);color:inherit;border-radius:22px;padding:9px 15px;font:13px inherit;outline:none;backdrop-filter:blur(12px)}
.fb-search:focus{border-color:#ffd15c}
.fb-seg{display:flex;gap:2px;padding:4px;background:rgba(9,13,22,.48);border:1px solid rgba(255,255,255,.12);border-radius:22px;backdrop-filter:blur(12px)}
.fb-seg button{display:flex;align-items:center;gap:6px;border:0;background:none;color:rgba(243,240,232,.55);border-radius:18px;padding:8px 12px;font:600 12px inherit;cursor:pointer;white-space:nowrap}
.fb-seg button[aria-pressed=true]{background:#ffd15c;color:#17130a}.fb-seg svg{width:14px;height:14px;fill:currentColor}
.fb-edit{border:1px solid rgba(255,255,255,.16);background:rgba(9,13,22,.42);color:rgba(243,240,232,.7);border-radius:18px;padding:8px 11px;font:600 12px inherit;cursor:pointer;backdrop-filter:blur(12px)}.fb-edit[aria-pressed=true]{border-color:#ffd15c;color:#ffd15c}
.fb-quad{border:1px solid rgba(255,255,255,.16);background:rgba(9,13,22,.42);color:rgba(243,240,232,.7);border-radius:18px;padding:8px 11px;font:600 12px inherit;cursor:pointer;backdrop-filter:blur(12px)}.fb-quad[aria-pressed=true]{border-color:#ffd15c;color:#ffd15c}
.fb-reset{display:none;border:1px solid rgba(255,209,92,.45);background:rgba(255,209,92,.08);color:#ffd15c;border-radius:18px;padding:8px 11px;font:600 12px inherit;cursor:pointer}.fb-reset.show{display:block}
.fb-quad-handle{position:absolute;width:22px;height:22px;border-radius:50%;background:#ffd15c;border:4px solid rgba(9,12,20,.78);box-shadow:0 3px 12px rgba(0,0,0,.45);z-index:8;transform:translate(-50%,-50%);cursor:grab;touch-action:none}.fb-quad-handle:active{cursor:grabbing;transform:translate(-50%,-50%) scale(1.15)}
.fb-folder.warping .fb-glass-inner{transition:none}
.fb-sub{position:relative;z-index:3;margin:15px 0 18px;display:flex;align-items:center;gap:12px;color:rgba(243,240,232,.48);font:10px ui-monospace,Menlo,monospace;letter-spacing:.1em}.fb-sub:after{content:"";height:1px;flex:1;background:rgba(255,255,255,.13)}
.fb-body{position:relative;z-index:2;height:calc(100% - 100px);overflow-y:auto;overflow-x:hidden;scrollbar-width:none}.fb-body::-webkit-scrollbar{display:none}
.fb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px var(--gap);padding:8px 6px 40px;align-items:start}
.fb-folder{position:relative;height:296px;perspective:1100px;border:0;background:none;color:inherit;padding:0;text-align:left;cursor:pointer;min-width:0;transition:opacity .3s,transform .3s}
.fb-folder.dim{opacity:.24;transform:scale(.96)}
.fb-shell{position:absolute;inset:0;border-radius:30px;overflow:hidden;background:#111525;box-shadow:0 20px 50px rgba(0,0,0,.28),0 0 0 3px rgba(16,18,28,.9)}
.fb-cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8;transform:scale(1.04);transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .4s;filter:saturate(.85)}
.fb-folder:hover .fb-cover-img{transform:scale(1.09);opacity:.92}
.fb-shell:after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(6,12,24,.05),rgba(6,12,24,.7))}
.fb-glass{position:absolute;left:9px;right:9px;bottom:9px;top:112px;z-index:3;border-radius:0 0 22px 22px;clip-path:path('M14 0H100C112 0 119 5 126 11C133 17 140 21 153 21H246Q262 21 262 39V158Q262 176 243 176H19Q0 176 0 158V15Q0 0 14 0Z');background:linear-gradient(155deg,rgba(255,255,255,.2),rgba(255,255,255,.045) 44%,rgba(110,140,255,.12)),rgba(22,25,42,.62);border:0;box-sizing:border-box;pointer-events:auto;transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.fb-glass-inner{position:absolute;inset:0;padding:32px 20px 15px;box-sizing:border-box;display:flex;flex-direction:column;transform-origin:0 0;transition:transform .25s}
.fb-folder:hover .fb-glass{transform:translateY(-5px)}
.fb-folder.open .fb-glass{transform:translateY(-9px) scale(1.025);box-shadow:0 22px 50px rgba(30,50,140,.22)}
.fb-front-title{font:700 15px/1.4 "Noto Serif SC","Songti SC",serif;color:#fff;outline:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 10px rgba(0,0,0,.4)}
.fb-front-ex{font:400 11.5px/1.55 "Noto Serif SC","Songti SC",serif;color:rgba(230,232,244,.7);margin:7px 0 0;outline:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fb-meta{position:absolute;left:20px;right:20px;bottom:13px;display:flex;gap:10px;align-items:center;color:rgba(230,232,244,.55);font:10px ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden}
.fb-meta span{overflow:hidden;text-overflow:ellipsis}.fb-meta b{color:#ffd15c;font-weight:600}
.fb-tab{position:absolute;left:0;top:-25px;width:84px;height:27px;border-radius:11px 11px 0 0;background:#20283d;z-index:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.13)}
.fb-chapter{position:absolute;left:50%;top:50%;width:156px;height:184px;margin:-92px 0 0 -78px;z-index:var(--z);opacity:0;pointer-events:none;border-radius:15px;background:linear-gradient(165deg,#fff 34%,#f3eadf);color:#292b38;padding:15px 14px;box-sizing:border-box;box-shadow:0 14px 34px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.3);transform:translate(var(--rx),var(--ry)) rotate(var(--rr)) scale(.86);transition:transform .45s cubic-bezier(.16,1,.3,1),opacity .2s}
.fb-folder.open .fb-chapter{opacity:1;pointer-events:auto;transform:translate(var(--fx),var(--fy)) rotate(var(--fr)) scale(1);transition:transform .6s cubic-bezier(.34,1.56,.64,1),opacity .18s}
.fb-chapter.c1{--rx:-5px;--ry:35px;--rr:-1deg;--fx:-132px;--fy:-114px;--fr:-8deg;--z:2}
.fb-chapter.c2{--rx:0;--ry:30px;--rr:0deg;--fx:0;--fy:-152px;--fr:1deg;--z:1}
.fb-chapter.c3{--rx:5px;--ry:35px;--rr:1deg;--fx:132px;--fy:-114px;--fr:8deg;--z:3}
.fb-chapter em{display:block;font:600 9px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#a47b28;font-style:normal;margin-bottom:9px}
.fb-chapter b{display:block;font:700 13px/1.35 "Noto Serif SC","Songti SC",serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fb-chapter p{font:400 10.5px/1.55 "Noto Serif SC","Songti SC",serif;color:#6e7080;margin:7px 0 0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.fb-chapter i{position:absolute;right:12px;bottom:8px;font:600 26px/1 ui-monospace,Menlo,monospace;color:#e6c6a2;font-style:normal;opacity:.7}
.fb-list{display:flex;flex-direction:column;gap:7px;padding:14px;max-width:880px;margin:0 auto 40px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(6,10,18,.5);backdrop-filter:blur(16px)}
.fb-group{font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#ffd15c;margin:18px 0 4px}
.fb-row{display:grid;grid-template-columns:1fr 110px 100px 64px;gap:14px;align-items:center;padding:14px 17px;border-radius:13px;background:rgba(8,13,23,.58);border:1px solid rgba(255,255,255,.08);color:inherit;text-decoration:none;font-size:14px;transition:.2s}
.fb-row:hover{background:rgba(255,255,255,.1);transform:translateX(3px)}.fb-row b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fb-row span{font:10px ui-monospace,Menlo,monospace;color:rgba(243,240,232,.45)}.fb-row i{font-style:normal;color:#ffd15c;font:10px ui-monospace,Menlo,monospace}
.fb-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;padding:4px 4px 40px}
.fb-card{position:relative;border-radius:18px;overflow:hidden;min-height:220px;background:#121725;border:1px solid rgba(255,255,255,.1);color:inherit;text-decoration:none;transition:transform .25s,box-shadow .25s}
.fb-card:hover{transform:translateY(-5px);box-shadow:0 18px 34px rgba(0,0,0,.3)}
.fb-card img{width:100%;height:160px;object-fit:cover;display:block;opacity:.87}.fb-card div{padding:14px 16px 17px}.fb-card b{display:block;font-size:15px;line-height:1.4}.fb-card small{display:block;margin-top:7px;font:10px ui-monospace,Menlo,monospace;color:rgba(243,240,232,.45)}
.fb-hint{position:absolute;right:34px;bottom:20px;z-index:5;font:10px ui-monospace,Menlo,monospace;color:rgba(243,240,232,.35)}
.fb-empty{padding:80px;text-align:center;color:rgba(243,240,232,.5)}
@media (max-width:760px){.fb-st{padding:18px 18px}.fb-head{gap:10px;flex-wrap:wrap;height:auto}.fb-search{order:4;width:100%;margin-left:0}.fb-seg{order:5;width:100%;justify-content:stretch}.fb-seg button{flex:1;justify-content:center;padding:8px 6px}.fb-body{height:calc(100% - 150px)}.fb-grid,.fb-gallery{grid-template-columns:1fr}.fb-list{max-width:none}.fb-row{grid-template-columns:1fr 70px}.fb-row span:nth-of-type(2),.fb-row i{display:none}}
`,
mount(h,ctx){
  const P=Object.assign({OPEN:520,GAP:22},ctx&&ctx.P||{});
  const BGI='/images/posts/thumbs/ndfc39abe-cover.webp';
  const POSTS=[
    {title:'脱离固有思维',cat:'思维日记',date:'2026-07-17',slug:'detach-from-fixed-mindset',cover:'/images/posts/thumbs/ndfc39abe-cover.webp',ex:'有边界的思维和不能错/完美的思维，多元思维模型。'},
    {title:'论平衡时间优先级',cat:'思维日记',date:'2026-07-17',slug:'balance-time-priorities',cover:'/images/posts/thumbs/nc1939abe-cover.webp',ex:'积累与实践，在前期时间不充足的情况下，哪个重要。'},
    {title:'人不可能永远躲在罩子下面',cat:'思维日记',date:'2026-07-16',slug:'no-one-can-hide-under-a-cover-forever',cover:BGI,ex:'从被保护的状态走向自己定义方向。'},
    {title:'写作体验升级：编辑器现在长这样',cat:'建站笔记',date:'2026-09-30',slug:'writing-experience-editor-redesign',cover:BGI,ex:'斜杠菜单、Callout、折叠块、代码高亮、表格、目录。'},
    {title:'无限邮箱方案',cat:'技术分享',date:'2026-08-14',slug:'unlimited-email-solution',cover:'/images/posts/thumbs/n3bd39abe-cover.webp',ex:'Cloudflare Email Routing 和 catch-all 的长期方案。'},
    {title:'网站更新日志',cat:'心情随笔',date:'2021-07-02',slug:'website-update-log',cover:'/images/posts/thumbs/n39239abe-cover.webp',ex:'博客与 Notion 串联，随后继续优化页面与技术分享。'}
  ];
  const CH=[['01','为什么先写下来','把目标写下来之前，先问一句为什么。'],['02','去噪音','去噪音比获取信息更重要。'],['03','复盘','复盘：我为什么总在换方向。']];
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  h.innerHTML=`<div class="fb"><div class="fb-st" style="--open:${P.OPEN}ms;--gap:${P.GAP}px">
    <div class="fb-bg"></div>
    <div class="fb-head"><div class="fb-brand"><b>Blog</b><small>FOLDER / VIEW</small></div><div class="fb-stats">${POSTS.length} 篇文章 · 3 种预览</div><input class="fb-search" placeholder="搜索文章…"><div class="fb-seg"><button data-v="folder" aria-pressed="true"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.2h9A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>文件夹</button><button data-v="list" aria-pressed="false"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></svg>列表</button><button data-v="gallery" aria-pressed="false"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>图库</button></div><button type="button" class="fb-edit">文字</button><button type="button" class="fb-quad">四角</button><button type="button" class="fb-reset">重置四角</button></div>
    <div class="fb-sub"><span>READING ROOM</span><span>·</span><span>${BGI.includes('ndfc')?'COVER: 脱离固有思维':'ARCHIVE'}</span></div>
    <div class="fb-body"></div><div class="fb-hint">点文件夹翻开 · 再点打开文章 · 点「文字」改内容</div>
  </div></div>`;
  const root=h.querySelector('.fb'),st=h.querySelector('.fb-st'),body=h.querySelector('.fb-body'),q=h.querySelector('.fb-search'),segs=[...h.querySelectorAll('.fb-seg button')];
  let mode='folder',query='',editing=false,quadMode=false,selectedFolder=null;
  const GLASS={x:9,y:112,w:262,h:176};
  const quads=new WeakMap();
  const escAttr=esc;
  const match=p=>!query||(p.title+p.cat+p.ex).toLowerCase().includes(query);
  const solve8=(A,b)=>{for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[b[c],b[p]]=[b[p],b[c]];const d=A[c][c]||1e-9;for(let j=c;j<8;j++)A[c][j]/=d;b[c]/=d;for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c];if(!f)continue;for(let j=c;j<8;j++)A[r][j]-=f*A[c][j];b[r]-=f*b[c]}}return b};
  const defaultQuad=()=>[[0,0],[GLASS.w,0],[GLASS.w,GLASS.h],[0,GLASS.h]];
  const matrixFor=q=>{const src=[[0,0],[GLASS.w,0],[GLASS.w,GLASS.h],[0,GLASS.h]],A=[],b=[];for(let i=0;i<4;i++){const [x,y]=src[i],[X,Y]=q[i];A.push([x,y,1,0,0,0,-X*x,-X*y]);b.push(X);A.push([0,0,0,x,y,1,-Y*x,-Y*y]);b.push(Y)}const v=solve8(A,b);return `matrix3d(${v[0]},${v[3]},0,${v[6]},${v[1]},${v[4]},0,${v[7]},0,0,1,0,${v[2]},${v[5]},0,1)`};
  const applyQuad=folder=>{const q=quads.get(folder)||defaultQuad();const inner=folder.querySelector('.fb-glass-inner');if(inner)inner.style.transform=matrixFor(q);folder.querySelectorAll('.fb-quad-handle').forEach((h,i)=>{h.style.left=(GLASS.x+q[i][0])+'px';h.style.top=(GLASS.y+q[i][1])+'px'})};
  const selectFolder=folder=>{if(!quadMode||!folder)return;selectedFolder=folder;body.querySelectorAll('.fb-quad-handle').forEach(h=>h.remove());body.querySelectorAll('.fb-folder.warping').forEach(f=>f.classList.remove('warping'));folder.classList.add('warping');if(!quads.has(folder))quads.set(folder,defaultQuad());const q=quads.get(folder);q.forEach((p,i)=>{const h=document.createElement('div');h.className='fb-quad-handle';h.dataset.i=String(i);folder.appendChild(h)});applyQuad(folder)};
  let qdrag=null;
  body.addEventListener('pointerdown',e=>{const h=e.target.closest('.fb-quad-handle');if(!h||!selectedFolder)return;e.preventDefault();e.stopPropagation();const f=h.closest('.fb-folder');selectFolder(f);qdrag={folder:f,i:+h.dataset.i};h.setPointerCapture(e.pointerId)});
  body.addEventListener('pointermove',e=>{if(!qdrag)return;const f=qdrag.folder,glass=f.querySelector('.fb-glass'),r=glass.getBoundingClientRect();const q=quads.get(f);q[qdrag.i]=[Math.round((e.clientX-r.left)/(r.width/GLASS.w)),Math.round((e.clientY-r.top)/(r.height/GLASS.h))];applyQuad(f)});
  const endQuad=()=>{qdrag=null};body.addEventListener('pointerup',endQuad);body.addEventListener('pointercancel',endQuad);
  const folderHtml=p=>`<button type="button" class="fb-folder" data-slug="${escAttr(p.slug)}"><div class="fb-tab"></div><div class="fb-shell"><img class="fb-cover-img" src="${p.cover}" alt="" loading="lazy"><div class="fb-glass"><div class="fb-glass-inner"><div class="fb-front-title" contenteditable="false" data-edit spellcheck="false">${esc(p.title)}</div><p class="fb-front-ex" contenteditable="false" data-edit spellcheck="false">${esc(p.ex)}</p><div class="fb-meta"><b>${esc(p.cat)}</b><span>${p.date}</span></div></div></div></div>${CH.map((c,i)=>`<div class="fb-chapter c${i+1}"><em>${c[0]} · CHAPTER</em><b>${esc(c[1])}</b><p>${esc(c[2])}</p><i>0${i+1}</i></div>`).join('')}</button>`;
  const render=()=>{
    segs.forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===mode));
    if(mode==='folder'){
      body.innerHTML=`<div class="fb-grid">${POSTS.map(p=>folderHtml(p)).join('')}</div>`;
      [...body.querySelectorAll('.fb-folder')].forEach((el,i)=>el.classList.toggle('dim',!!query&&!match(POSTS[i])));
    }else if(mode==='list'){
      const groups={};POSTS.filter(match).forEach(p=>(groups[p.cat]??=[]).push(p));
      body.innerHTML=Object.keys(groups).length?`<div class="fb-list">${Object.entries(groups).map(([cat,ps])=>`<div class="fb-group">${esc(cat).toUpperCase()}</div>${ps.map(p=>`<a class="fb-row" href="/p/${p.slug}" target="_blank" rel="noopener"><b>${esc(p.title)}</b><span>${esc(p.cat)}</span><span>${p.date}</span><i>OPEN ↗</i></a>`).join('')}`).join('')}</div>`:`<div class="fb-empty">没有匹配文章</div>`;
    }else{
      const ps=POSTS.filter(match);body.innerHTML=ps.length?`<div class="fb-gallery">${ps.map(p=>`<a class="fb-card" href="/p/${p.slug}" target="_blank" rel="noopener"><img src="${p.cover}" alt="" loading="lazy"><div><b>${esc(p.title)}</b><small>${esc(p.cat)} · ${p.date}</small></div></a>`).join('')}</div>`:`<div class="fb-empty">没有匹配文章</div>`;
    }
  };
  const setMode=m=>{mode=m;render();ctx&&ctx.status&&ctx.status(m.toUpperCase())};
  segs.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.v)));
  const editBtn=h.querySelector('.fb-edit');
  editBtn.addEventListener('click',()=>{editing=!editing;editBtn.setAttribute('aria-pressed',String(editing));body.querySelectorAll('[data-edit]').forEach(el=>el.contentEditable=String(editing));if(editing){body.querySelector('[data-edit]')?.focus();}});
  const quadBtn=h.querySelector('.fb-quad'),resetBtn=h.querySelector('.fb-reset');
  quadBtn.addEventListener('click',()=>{quadMode=!quadMode;quadBtn.setAttribute('aria-pressed',String(quadMode));resetBtn.classList.toggle('show',quadMode);body.querySelectorAll('.fb-quad-handle').forEach(h=>h.remove());body.querySelectorAll('.fb-folder.warping').forEach(f=>f.classList.remove('warping'));if(quadMode)selectFolder(body.querySelector('.fb-folder'));});
  resetBtn.addEventListener('click',()=>{if(selectedFolder){quads.set(selectedFolder,defaultQuad());applyQuad(selectedFolder)}});
  q.addEventListener('input',()=>{query=q.value.trim().toLowerCase();render()});
  body.addEventListener('click',e=>{
    const folder=e.target.closest('.fb-folder');if(!folder)return;
    if(quadMode){if(!e.target.closest('.fb-quad-handle'))selectFolder(folder);return}
    if(editing||e.target.closest('.fb-chapter'))return;
    if(!folder.classList.contains('open')){body.querySelectorAll('.fb-folder.open').forEach(x=>{if(x!==folder)x.classList.remove('open')});folder.classList.add('open');return}
    const slug=folder.dataset.slug;if(slug)window.open('/p/'+slug,'_blank','noopener');
  });
  // 章节卡在打开后点击也打开文章
  body.addEventListener('click',e=>{const card=e.target.closest('.fb-chapter');if(!card)return;const folder=card.closest('.fb-folder');if(folder)window.open('/p/'+folder.dataset.slug,'_blank','noopener')});
  const ro=new ResizeObserver(()=>{const s=Math.min(root.clientWidth/1200,root.clientHeight/760);st.style.transform=`translate(-50%,-50%) scale(${Math.max(.2,s)})`});ro.observe(root);
  // Initial scale immediately, not only after ResizeObserver's first callback.
  const s0=Math.min(root.clientWidth/1200,root.clientHeight/760);st.style.transform=`translate(-50%,-50%) scale(${Math.max(.2,s0)})`;
  render();ctx&&ctx.status&&ctx.status('FOLDER');
  return()=>ro.disconnect();
}});
