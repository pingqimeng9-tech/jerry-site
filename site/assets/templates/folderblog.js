/* ─── 23 Folder Blog ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'folderblog',name:'Folder Blog',cat:'UI',mat:'文件夹',
spell:'把博客文件夹里的单个文件夹 1:1 放进模板：原色封面、标题与摘要，点开飞出三张章节卡。',
core:'单个文件夹 = 博客 Folder 卡片原样复制',
tags:['UI','Folder','Blog','Copy'],
credit:{n:'callmiruko.cc 博客 Folder 视图中的「脱离固有思维」卡片',u:'https://callmiruko.cc/p/detach-from-fixed-mindset',own:1},
notes:['只复制博客 Folder 视图里的一个文件夹，不增加标题、搜索、列表或图库。','颜色保持文章原本的颜色，不再加灰度滤镜。','点开后像博客一样飞出三张章节卡；首页预览会自动演示开合。'],
css:`.fb{position:absolute;inset:0;background:#050506;color:#fff;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;overflow:hidden}
.fb-bg{position:absolute;inset:-30px;background:linear-gradient(120deg,rgba(0,0,0,.75),rgba(0,0,0,.3) 50%,rgba(0,0,0,.82)),url('/images/posts/thumbs/ndfc39abe-cover.webp') center/cover no-repeat;filter:blur(5px) contrast(1.02);transform:scale(1.05)}
.fb-bg:after{content:"";position:absolute;inset:0;background:radial-gradient(60% 70% at 50% 48%,transparent,rgba(0,0,0,.55) 70%,#000 100%)}
.fb-stage{position:absolute;inset:0;display:grid;place-items:center;padding:20px}
.fb-card{position:relative;width:280px;height:296px;perspective:1100px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.fb-tilt{position:absolute;inset:0;perspective:900px;transform:rotateX(0) rotateY(0);transition:transform .5s cubic-bezier(.16,1,.3,1)}
.fb-shell{position:absolute;inset:0;border-radius:30px;overflow:hidden;background:#06060b;box-shadow:0 0 0 3px #12121a,0 18px 40px rgba(0,0,0,.35)}
.fb-glow{position:absolute;inset:0;background:radial-gradient(130px 100px at 82% 90%,rgba(255,255,255,.28),transparent 70%),radial-gradient(150px 110px at 10% 55%,rgba(255,255,255,.12),transparent 70%)}
.fb-cov{position:absolute;inset:0;overflow:hidden}.fb-cov img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.fb-dim{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 55%,rgba(0,0,0,.65))}
.fb-front{position:absolute;left:9px;right:9px;bottom:9px;top:111px;z-index:4;color:#fff;padding:34px 20px 0;box-sizing:border-box;transform-origin:50% 100%;transition:transform .45s cubic-bezier(.16,1,.3,1)}
.fb-card.open .fb-front{transform:scaleX(1.08)}
.fb-glass{position:absolute;inset:0;clip-path:path('M16 0H100C112 0 118 4 124 10C130 16 136 20 150 20H244Q262 20 262 38V156Q262 176 242 176H20Q0 176 0 156V16Q0 0 16 0Z');background:linear-gradient(155deg,rgba(255,255,255,.22),rgba(255,255,255,.06) 42%,rgba(255,255,255,.12)),rgba(26,28,32,.62)}
.fb-card.open .fb-glass{-webkit-backdrop-filter:blur(16px) saturate(1.2);backdrop-filter:blur(16px) saturate(1.2)}
.fb-rim{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;fill:none;stroke:#e8e8e8;stroke-width:1.2;stroke-opacity:.6}
.fb-front h3{position:relative;margin:0;font:700 14px/1.4 "Noto Serif SC","Songti SC",serif;text-shadow:0 1px 8px rgba(0,0,0,.35);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fb-front p{position:relative;margin:7px 0 0;font:400 11.5px/1.55 "Noto Serif SC","Songti SC",serif;color:#d9d9d9;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fb-meta{position:absolute;left:20px;right:20px;bottom:14px;display:flex;gap:14px;align-items:center;font:400 10.5px/1 "IBM Plex Mono",ui-monospace,Menlo,monospace;color:#dedede;white-space:nowrap;overflow:hidden}
.fb-meta span:last-child{font-family:"Noto Serif SC","Songti SC",serif;font-size:11px;overflow:hidden;text-overflow:ellipsis}

.fb-chapter{position:absolute;left:50%;top:50%;width:156px;height:184px;margin:-92px 0 0 -78px;z-index:var(--z);opacity:0;pointer-events:none;border-radius:15px;background:linear-gradient(165deg,#fff 34%,#f4ebe1);color:#292b38;padding:15px 14px;box-sizing:border-box;box-shadow:0 14px 34px rgba(0,0,0,.25),0 0 0 1px rgba(255,255,255,.3);transform:translate(var(--rx),var(--ry)) rotate(var(--rr)) scale(.86);transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .2s}
.fb-card.open .fb-chapter{opacity:1;pointer-events:auto;transform:translate(var(--fx),var(--fy)) rotate(var(--fr)) scale(1);transition:transform .6s cubic-bezier(.34,1.56,.64,1),opacity .18s}
.fb-chapter.c1{--rx:-6px;--ry:35px;--rr:-1deg;--fx:-132px;--fy:-118px;--fr:-8deg;--z:2;--in:0ms}
.fb-chapter.c2{--rx:0;--ry:30px;--rr:0deg;--fx:0;--fy:-158px;--fr:1deg;--z:1;--in:70ms}
.fb-chapter.c3{--rx:6px;--ry:35px;--rr:1deg;--fx:132px;--fy:-118px;--fr:8deg;--z:3;--in:140ms}
.fb-chapter em{display:block;font:600 9px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#a47b28;font-style:normal;margin-bottom:9px}
.fb-chapter b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font:700 13px/1.35 "Noto Serif SC","Songti SC",serif}
.fb-chapter p{margin:7px 0 0;color:#6e7080;font:400 10.5px/1.55 "Noto Serif SC","Songti SC",serif;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.fb-chapter i{position:absolute;right:12px;bottom:8px;color:#d7b38a;font:600 26px/1 ui-monospace,Menlo,monospace;font-style:normal}
`,
mount(h,ctx){
  h.innerHTML=`<div class="fb"><div class="fb-bg"></div><div class="fb-stage">
    <div class="fb-card" role="button" tabindex="0" aria-label="打开文件夹">
      <div class="fb-tilt"><div class="fb-shell"><div class="fb-glow"></div><div class="fb-cov"><img src="/images/posts/thumbs/ndfc39abe-cover.webp" alt="" loading="lazy"><i class="fb-dim"></i></div><div class="fb-chapter c1"><em>01 · 章节</em><b>多元思维模型</b><p>大多数人使用学过的学科思维模型，聪明的家伙往往涉猎多个领域。</p><i>01</i></div><div class="fb-chapter c2"><em>02 · 章节</em><b>跨领域</b><p>不拿半固有思维判断，加入其他学科的经验。</p><i>02</i></div><div class="fb-chapter c3"><em>03 · 章节</em><b>融会贯通</b><p>术有专攻，但道是融会贯通，互为联系。</p><i>03</i></div></div>
        <div class="fb-front"><div class="fb-glass"></div><svg class="fb-rim" viewBox="0 0 262 176" preserveAspectRatio="none"><path d="M16 0H100C112 0 118 4 124 10C130 16 136 20 150 20H244Q262 20 262 38V156Q262 176 242 176H20Q0 176 0 156V16Q0 0 16 0Z"/></svg><h3>脱离固有思维</h3><p>有边界的思维和不能错/完美的思维，多元思维模型。</p><div class="fb-meta"><span>📅 2026-07-17</span><span>🏷️ 思维日记</span></div></div>
      </div>
    </div>
  </div></div>`;
  const card=h.querySelector('.fb-card'),tilt=h.querySelector('.fb-tilt');
  const toggle=()=>card.classList.toggle('open');
  card.addEventListener('click',toggle);
  card.addEventListener('click',e=>{if(e.target.closest('.fb-chapter'))e.stopPropagation()},true);
  if(ctx&&typeof ctx.demo==='function')ctx.demo(()=>toggle(),2600);
  const fallbackDemo=(!ctx||!ctx.auto) ? setInterval(toggle,2600) : null;
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  card.addEventListener('pointermove',e=>{if(card.classList.contains('open'))return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform=`rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`});
  card.addEventListener('pointerleave',()=>{if(!card.classList.contains('open'))tilt.style.transform=''});
  ctx&&ctx.status&&ctx.status('FOLDER');
  return()=>{if(fallbackDemo)clearInterval(fallbackDemo)};
}});
