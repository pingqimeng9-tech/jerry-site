/* ─── 23 Folder Blog ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'folderblog',name:'Folder Blog',cat:'UI',mat:'文件夹',
spell:'博客文件夹实体展开：点最上层翻开，四个角可以拖动，封面文字像纹理一样跟着透视扭曲。',
core:'文件夹 = 会物理展开的封面 · 四个角控制封面四边形 · 标题和正文是封面上的可编辑纹理',
tags:['UI','Folder','Blog','Perspective'],
credit:{n:'callmiruko.cc 博客页的 Folder 视图与「脱离固有思维」文章封面',u:'https://callmiruko.cc/p/detach-from-fixed-mindset',own:1},
notes:['封面四个角可拖动，位置改变后用透视矩阵重新映射整个封面，文字和背景一起扭曲。','点封面空白处物理翻开；标题、分类、摘要都可以直接点进去改。','背景固定使用「脱离固有思维」文章的封面图，和博客预览保持同一张图。','点「重置四角」恢复默认；文件夹内容使用博客分类与文章标题示例。'],
knobs:[
{k:'OPEN',label:'OPEN 展开时长 ms',v:680,min:220,max:1400,step:20},
{k:'TILT',label:'TILT 合上时的倾斜角度',v:7,min:0,max:16,step:1}],
css:`.fbx{position:absolute;inset:0;background:#090b12;color:#f4f1e8;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;overflow:hidden}
.fbx-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;transform:translate(-50%,-50%);box-sizing:border-box;overflow:hidden}
.fbx-bg{position:absolute;inset:-32px;background:linear-gradient(120deg,rgba(4,8,18,.62),rgba(4,8,18,.28) 46%,rgba(4,8,18,.72)),url('/images/posts/thumbs/ndfc39abe-cover.webp') center/cover no-repeat;filter:blur(2px) saturate(.88);transform:scale(1.035)}
.fbx-bg:after{content:"";position:absolute;inset:0;background:radial-gradient(75% 70% at 65% 43%,transparent 0,rgba(4,7,15,.46) 68%,rgba(4,7,15,.9) 100%)}
.fbx-head{position:absolute;left:42px;right:42px;top:28px;display:flex;align-items:center;gap:16px;z-index:5}
.fbx-head b{font-size:17px;letter-spacing:.12em;font-weight:800}.fbx-head b i{color:#ffd25f;font-style:normal}
.fbx-head small{font:10px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:rgba(244,241,232,.48)}
.fbx-controls{margin-left:auto;display:flex;gap:8px}
.fbx-controls button{border:1px solid rgba(255,255,255,.18);background:rgba(9,12,20,.42);color:#f4f1e8;border-radius:999px;padding:9px 14px;font:600 12px inherit;cursor:pointer;backdrop-filter:blur(12px)}
.fbx-controls button:hover{background:rgba(255,255,255,.14)}
.fbx-controls button.primary{background:#ffd25f;color:#15120a;border-color:#ffd25f}
.fbx-copy{position:absolute;left:42px;top:116px;width:280px;z-index:4}
.fbx-copy small{display:block;font:700 10px ui-monospace,monospace;letter-spacing:.18em;color:#ffd25f;margin-bottom:12px}
.fbx-copy h1{font-size:44px;line-height:1.08;letter-spacing:-.04em;margin:0 0 14px;font-weight:800}
.fbx-copy p{margin:0;color:rgba(244,241,232,.56);font-size:13px;line-height:1.8;max-width:255px}
.fbx-copy em{display:block;margin-top:22px;font:11px ui-monospace,monospace;color:rgba(244,241,232,.38);font-style:normal;line-height:1.7}
.fbx-scene{position:absolute;left:355px;top:178px;width:760px;height:460px;perspective:1200px;perspective-origin:50% 35%;z-index:3}
.fbx-folder{position:absolute;inset:0;transform-style:preserve-3d}
.fbx-back{position:absolute;left:18px;right:18px;top:40px;bottom:10px;border-radius:14px 22px 22px 22px;background:linear-gradient(155deg,#26364d,#101827 72%);box-shadow:0 40px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.16)}
.fbx-back:before{content:"";position:absolute;left:0;top:-34px;width:220px;height:38px;border-radius:14px 14px 0 0;background:#26364d}
.fbx-paper{position:absolute;left:48px;right:48px;top:66px;height:338px;border-radius:10px;background:#f1eee4;color:#202737;box-shadow:0 10px 24px rgba(0,0,0,.25);padding:34px 38px;box-sizing:border-box;transform:translateY(calc(var(--i)*-7px)) rotate(calc((var(--i) - 1)*.8deg));transition:transform .65s cubic-bezier(.16,1,.3,1)}
.fbx-paper h3{font-size:24px;margin:0 0 8px;letter-spacing:-.03em}.fbx-paper p{margin:0;color:#687084;font-size:13px;line-height:1.75}.fbx-paper .p-tag{display:inline-block;margin-bottom:18px;font:700 10px ui-monospace,monospace;letter-spacing:.13em;color:#96711b;background:#ffe7a0;border-radius:999px;padding:5px 9px}
.fbx-paper .p-list{display:flex;flex-direction:column;gap:8px;margin-top:24px}.fbx-paper .p-list a{display:flex;gap:12px;align-items:center;color:#202737;text-decoration:none;padding:9px 12px;border-radius:8px;background:rgba(32,39,55,.055);font-size:13px;font-weight:600}.fbx-paper .p-list a:hover{background:rgba(32,39,55,.11)}.fbx-paper .p-list span{margin-left:auto;font:10px ui-monospace,monospace;color:#8b91a1}
.fbx-lid{position:absolute;inset:0;transform-style:preserve-3d;transform-origin:50% 100%;transition:transform var(--open,680ms) cubic-bezier(.16,1,.3,1);z-index:5}
.fbx-cover{position:absolute;inset:0;transform-origin:0 0;border-radius:18px 26px 26px 26px;background:linear-gradient(135deg,rgba(10,22,38,.25),rgba(10,22,38,.75)),url('/images/posts/thumbs/ndfc39abe-cover.webp') center/cover no-repeat;box-shadow:0 26px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.28);overflow:hidden;cursor:pointer;will-change:transform}
.fbx-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,10,20,.08),rgba(5,10,20,.48));pointer-events:none}
.fbx-cover-text{position:absolute;left:46px;right:46px;bottom:40px;z-index:2;color:#fff;text-shadow:0 2px 20px rgba(0,0,0,.4)}
.fbx-cover-text small{display:block;font:700 11px ui-monospace,monospace;letter-spacing:.2em;color:#ffd25f;margin-bottom:12px}
.fbx-cover-text h2{font-size:50px;line-height:1.04;letter-spacing:-.045em;margin:0 0 12px;font-weight:800;outline:none}
.fbx-cover-text h2:focus,.fbx-cover-text p:focus,.fbx-cover-text small:focus{outline:2px solid #ffd25f;outline-offset:5px;border-radius:4px}
.fbx-cover-text p{font-size:14px;line-height:1.65;max-width:470px;margin:0;color:rgba(255,255,255,.78);outline:none}
.fbx-handle{position:absolute;width:25px;height:25px;border-radius:50%;background:#ffd25f;border:5px solid rgba(9,12,20,.72);box-shadow:0 4px 16px rgba(0,0,0,.45);z-index:20;cursor:grab;transform:translate(-50%,-50%);touch-action:none}
.fbx-handle:active{cursor:grabbing;transform:translate(-50%,-50%) scale(1.13)}
.fbx-handle:after{content:"";position:absolute;inset:4px;border-radius:50%;border:1px solid rgba(21,18,10,.35)}
.fbx-hint{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);z-index:9;display:flex;align-items:center;gap:8px;color:rgba(244,241,232,.45);font:11px ui-monospace,monospace;white-space:nowrap}
.fbx-hint b{color:#ffd25f;font-weight:700}
.fbx.open .fbx-lid{transform:rotateX(-82deg)}
.fbx.open .fbx-handle{opacity:0;pointer-events:none}
.fbx.open .fbx-cover{cursor:default}
.fbx.open .fbx-hint{opacity:.35}
.fbx-badge{position:absolute;left:42px;bottom:31px;z-index:4;display:flex;gap:8px;align-items:center;color:rgba(244,241,232,.48);font:10px ui-monospace,monospace;letter-spacing:.1em}.fbx-badge i{width:7px;height:7px;border-radius:50%;background:#ffd25f;display:block}
@media (max-width:760px){.fbx-st{transform:translate(-50%,-50%) scale(.64)}.fbx-copy{width:230px}.fbx-copy h1{font-size:34px}.fbx-scene{left:300px}.fbx-head{left:26px;right:26px}.fbx-copy{left:26px}.fbx-controls{gap:5px}.fbx-controls button{padding:7px 10px;font-size:10px}.fbx-badge{left:26px}}
`,
mount(h,ctx){
  const P=Object.assign({OPEN:680,TILT:7},ctx&&ctx.P||{});
  const W=760,H=460;
  const POSTS={
    '思维日记':[['脱离固有思维','detach-from-fixed-mindset'],['论平衡时间优先级','balance-time-priorities'],['人不可能永远躲在罩子下面','no-one-can-hide-under-a-cover-forever']],
    '技术分享':[['写作体验升级：编辑器现在长这样','writing-experience-editor-redesign'],['无限邮箱方案','unlimited-email-solution'],['网站更新日志','website-update-log']],
    '心情随笔':[['对生活的态度','attitude-to-life'],['可是我18了耶','but-i-am-18'],['Simple Daily Diary','simple-daily-diary']],
    '建站笔记':[['博客搭建：AI + Git + Cloudflare','blog-build-ai-git-cloudflare'],['网站 UI 双层遮罩背景图','website-ui-double-mask-background-prompt'],['模板使用说明','template-usage-guide']]
  };
  const cats=Object.keys(POSTS);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h.innerHTML=`<div class="fbx"><div class="fbx-st" style="--open:${P.OPEN}ms">
    <div class="fbx-bg"></div>
    <div class="fbx-head"><b>CALLMIRUKO<i> / </i>FOLDER</b><small>BLOG ARCHIVE</small><div class="fbx-controls"><button class="fbx-reset">重置四角</button><button class="fbx-toggle primary">展开文件夹</button></div></div>
    <div class="fbx-copy"><small>FIELD NOTES / 01</small><h1 contenteditable="true" spellcheck="false">把文章<br>折成文件夹</h1><p contenteditable="true" spellcheck="false">四角可拖动，封面和文字一起透视；点空白处翻开。</p><em>背景图来自「脱离固有思维」<br>拖动黄色控制点改变封面形状</em></div>
    <div class="fbx-scene"><div class="fbx-folder">
      <div class="fbx-back"></div>
      ${[0,1,2].map(i=>{const cat=cats[i];const ps=POSTS[cat];return `<div class="fbx-paper" style="--i:${i}"><span class="p-tag">${esc(cat)}</span><h3>${esc(cat)}</h3><p>把 ${ps.length} 篇文章收进同一个文件夹，翻开后像纸页一样展开。</p><div class="p-list">${ps.map(([t,s])=>`<a href="/p/${s}" target="_blank" rel="noopener">${esc(t)}<span>READ ↗</span></a>`).join('')}</div></div>`}).join('')}
      <div class="fbx-lid"><div class="fbx-cover"><div class="fbx-cover-text"><small contenteditable="true" spellcheck="false">思维日记 · 2026</small><h2 contenteditable="true" spellcheck="false">脱离固有思维</h2><p contenteditable="true" spellcheck="false">有边界的思维，不能错/完美的思维，多元思维模型。</p></div></div></div>
      <div class="fbx-handles"></div>
    </div></div>
    <div class="fbx-hint"><b>拖动四角</b> 调整封面 · 点封面空白翻开 · 点文字直接改</div>
    <div class="fbx-badge"><i></i> 4 FOLDERS · 12 POSTS · 4 CORNERS</div>
  </div></div>`;
  const root=h.querySelector('.fbx'),st=h.querySelector('.fbx-st'),scene=h.querySelector('.fbx-scene'),lid=h.querySelector('.fbx-lid'),cover=h.querySelector('.fbx-cover'),handles=h.querySelector('.fbx-handles');
  let quad=[[0,0],[W,0],[W,H],[0,H]];
  let scale=1;
  const fit=()=>{const s=Math.min(root.clientWidth/1200,root.clientHeight/760);scale=Math.max(.2,s);st.style.transform=`translate(-50%,-50%) scale(${scale})`};
  const ro=new ResizeObserver(fit);ro.observe(root);fit();
  // 8x8 线性方程：单位矩形 -> 任意四边形
  const solve8=(A,b)=>{for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[b[c],b[p]]=[b[p],b[c]];const d=A[c][c]||1e-9;for(let j=c;j<8;j++)A[c][j]/=d;b[c]/=d;for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c];if(!f)continue;for(let j=c;j<8;j++)A[r][j]-=f*A[c][j];b[r]-=f*b[c]}}return b};
  const matrixFor=(q)=>{
    const src=[[0,0],[W,0],[W,H],[0,H]],A=[],b=[];
    for(let i=0;i<4;i++){const [x,y]=src[i],[X,Y]=q[i];A.push([x,y,1,0,0,0,-X*x,-X*y]);b.push(X);A.push([0,0,0,x,y,1,-Y*x,-Y*y]);b.push(Y)}
    const v=solve8(A,b);return `matrix3d(${v[0]},${v[3]},0,${v[6]},${v[1]},${v[4]},0,${v[7]},0,0,1,0,${v[2]},${v[5]},0,1)`;
  };
  const apply=()=>{cover.style.transform=matrixFor(quad);[...handles.children].forEach((el,i)=>{el.style.left=quad[i][0]+'px';el.style.top=quad[i][1]+'px'});};
  quad.forEach((p,i)=>{const el=document.createElement('div');el.className='fbx-handle';el.dataset.i=String(i);el.title='拖动调整封面角';handles.appendChild(el)});
  apply();
  let drag=null;
  handles.addEventListener('pointerdown',e=>{const el=e.target.closest('.fbx-handle');if(!el)return;e.preventDefault();e.stopPropagation();drag={i:+el.dataset.i,id:e.pointerId};el.setPointerCapture(e.pointerId);lid.style.transition='none'});
  handles.addEventListener('pointermove',e=>{if(!drag)return;const r=scene.getBoundingClientRect();const x=(e.clientX-r.left)/(r.width/W),y=(e.clientY-r.top)/(r.height/H);quad[drag.i]=[Math.round(x),Math.round(y)];apply()});
  const endDrag=e=>{if(!drag)return;drag=null;lid.style.transition=''};
  handles.addEventListener('pointerup',endDrag);handles.addEventListener('pointercancel',endDrag);
  const reset=()=>{quad=[[0,0],[W,0],[W,H],[0,H]];apply()};
  h.querySelector('.fbx-reset').addEventListener('click',reset);
  const toggle=()=>{root.classList.toggle('open');const open=root.classList.contains('open');h.querySelector('.fbx-toggle').textContent=open?'合上文件夹':'展开文件夹';h.querySelector('.fbx-toggle').setAttribute('aria-expanded',String(open))};
  h.querySelector('.fbx-toggle').addEventListener('click',toggle);
  cover.addEventListener('click',e=>{if(e.target.isContentEditable)return;if(root.classList.contains('open'))return;toggle()});
  // 合上时随指针轻微倾斜，展开后由 rotateX 负责
  let tiltX=0,tiltY=0,trail=0;
  scene.addEventListener('pointermove',e=>{if(drag||root.classList.contains('open'))return;const r=scene.getBoundingClientRect();tiltX=((e.clientX-r.left)/r.width-.5)*P.TILT;tiltY=((e.clientY-r.top)/r.height-.5)*P.TILT;trail=1});
  scene.addEventListener('pointerleave',()=>{tiltX=tiltY=0;trail=1});
  const stop=ticker(()=>{if(root.classList.contains('open')){lid.style.transform='';return}lid.style.transform=`rotateX(${(-tiltY*.8).toFixed(2)}deg) rotateY(${tiltX.toFixed(2)}deg)`;trail*=.9});
  ctx&&ctx.status&&ctx.status('FOLDER');
  if(ctx&&ctx.auto){let t=setTimeout(()=>toggle(),1600);stop.extra=()=>clearTimeout(t)}
  return()=>{stop&&stop();ro.disconnect();if(stop&&stop.extra)stop.extra()};
}});
