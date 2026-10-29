/* ─── 2 Dial ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'dial',name:'Dial',cat:'Interaction',mat:'金属',
spell:'拨动调谐旋钮 → 圆环带着重量转动，每过一格咔哒一声，音高随转速变化。',core:'“选一个”不一定是下拉框',tags:['Interaction','Sound','Physics','Wheel'],
credit:{n:'Dial',u:'https://carterogunsola.com/lab/dial'},
notes:['这是一个完整的圆环，转轴在舞台左边之外，你只看得见它右边的一小段弧。看不见的部分不是被裁掉的，而是被一层以转轴为圆心的锥形渐变盖成了背景色。','刻度也是同一招：一整圈刻度，每个频道一根长刻度，用一个 transform 转动。长刻度压在轴线上的瞬间，就是频道生效的瞬间。','手感全在几个常数里：拖动时跟随得慢（DAMP_DRAG），松手后用弹性缓动落到最近的格位（SNAP），每过一格播放一次咔哒，音高由速度决定。','右下角的旋钮可以直接拧：拖动它，旋钮上的横线会逆着运动方向倾斜再回正。'],
knobs:[{k:'DAMP_DRAG',label:'DAMP_DRAG 拖动阻尼',v:15,min:3,max:40,step:1},{k:'DAMP_IDLE',label:'DAMP_IDLE 静止阻尼',v:25,min:5,max:50,step:1},{k:'SNAP_DUR',label:'SNAP_DUR 吸附时长',v:.8,min:.2,max:1.6,step:.05},{k:'ELASTIC_AMP',label:'弹性振幅',v:2,min:1,max:4,step:.1},{k:'ELASTIC_PERIOD',label:'弹性周期',v:.6,min:.2,max:1.2,step:.05},{k:'VIS',label:'可见弧度 °',v:38,min:20,max:70,step:1},{k:'CHANNELS',label:'频道数',v:24,min:8,max:48,step:1,remount:true}],
css:`.dl2{cursor:grab}
.dl2-ring{position:absolute;pointer-events:none;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--st-ink) 55%,transparent)}
.dl2-minor,.dl2-major{position:absolute;inset:0;border-radius:50%}
.dl2-cover,.dl2-labels{position:absolute;inset:0;pointer-events:none}
.dl2-ch{position:absolute;left:0;top:0;white-space:nowrap;font:12px var(--mono);transform-origin:0 50%;will-change:transform;display:flex;gap:10px;align-items:baseline}
.dl2-ch em{font-style:normal;opacity:.55}
.dl2-axis{position:absolute;height:2px;background:var(--st-ink);pointer-events:none}
.dl2-read{position:absolute;right:6%;top:46%;transform:translateY(-50%);width:min(32%,340px);pointer-events:none}
.dl2-read small{font:11px var(--mono);opacity:.6}
.dl2-read h2{font-size:clamp(22px,3.2vw,40px);letter-spacing:-.03em;margin:8px 0;line-height:1.1;font-weight:600}
.dl2-read p{font-size:14px;line-height:1.6;opacity:.75}
.dl2-knob{position:absolute;right:7%;bottom:9%;width:84px;height:84px;border-radius:50%;background:var(--st-ink);touch-action:none;cursor:grab;display:grid;place-items:center}
.dl2-knob i{display:block;width:62%;height:3px;border-radius:2px;background:var(--st-bg)}
.dl2-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font:10px var(--mono);opacity:.5;white-space:nowrap;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items;
  h.innerHTML=`<div class="stg dl2"><div class="dl2-ring"><div class="dl2-minor"></div><div class="dl2-major"></div></div><div class="dl2-cover"></div><div class="dl2-labels"></div><div class="dl2-axis"></div><div class="dl2-read"><small></small><h2></h2><p></p></div><div class="dl2-knob"><i></i></div><div class="dl2-hint">拖圆环 · 滚轮 · ↑↓ · 或拧右下角的旋钮</div></div>`;
  const root=$('.dl2',h),ring=$('.dl2-ring',h),minor=$('.dl2-minor',h),major=$('.dl2-major',h),cover=$('.dl2-cover',h),labs=$('.dl2-labels',h),axis=$('.dl2-axis',h),knob=$('.dl2-knob',h),grip=$('i',knob);
  const N=Math.round(P.CHANNELS),SL=360/N,W=root.clientWidth,H=root.clientHeight,R=H*.82,hx=-R*.36,cy=H/2;
  Object.assign(ring.style,{left:(hx-R)+'px',top:(cy-R)+'px',width:2*R+'px',height:2*R+'px'});
  const band=i=>`radial-gradient(circle closest-side,transparent calc(100% - ${i+1}px),#000 calc(100% - ${i}px),#000 calc(100% - 2px),transparent calc(100% - 1px))`;
  minor.style.cssText+=`;background:repeating-conic-gradient(from ${90-.3}deg,var(--st-ink) 0 .6deg,transparent .6deg ${SL/4}deg);-webkit-mask:${band(16)};mask:${band(16)}`;
  major.style.cssText+=`;background:repeating-conic-gradient(from ${90-.5}deg,var(--st-ink) 0 1deg,transparent 1deg ${SL}deg);-webkit-mask:${band(36)};mask:${band(36)}`;
  Object.assign(axis.style,{left:(hx+R-48)+'px',top:(cy-1)+'px',width:'60px'});
  const chs=[];for(let i=0;i<N;i++){const c=el('div','dl2-ch',`<span>${pad(i+1)}</span><em>FM ${(87.5+i*(20/N)).toFixed(1)}</em>`);labs.appendChild(c);chs.push(c)}
  const idxOf=a=>mod(Math.round(-a/SL),N);
  const paint=i=>{const it=items[i%items.length];$('small',h).textContent=`CH ${pad(i+1)} · FM ${(87.5+i*(20/N)).toFixed(1)}`;$('h2',h).textContent=it.title;$('.dl2-read p',h).textContent=it.sum;ctx.focus(i%items.length,'CH '+pad(i+1))};
  let ang=0,target=0,dragging=false,snap=null,vel=0,prevIdx=-1,gripA=0,wheelT=null,lastVis=-1;
  const startSnap=()=>{const to=Math.round(target/SL)*SL;target=to;snap={from:ang,to,t:0}};
  const stop=ticker(dt=>{
    const prev=ang;
    if(snap){snap.t+=dt;const u=Math.min(1,snap.t/P.SNAP_DUR);ang=snap.from+(snap.to-snap.from)*E.elastic(u,P.ELASTIC_AMP,P.ELASTIC_PERIOD);if(u>=1){ang=snap.to;snap=null}}
    else ang=damp(ang,target,dragging?P.DAMP_DRAG:P.DAMP_IDLE,dt);
    vel=(ang-prev)/dt;
    const idx=idxOf(ang);if(idx!==prevIdx){if(prevIdx>=0)clickSound(Math.abs(vel));prevIdx=idx;paint(idx)}
    ring.style.transform=`rotate(${ang}deg)`;
    if(lastVis!==P.VIS){lastVis=P.VIS;cover.style.background=`conic-gradient(from 0deg at ${hx}px ${cy}px,var(--st-bg) 0deg ${90-P.VIS}deg,transparent ${90-P.VIS}deg ${90+P.VIS}deg,var(--st-bg) ${90+P.VIS}deg 360deg)`}
    for(let i=0;i<N;i++){let a=mod(i*SL+ang+180,360)-180;const c=chs[i];
      if(Math.abs(a)>P.VIS+6){c.style.display='none';continue}
      c.style.display='flex';const rad=a*Math.PI/180,x=hx+(R+18)*Math.cos(rad),y=cy+(R+18)*Math.sin(rad),t=Math.max(0,1-Math.abs(a)/(SL*1.1));
      c.style.transform=`translate(${x}px,${y}px) translateY(-50%) scale(${1+.5*t})`;c.style.opacity=clamp(1-Math.abs(a)/P.VIS,.12,1);c.style.fontWeight=t>.6?700:400}
    gripA=damp(gripA,clamp(-vel*.045,-38,38),16,dt);grip.style.transform=`rotate(${gripA}deg)`;
  });
  const down=e=>{audioReady()};root.addEventListener('pointerdown',down);
  let ly=0,on=false;
  root.addEventListener('pointerdown',e=>{if(knob.contains(e.target))return;on=true;dragging=true;snap=null;ly=e.clientY;root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(!on)return;target+=(e.clientY-ly)/R*57.3;ly=e.clientY});
  const rel=()=>{if(!on)return;on=false;dragging=false;startSnap()};root.addEventListener('pointerup',rel);root.addEventListener('pointercancel',rel);
  root.addEventListener('wheel',e=>{e.preventDefault();audioReady();dragging=true;snap=null;target-=e.deltaY*.12;clearTimeout(wheelT);wheelT=setTimeout(()=>{dragging=false;startSnap()},130)},{passive:false});
  const key=e=>{if(false||e.target.tagName==='INPUT'||!h.isConnected)return;if(e.key==='ArrowDown'||e.key==='ArrowRight'){audioReady();target=Math.round(target/SL)*SL-SL;snap=null;startSnap()}if(e.key==='ArrowUp'||e.key==='ArrowLeft'){audioReady();target=Math.round(target/SL)*SL+SL;snap=null;startSnap()}};
  addEventListener('keydown',key);
  let kp=0,kk=false;
  const kang=e=>{const r=knob.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  knob.addEventListener('pointerdown',e=>{audioReady();kk=true;dragging=true;snap=null;kp=kang(e);knob.setPointerCapture(e.pointerId);e.stopPropagation()});
  knob.addEventListener('pointermove',e=>{if(!kk)return;const a=kang(e);let d=a-kp;if(d>180)d-=360;if(d<-180)d+=360;kp=a;target-=d*.7});
  const krel=()=>{if(!kk)return;kk=false;dragging=false;startSnap()};knob.addEventListener('pointerup',krel);knob.addEventListener('pointercancel',krel);
  ctx.demo(()=>{target-=SL*(1+Math.floor(Math.random()*3));dragging=false;startSnap()},1700);
  ctx.status('IDLE');
  return()=>{stop();removeEventListener('keydown',key)};
}});
