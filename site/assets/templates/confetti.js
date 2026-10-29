/* ─── 13 Confetti Click ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'confetti',name:'Confetti Click',cat:'Micro',mat:'纸屑',
spell:'点按钮或任意位置 → 纸屑向上炸开，被空气拖慢再飘落；按钮先被压扁，松手回弹过头。',core:'确认动作也可以有重量',tags:['Micro','Canvas','Physics','Click'],
credit:{n:'Design Spells',u:'https://designspells.com/',own:1},
notes:['纸屑只有三种力：初速（SPREAD）、重力（GRAVITY）、空气阻力（DRAG）。竖直方向的阻力更大，所以它们会先冲上去、很快慢下来、再慢悠悠落下，而不是像石头一样掉。','每片纸有自己的翻转相位，用 cos 压缩它的高度，看起来就像在空中翻面。','按钮的“重量感”全在 CSS：按下时 0.08s 压成扁的，松手后用带过冲的贝塞尔曲线回弹。','画布上的粒子上限 600，超出的从最老的开始丢，连点也不会卡。'],
knobs:[{k:'COUNT',label:'COUNT 数量',v:70,min:10,max:200,step:5},{k:'GRAVITY',label:'GRAVITY 重力',v:900,min:200,max:2000,step:50},{k:'DRAG',label:'DRAG 阻力',v:2.2,min:.5,max:5,step:.1},{k:'SPREAD',label:'SPREAD 初速',v:620,min:200,max:1100,step:20}],
css:`.cf{cursor:pointer}.cf canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cf-c{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:16px;pointer-events:none}
.cf-btn{pointer-events:auto;min-width:160px;padding:16px 34px;border-radius:99px;background:var(--st-ink);color:var(--st-bg);font-size:20px;font-weight:600;letter-spacing:-.02em;text-align:center;transition:transform .55s cubic-bezier(.34,1.9,.64,1)}
.cf-btn:active{transform:scale(.9,.82);transition-duration:.08s}
.cf-c p{font:11px var(--mono);opacity:.55}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg cf"><canvas></canvas><div class="cf-c"><button class="cf-btn"><span>Ship it</span></button><p>点按钮，或点任意位置</p></div></div>`;
  const root=$('.cf',h),cv=$('canvas',h),c=cv.getContext('2d'),btn=$('.cf-btn',h),lab=$('span',btn);
  const dpr=Math.min(devicePixelRatio||1,2),W=root.clientWidth,H=root.clientHeight;cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const COL=['#ff5a36','#ffc233','#3ddc97','#4c8dff','#c46bff','#f2f2f2'];
  let ps=[],tl;
  const burst=(x,y,n,pow=1)=>{n=n||Math.round(P.COUNT);for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*Math.PI*1.15,s=P.SPREAD*pow*(.35+Math.random()*.65);ps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:Math.random()*6.28,vr:(Math.random()-.5)*14,w:5+Math.random()*6,h:3+Math.random()*4,c:COL[i%COL.length],f:Math.random()*6.28,age:0})}if(ps.length>600)ps=ps.slice(-600);clickSound(300,.4);ctx.status('BURST '+ps.length)};
  const fromBtn=()=>{const r=btn.getBoundingClientRect(),b=root.getBoundingClientRect();burst(r.left-b.left+r.width/2,r.top-b.top+r.height*.3,Math.round(P.COUNT*1.4),1.15);lab.textContent='Shipped';clearTimeout(tl);tl=setTimeout(()=>{lab.textContent='Ship it'},1300)};
  btn.addEventListener('click',()=>{audioReady();fromBtn()});
  root.addEventListener('pointerdown',e=>{audioReady();if(btn.contains(e.target))return;const r=root.getBoundingClientRect();burst(e.clientX-r.left,e.clientY-r.top)});
  const stop=ticker(dt=>{
    c.clearRect(0,0,W,H);
    ps=ps.filter(p=>p.age<4&&p.y<H+40);
    const dx=Math.exp(-P.DRAG*dt),dy=Math.exp(-P.DRAG*1.2*dt);
    for(const p of ps){p.age+=dt;p.vx*=dx;p.vy=p.vy*dy+P.GRAVITY*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
      c.save();c.translate(p.x,p.y);c.rotate(p.r);c.scale(1,Math.cos(p.f+p.age*9));c.globalAlpha=Math.min(1,(4-p.age)*1.5);c.fillStyle=p.c;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore()}
  });
  ctx.demo(()=>{if(Math.random()<.5)fromBtn();else burst(W*(.2+Math.random()*.6),H*(.55+Math.random()*.25))},1500);
  ctx.status('IDLE');
  return()=>{stop();clearTimeout(tl)};
}});
