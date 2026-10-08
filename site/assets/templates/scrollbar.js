/* ─── 6 Dynamic Scrollbar ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'scrollbar',name:'Dynamic Scrollbar',cat:'UI',mat:'胶囊',
spell:'滚动 → 细条变黑并长成一个实时时钟；到“声音”那一屏，点音符，胶囊展开成播放器。',core:'同一个胶囊，三种尺寸',tags:['UI','Scroll','Morph','Audio'],
credit:{n:'Dynamic Scrollbar',u:'https://carterogunsola.com/lab/dynamic-scrollbar'},
notes:['同一个胶囊有三种状态：5×64 的细条、50×188 的时钟、264×397 的播放器。它只做一件事——改变大小，内部三块面板用模糊交叉淡入淡出，背景从灰变黑。','值得偷的是“不一起动画”的部分：位置每帧由循环决定（以你在滚动中的位置为中心，再夹在轨道内），尺寸由一个可被打断的补间决定。让一个动画同时管两者，就会互相打架。','时钟只在你真的在滚动时显示；停下 REST_DELAY 之后收回成细条。滚动本身是自己实现的带阻尼的惯性滚动，所以滚动条能拿到准确的速度。','播放器是真的：用 Web Audio 现场合成一段循环旋律，可以播放、暂停、拖时间轴、换曲。音频在你点播放之后才会开始。'],
knobs:[{k:'MORPH_IN',label:'MORPH_IN 展开 s',v:.65,min:.2,max:1.4,step:.05},{k:'MORPH_OUT',label:'MORPH_OUT 收回 s',v:.6,min:.2,max:1.4,step:.05},{k:'REST_DELAY',label:'REST_DELAY ms',v:150,min:0,max:800,step:10},{k:'SCROLL_LAMBDA',label:'滚动阻尼 λ',v:9,min:3,max:25,step:1}],
css:`.sb-view{position:absolute;inset:0;overflow:hidden}
.sb-sec{position:absolute;left:0;right:0;padding:0 9% 0 6%;display:flex;flex-direction:column;justify-content:center;gap:14px}
.sb-sec small{font:11px var(--mono)}
.sb-sec h2{font-size:clamp(30px,5.4vw,76px);letter-spacing:-.045em;line-height:1;font-weight:600;max-width:12em}
.sb-sec p{font-size:15px;line-height:1.65;max-width:34em;opacity:.78}
.sb-sec pre{font:11px/1.6 var(--mono)}
.sb-rail{position:absolute;right:10px;top:12px;bottom:12px;width:0}
.sb-cap{position:absolute;right:0;top:0;width:5px;height:64px;border-radius:99px;background:#8d8d8c;overflow:hidden;touch-action:none;cursor:pointer;transition:background-color .8s}
.sb-cap.s-clock,.sb-cap.s-player{background:#111}
.sb-p{position:absolute;inset:0;opacity:0;filter:blur(6px);transition:opacity .3s,filter .3s;pointer-events:none;color:#f3f3f1}
.sb-p.on{opacity:1;filter:none;pointer-events:auto}
.sb-clock{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.sb-clock canvas{width:38px;height:38px}
.sb-clock span{font:8px var(--mono);letter-spacing:.1em;writing-mode:vertical-rl}
.sb-note{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#ff4d00;font-size:18px;width:34px;height:34px;display:none;place-items:center}
.sb-note.show{display:grid;animation:sbpop .5s var(--e)}
@keyframes sbpop{from{transform:translateX(-50%) scale(.3)}to{transform:translateX(-50%) scale(1)}}
.sb-player{padding:16px;display:flex;flex-direction:column;gap:12px}
.sb-art{aspect-ratio:1;border-radius:14px;background:linear-gradient(135deg,#ff4d00,#3a1b10 60%,#111);position:relative;overflow:hidden}
.sb-wave{position:absolute;left:12px;right:12px;bottom:12px;height:34px;display:flex;align-items:flex-end;gap:5px}
.sb-wave i{flex:1;background:#fff;border-radius:2px;height:30%;animation:sbw .9s ease-in-out infinite alternate;animation-play-state:paused}
.sb-wave i:nth-child(2n){animation-duration:.7s}.sb-wave i:nth-child(3n){animation-duration:1.1s}.sb-wave i:nth-child(4){animation-delay:.2s}.sb-wave i:nth-child(5){animation-delay:.35s}
.sb-player.playing .sb-wave i{animation-play-state:running}
@keyframes sbw{from{height:12%}to{height:100%}}
.sb-info b{display:block;font-size:15px}.sb-info small{font:10px var(--mono)}
.sb-tl{height:4px;border-radius:2px;background:#ffffff33;cursor:pointer;position:relative;touch-action:none}
.sb-tl i{position:absolute;left:0;top:0;bottom:0;width:0;background:#ff4d00;border-radius:2px}
.sb-time{display:flex;justify-content:space-between;font:9px var(--mono);margin-top:-6px}
.sb-ctl{display:flex;justify-content:center;gap:18px;align-items:center}
.sb-ctl button{width:36px;height:36px;border-radius:50%;text-align:center;font-size:14px;color:#f3f3f1}
.sb-ctl button[data-a=play]{background:#f3f3f1;color:#111;width:44px;height:44px}
.sb-x{position:absolute;right:10px;top:10px;width:26px;height:26px;border-radius:50%;color:#f3f3f1;font-size:12px;text-align:center}`,
mount(h,ctx){
  const P=ctx.P,items=ctx.items;
  const secs=[...items.map((it,i)=>({t:it.title,b:it.body,c:it.code,n:pad(i+1)})),{t:'听一段',b:'这一屏有音乐。右侧的胶囊会长出一个音符，点开它。',c:'♪ generative · 60s',n:pad(items.length+1),music:true}];
  h.innerHTML=`<div class="stg sb"><div class="sb-view"></div><div class="sb-rail"><div class="sb-cap"><div class="sb-p sb-bar on"></div><div class="sb-p sb-clock"><canvas width="76" height="76"></canvas><span>SCROLL</span><button class="sb-note" aria-label="打开播放器">♪</button></div><div class="sb-p sb-player"><button class="sb-x" aria-label="收起">✕</button><div class="sb-art"><div class="sb-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="sb-info"><b class="sb-tn">Drift 01</b><small>generative · web audio</small></div><div><div class="sb-tl"><i></i></div></div><div class="sb-time"><span class="sb-cur">0:00</span><span>1:00</span></div><div class="sb-ctl"><button data-a="prev" aria-label="上一首">⏮</button><button data-a="play" aria-label="播放">▶</button><button data-a="next" aria-label="下一首">⏭</button></div></div></div></div></div>`;
  const root=$('.sb',h),view=$('.sb-view',h),rail=$('.sb-rail',h),cap=$('.sb-cap',h),pBar=$('.sb-bar',h),pClock=$('.sb-clock',h),pPlayer=$('.sb-player',h),note=$('.sb-note',h),cvs=$('canvas',h),cc=cvs.getContext('2d');
  const H=root.clientHeight,n=secs.length,maxS=(n-1)*H;
  secs.forEach((s,i)=>{const d=el('section','sb-sec',`<small>${s.n} / ${pad(n)}</small><h2>${esc(s.t)}</h2><p>${esc(s.b)}</p><pre>${esc(s.c)}</pre>`);d.style.top=(i*H)+'px';d.style.height=H+'px';view.appendChild(d)});
  const content=el('div');content.style.cssText='position:absolute;inset:0;will-change:transform';while(view.firstChild)content.appendChild(view.firstChild);view.appendChild(content);
  const DIM={bar:[5,64],clock:[50,188],player:[264,397]};
  let state='bar',cw=5,chh=64,cancel=null,sc=0,st=0,last=0,prevSc=0,lastMove=0,hover=false,scrubbing=false,scrubMoved=0;
  const setPanels=s=>{pBar.classList.toggle('on',s==='bar');pClock.classList.toggle('on',s==='clock');pPlayer.classList.toggle('on',s==='player');cap.classList.toggle('s-clock',s==='clock');cap.classList.toggle('s-player',s==='player')};
  function go(s){if(s===state)return;state=s;setPanels(s);if(cancel)cancel();const fw=cw,fh=chh,[tw,th]=DIM[s];cancel=tween(s==='bar'?P.MORPH_OUT:P.MORPH_IN,u=>{cw=fw+(tw-fw)*u;chh=fh+(th-fh)*u},E.p3io);ctx.status(s.toUpperCase())}
  const inMusic=()=>Math.abs(sc-maxS)<H*.5;
  // 音频
  let ac=null,playing=false,pt=0,trk=0,step=0,sched=null;
  const SC=[[0,3,5,7,10],[0,2,4,7,9],[0,2,3,7,8]],BASE=[196,220,174.6],TN=['Drift 01','Drift 02','Drift 03'];
  const note1=()=>{if(!ac)return;const sc2=SC[trk],i=(step*7+Math.floor(step/5))%sc2.length,f=BASE[trk]*Math.pow(2,sc2[i]/12)*(step%8<4?1:2),o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,ac.currentTime);g.gain.linearRampToValueAtTime(.06,ac.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.9);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+1);step++};
  const play=()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume()}catch(e){return}playing=true;clearInterval(sched);sched=setInterval(note1,320);pPlayer.classList.add('playing');$('[data-a=play]',h).textContent='⏸'};
  const pause=()=>{playing=false;clearInterval(sched);pPlayer.classList.remove('playing');$('[data-a=play]',h).textContent='▶'};
  const fmt=t=>Math.floor(t/60)+':'+pad(Math.floor(t%60));
  $('.sb-ctl',h).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;if(a==='play')playing?pause():play();else{trk=mod(trk+(a==='next'?1:-1),3);pt=0;$('.sb-tn',h).textContent=TN[trk]}});
  $('.sb-tl',h).addEventListener('pointerdown',e=>{const r=e.currentTarget.getBoundingClientRect();pt=clamp((e.clientX-r.left)/r.width,0,1)*60;e.stopPropagation()});
  $('.sb-x',h).addEventListener('click',e=>{e.stopPropagation();go('clock')});
  note.addEventListener('click',e=>{e.stopPropagation();go('player')});
  // 滚动
  root.addEventListener('wheel',e=>{e.preventDefault();st=clamp(st+e.deltaY,0,maxS)},{passive:false});
  let ty=null;root.addEventListener('touchstart',e=>{ty=e.touches[0].clientY},{passive:true});root.addEventListener('touchmove',e=>{if(ty==null)return;const y=e.touches[0].clientY;st=clamp(st+(ty-y)*1.4,0,maxS);ty=y},{passive:true});
  const key=e=>{if(!h.isConnected||false)return;if(e.key==='ArrowDown'||e.key===' '){st=clamp(st+H*.5,0,maxS)}if(e.key==='ArrowUp'){st=clamp(st-H*.5,0,maxS)}};addEventListener('keydown',key);
  // 抓住滚动条拖动
  cap.addEventListener('pointerdown',e=>{scrubbing=true;scrubMoved=0;hover=true;cap.setPointerCapture(e.pointerId)});
  cap.addEventListener('pointermove',e=>{if(!scrubbing||state==='player')return;scrubMoved++;const r=rail.getBoundingClientRect();st=clamp((e.clientY-r.top)/r.height,0,1)*maxS});
  const crel=()=>{if(!scrubbing)return;scrubbing=false;hover=false;if(scrubMoved<3){if(state==='clock'&&inMusic())go('player');else if(state==='bar'){hover=true;lastMove=performance.now()}}};
  cap.addEventListener('pointerup',crel);cap.addEventListener('pointercancel',crel);
  cap.addEventListener('pointerenter',()=>{hover=true});cap.addEventListener('pointerleave',()=>{if(!scrubbing)hover=false});
  const stop=ticker((dt,now)=>{
    prevSc=sc;sc=damp(sc,st,P.SCROLL_LAMBDA,dt);
    content.style.transform=`translateY(${-sc}px)`;
    const moving=Math.abs(st-sc)>1.2||Math.abs(sc-prevSc)/dt>10||scrubbing||hover;
    const t=performance.now();if(moving)lastMove=t;
    const rest=inMusic()?'clock':'bar';
    if(state!=='player'){if(moving&&state==='bar')go('clock');else if(!moving&&t-lastMove>P.REST_DELAY&&state!==rest)go(rest);else if(state==='clock'&&!moving&&rest==='bar'&&t-lastMove>P.REST_DELAY)go('bar')}
    else if(!inMusic())go('clock');
    note.classList.toggle('show',inMusic()&&state==='clock');
    const rh=rail.clientHeight,prog=maxS?sc/maxS:0,center=prog*rh,top=clamp(center-chh/2,0,Math.max(0,rh-chh));
    cap.style.width=cw+'px';cap.style.height=chh+'px';cap.style.borderRadius=Math.min(cw/2,28)+'px';cap.style.transform=`translateY(${top}px)`;
    if(state==='clock'){const d=new Date(),s=d.getSeconds()+d.getMilliseconds()/1000,m=d.getMinutes()+s/60,hr=(d.getHours()%12)+m/60;cc.clearRect(0,0,76,76);cc.strokeStyle='#f3f3f1';cc.lineWidth=2;cc.beginPath();cc.arc(38,38,34,0,6.2832);cc.stroke();
      const hand=(a,l,w,col)=>{cc.strokeStyle=col;cc.lineWidth=w;cc.lineCap='round';cc.beginPath();cc.moveTo(38,38);cc.lineTo(38+Math.sin(a)*l,38-Math.cos(a)*l);cc.stroke()};hand(hr/12*6.2832,18,3,'#f3f3f1');hand(m/60*6.2832,26,2,'#f3f3f1');hand(s/60*6.2832,29,1.4,'#ff4d00')}
    if(playing){pt+=dt;if(pt>=60)pt=0}
    $('.sb-tl i',h).style.width=(pt/60*100)+'%';$('.sb-cur',h).textContent=fmt(pt);
  });
  ctx.demo(()=>{if(state==='player'){return}st=st>=maxS-5?0:Math.min(maxS,st+H);if(st>=maxS-5){setTimeout(()=>{if(inMusic())go('player')},1300);setTimeout(()=>{if(state==='player')go('clock')},3800)}},2600);
  ctx.status('BAR');
  return()=>{stop();clearInterval(sched);if(ac)try{ac.close()}catch(e){}removeEventListener('keydown',key)};
}});
