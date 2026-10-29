/* ─── 16 Hidden Tap ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'egg',name:'Hidden Tap',cat:'Micro',mat:'彩蛋',
spell:'连点 logo → 外圈一格格填满；点够了，它弹性旋转变形，说出一句话。',core:'留一个只给认真的人的出口',tags:['Micro','Easter egg','Click','SVG'],
credit:{n:'Design Spells',u:'https://designspells.com/',own:1},
notes:['外圈用 SVG 圆的 pathLength=100，stroke-dashoffset 直接等于 100 − 进度，不需要算周长。','连点要在 1.5 秒内继续，否则计数归零、圆环退回去。这个小小的“宽限期”决定了彩蛋是随手能碰到、还是需要一点决心。','触发后用弹性缓动（elastic）同时驱动旋转、圆角、缩放；文字用打字机逐字出现，4.5 秒后一切复位，可以再来一次。','每点一下的咔哒声音高随进度升高，没有看见进度条的人也能听出来“快了”。'],
knobs:[{k:'TAPS',label:'TAPS 次数',v:5,min:3,max:12,step:1}],
css:`.eg{display:grid;place-content:center;justify-items:center;gap:18px}
.eg-mark{position:relative;width:132px;height:132px;display:grid;place-items:center;border-radius:50%}
.eg-mark svg{position:absolute;inset:0;transform:rotate(-90deg);pointer-events:none}
.eg-mark circle{fill:none;stroke-width:2.5}.eg-tr{stroke:color-mix(in srgb,var(--st-ink) 22%,transparent)}
.eg-pr{stroke:var(--st-ink);stroke-dasharray:100;stroke-dashoffset:100;stroke-linecap:round;transition:stroke-dashoffset .35s var(--e)}
.eg-core{display:grid;place-items:center;width:78px;height:78px;border-radius:50%;background:var(--st-ink);will-change:transform}
.eg-core i{width:22px;height:22px;border-radius:50%;background:var(--st-bg)}
.eg-mark:active .eg-core{transform:scale(.9)}
.eg-t{min-height:26px;font-size:20px;font-weight:600;letter-spacing:-.02em}
.eg-h{font:10px var(--mono);opacity:.55}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg eg"><button class="eg-mark" aria-label="logo"><svg viewBox="0 0 120 120"><circle class="eg-tr" cx="60" cy="60" r="56"/><circle class="eg-pr" cx="60" cy="60" r="56" pathLength="100"/></svg><span class="eg-core"><i></i></span></button><p class="eg-t">&nbsp;</p><small class="eg-h">快速连点 logo</small></div>`;
  const mark=$('.eg-mark',h),core=$('.eg-core',h),pr=$('.eg-pr',h),msg=$('.eg-t',h);
  let taps=0,locked=false,rt,tt,cancel=null;
  const ring=()=>{pr.style.strokeDashoffset=100-100*Math.min(1,taps/P.TAPS)};
  const type=s=>{let i=0;clearInterval(tt);msg.textContent='';tt=setInterval(()=>{msg.textContent=s.slice(0,++i);if(i>=s.length)clearInterval(tt)},70)};
  const egg=()=>{locked=true;ctx.status('FOUND IT');type('You found it. 有人真的点完了。');
    cancel=tween(1.3,e=>{core.style.borderRadius=(50-34*Math.min(1,e*1.1))+'%';core.style.transform=`rotate(${360*e}deg) scale(${1+.22*Math.sin(Math.min(1,e)*Math.PI)})`},t=>E.elastic(t,1.4,.7));
    rt=setTimeout(()=>{if(cancel)cancel();core.style.transition='all .5s var(--e)';core.style.borderRadius='50%';core.style.transform='';setTimeout(()=>{core.style.transition=''},550);msg.innerHTML='&nbsp;';taps=0;ring();locked=false;ctx.status('IDLE')},4500)};
  const tap=()=>{if(locked)return;audioReady();taps++;clickSound(taps*70,.55);ring();core.animate([{transform:'scale(.88) rotate(0)'},{transform:`scale(1) rotate(${taps*12}deg)`}],{duration:320,easing:'cubic-bezier(.34,1.8,.64,1)'});ctx.status('TAP '+taps+'/'+Math.round(P.TAPS));
    clearTimeout(rt);if(taps>=P.TAPS){egg();return}rt=setTimeout(()=>{taps=0;ring();ctx.status('IDLE')},1500)};
  mark.addEventListener('click',tap);
  ctx.demo(async()=>{if(locked)return;for(let i=0;i<Math.round(P.TAPS);i++){tap();await wait(220)}},7500);
  ctx.status('IDLE');
  return()=>{clearTimeout(rt);clearInterval(tt);if(cancel)cancel()};
}});
