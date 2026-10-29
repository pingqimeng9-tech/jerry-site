/* ─── 23 Folder Blog ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'folderblog',name:'Folder Blog',cat:'UI',mat:'文件夹',
spell:'只复刻博客里的一个圆角文件夹：黑白背景、实体展开、四角可调，文字跟着封面扭曲。',
core:'单个圆角文件夹 · 黑色/白色背景 · 四角透视 · 可编辑文字',
tags:['UI','Folder','Monochrome','Perspective'],
credit:{n:'callmiruko.cc 博客文件夹的单个文件夹与「论平衡时间优先级」封面',u:'https://callmiruko.cc/p/balance-time-priorities',own:1},
notes:['模板里只有一个文件夹，不再带博客标题、搜索、列表或图库外壳。','背景和封面统一黑白；文件夹点开后显出章节卡。','「四角」打开四个控制点，拖动会透视扭曲封面和封面上的文字；「文字」打开编辑。'],
knobs:[{k:'OPEN',label:'OPEN 展开时长 ms',v:620,min:220,max:1200,step:20}],
css:`.fb{position:absolute;inset:0;background:#08090b;color:#f4f4f4;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;overflow:hidden}
.fb-bg{position:absolute;inset:-30px;background:linear-gradient(120deg,rgba(0,0,0,.7),rgba(0,0,0,.2) 48%,rgba(0,0,0,.8)),url('/images/posts/thumbs/nc1939abe-cover.webp') center/cover no-repeat;filter:grayscale(1) blur(3px) contrast(1.05);transform:scale(1.04)}
.fb-bg:after{content:"";position:absolute;inset:0;background:radial-gradient(65% 70% at 55% 45%,transparent,rgba(0,0,0,.55) 70%,#000 100%)}
.fb-stage{position:absolute;inset:0;display:grid;place-items:center;padding:clamp(20px,4vw,54px)}
.fb-folder{position:relative;width:min(460px,82vw);aspect-ratio:480/520;perspective:1200px;filter:grayscale(1)}
.fb-tab{position:absolute;left:3%;top:-3.6%;width:28%;height:5%;border-radius:16px 16px 0 0;background:#1b1c20;border:1px solid rgba(255,255,255,.16);border-bottom:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.fb-back{position:absolute;inset:3% 0 0;border-radius:24px;background:linear-gradient(145deg,#292a2e,#101114);border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 90px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2)}
.fb-paper{position:absolute;left:6%;right:6%;top:12%;height:68%;border-radius:10px;background:#ededed;color:#1b1c1f;box-shadow:0 12px 26px rgba(0,0,0,.28);padding:clamp(18px,3vw,30px);box-sizing:border-box;transform:translateY(calc(var(--i)*-6px));transition:transform .65s cubic-bezier(.16,1,.3,1),opacity .3s;z-index:1;opacity:.9}
.fb-paper:nth-child(1){--i:0}.fb-paper:nth-child(2){--i:1}.fb-paper:nth-child(3){--i:2}
.fb-paper em{display:block;font:700 9px ui-monospace,monospace;letter-spacing:.14em;color:#757575;font-style:normal;margin-bottom:16px}.fb-paper h3{font:700 clamp(17px,2.4vw,24px)/1.3 "Noto Serif SC","Songti SC",serif;margin:0 0 8px;color:#111}.fb-paper p{font:400 12px/1.7 "Noto Serif SC","Songti SC",serif;color:#666;margin:0}.fb-paper i{position:absolute;right:24px;bottom:14px;color:#bbb;font:700 44px/1 ui-monospace,monospace;font-style:normal}
.fb-lid{position:absolute;inset:0;z-index:3;transform-style:preserve-3d;transform-origin:50% 100%;transition:transform var(--open,620ms) cubic-bezier(.16,1,.3,1)}
.fb-cover{position:absolute;inset:0;transform-origin:0 0;border-radius:30px;background:linear-gradient(150deg,rgba(0,0,0,.04),rgba(0,0,0,.56)),url('/images/posts/thumbs/nc1939abe-cover.webp') center/cover no-repeat;filter:grayscale(1) contrast(1.03);box-shadow:0 30px 80px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.3);overflow:hidden;cursor:pointer;will-change:transform}
.fb-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,.62));pointer-events:none}
.fb-copy{position:absolute;left:clamp(24px,4vw,40px);right:clamp(24px,4vw,40px);bottom:clamp(22px,3.5vw,34px);z-index:2;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.55)}
.fb-copy small{display:block;font:700 9px ui-monospace,monospace;letter-spacing:.2em;color:#d8d8d8;margin-bottom:10px}
.fb-copy h2{font:800 clamp(28px,4vw,42px)/1.08 "Noto Serif SC","Songti SC",serif;letter-spacing:-.04em;margin:0 0 10px;outline:none}.fb-copy p{font:400 13px/1.7 "Noto Sans SC",sans-serif;color:rgba(255,255,255,.72);margin:0;max-width:90%;outline:none}.fb-copy h2:focus,.fb-copy p:focus,.fb-copy small:focus{outline:2px solid #fff;outline-offset:4px;border-radius:3px}
.fb-handles{position:absolute;inset:0;pointer-events:none;z-index:8}
.fb-handle{position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;border:4px solid rgba(0,0,0,.7);box-shadow:0 4px 12px rgba(0,0,0,.55);pointer-events:auto;cursor:grab;transform:translate(-50%,-50%);touch-action:none}.fb-handle:active{cursor:grabbing;transform:translate(-50%,-50%) scale(1.15)}
.fb-folder.open .fb-lid{transform:rotateX(-82deg)}.fb-folder.open .fb-handles{opacity:0;pointer-events:none}.fb-folder.open .fb-cover{cursor:default}
.fb-tools{position:absolute;right:clamp(16px,3vw,32px);bottom:clamp(16px,3vw,26px);z-index:10;display:flex;gap:7px}
.fb-tools button{border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.5);color:rgba(255,255,255,.75);border-radius:999px;padding:8px 12px;font:600 11px inherit;cursor:pointer;backdrop-filter:blur(12px)}.fb-tools button[aria-pressed=true]{background:#fff;color:#111;border-color:#fff}
.fb-hint{position:absolute;left:clamp(16px,3vw,32px);bottom:clamp(16px,3vw,26px);z-index:10;color:rgba(255,255,255,.38);font:10px ui-monospace,monospace;letter-spacing:.06em}
@media (max-width:600px){.fb-folder{width:min(360px,82vw)}.fb-hint{display:none}.fb-tools{bottom:14px;right:14px}.fb-tools button{padding:7px 10px;font-size:10px}}
`,
mount(h,ctx){
  const OPEN=(ctx&&ctx.P&&ctx.P.OPEN)||620;
  h.innerHTML=`<div class="fb"><div class="fb-bg"></div><div class="fb-stage"><div class="fb-folder" style="--open:${OPEN}ms"><div class="fb-tab"></div><div class="fb-back"></div>
    <div class="fb-paper"><em>03 · 内容</em><h3>Who / why / how</h3><p>提出问题的同时要抱有 why 的疑惑：为什么要提出，是否有其他方法。</p><i>03</i></div>
    <div class="fb-paper"><em>02 · 内容</em><h3>积累与实践</h3><p>前期时间不充足时，实践与阅读哪个更重要。</p><i>02</i></div>
    <div class="fb-paper"><em>01 · 内容</em><h3>优先级</h3><p>论平衡时间优先级。</p><i>01</i></div>
    <div class="fb-lid"><div class="fb-cover"><div class="fb-copy"><small contenteditable="false" data-edit spellcheck="false">思维日记 · 2026-07-17</small><h2 contenteditable="false" data-edit spellcheck="false">论平衡时间优先级</h2><p contenteditable="false" data-edit spellcheck="false">积累与实践，在前期时间不充足的情况下，哪个重要。</p></div></div></div>
    <div class="fb-handles"></div>
  </div></div><div class="fb-hint">点封面空白展开 · 四角可调 · 点文字按钮编辑</div><div class="fb-tools"><button type="button" class="fb-edit">文字</button><button type="button" class="fb-quad">四角</button><button type="button" class="fb-reset">重置</button></div></div>`;
  const root=h.querySelector('.fb'),folder=h.querySelector('.fb-folder'),lid=h.querySelector('.fb-lid'),cover=h.querySelector('.fb-cover'),handles=h.querySelector('.fb-handles'),editBtn=h.querySelector('.fb-edit'),quadBtn=h.querySelector('.fb-quad'),resetBtn=h.querySelector('.fb-reset');
  let W=480,H=520,quad=[[0,0],[W,0],[W,H],[0,H]],drag=null,quadMode=false,editing=false;
  const solve8=(A,b)=>{for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[b[c],b[p]]=[b[p],b[c]];const d=A[c][c]||1e-9;for(let j=c;j<8;j++)A[c][j]/=d;b[c]/=d;for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c];if(!f)continue;for(let j=c;j<8;j++)A[r][j]-=f*A[c][j];b[r]-=f*b[c]}}return b};
  const matrixFor=()=>{W=cover.clientWidth;H=cover.clientHeight;const src=[[0,0],[W,0],[W,H],[0,H]],A=[],b=[];for(let i=0;i<4;i++){const [x,y]=src[i],[X,Y]=quad[i];A.push([x,y,1,0,0,0,-X*x,-X*y]);b.push(X);A.push([0,0,0,x,y,1,-Y*x,-Y*y]);b.push(Y)}const v=solve8(A,b);return `matrix3d(${v[0]},${v[3]},0,${v[6]},${v[1]},${v[4]},0,${v[7]},0,0,1,0,${v[2]},${v[5]},0,1)`};
  const apply=()=>{cover.style.transform=matrixFor();[...handles.children].forEach((el,i)=>{el.style.left=(quad[i][0]/W*100)+'%';el.style.top=(quad[i][1]/H*100)+'%'})};
  const reset=()=>{W=cover.clientWidth;H=cover.clientHeight;quad=[[0,0],[W,0],[W,H],[0,H]];apply()};
  const initHandles=()=>{handles.innerHTML='';quad.forEach((_,i)=>{const d=document.createElement('div');d.className='fb-handle';d.dataset.i=String(i);handles.appendChild(d)});apply()};
  handles.addEventListener('pointerdown',e=>{const h=e.target.closest('.fb-handle');if(!h)return;e.preventDefault();e.stopPropagation();drag={i:+h.dataset.i,id:e.pointerId};h.setPointerCapture(e.pointerId)});
  handles.addEventListener('pointermove',e=>{if(!drag)return;const r=cover.getBoundingClientRect();quad[drag.i]=[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];apply()});
  const end=()=>{drag=null};handles.addEventListener('pointerup',end);handles.addEventListener('pointercancel',end);
  quadBtn.addEventListener('click',()=>{quadMode=!quadMode;quadBtn.setAttribute('aria-pressed',String(quadMode));handles.style.display=quadMode?'block':'none';if(quadMode)initHandles();});
  editBtn.addEventListener('click',()=>{editing=!editing;editBtn.setAttribute('aria-pressed',String(editing));cover.querySelectorAll('[data-edit]').forEach(el=>el.contentEditable=String(editing));if(editing)cover.querySelector('[data-edit]')?.focus();});
  resetBtn.addEventListener('click',reset);
  cover.addEventListener('click',e=>{if(quadMode||editing||e.target.isContentEditable)return;folder.classList.toggle('open');});
  window.addEventListener('resize',apply,{passive:true});
  initHandles();handles.style.display='none';
  ctx&&ctx.status&&ctx.status('FOLDER');
  return()=>window.removeEventListener('resize',apply);
}});
