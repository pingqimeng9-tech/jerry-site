/* ─── 24 Music System ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'musicsys',name:'Music System',cat:'Interaction',mat:'音频',
spell:'点播放：唱片转起来，唱臂落下，频谱跟着声音跳。也可以拖入自己的音乐文件。',core:'一个引擎（Web Audio）+ 一套界面：播放 / 拖动进度 / 切歌 / 播放列表 / 频谱',tags:['Audio','Player','WebAudio','Visualizer'],
credit:{n:'callmiruko.cc 站内音乐播放（交互思路参考，界面、引擎与示例音乐均为原创）',u:'https://callmiruko.cc/',own:1},
notes:['内置三首用 Web Audio 现场合成的示例曲（没有任何外部音频文件）：每一步的音符都由“第几步”决定，所以拖进度条可以直接跳到任意位置。','点“添加本地音乐”或把音频文件拖进播放器，就会加入播放列表；本地文件走 <audio> 元素，同样接进频谱分析器。','播放 / 暂停、上一首 / 下一首、随机、单曲循环、进度拖动、音量都在；聚焦播放器后，空格 = 播放暂停，←/→ = 快退快进 5 秒，↑/↓ = 音量。','浏览器规定必须点一下才能发声，所以首次进入是静音待机状态。画廊缩略图里只演示动画，不发声。','VOL 与界面里的音量条是同一个值；BARS 改频谱条数；SPIN 改唱片转一圈的秒数。'],
knobs:[
{k:'VOL',label:'VOL 音量',v:.6,min:0,max:1,step:.05},
{k:'BARS',label:'BARS 频谱条数',v:40,min:12,max:72,step:2},
{k:'SPIN',label:'SPIN 唱片转一圈秒数',v:6,min:2,max:16,step:.5},
{k:'HUE',label:'HUE 主题色相',v:330,min:0,max:360,step:1}],
css:`.mu{background:radial-gradient(900px 600px at 20% 20%,hsl(var(--h) 45% 16%),#0b0c12);color:#f1f2f8;font-family:Inter,"PingFang SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif;--h:330;--ac:hsl(var(--h) 90% 66%)}
.mu-st{position:absolute;left:50%;top:50%;width:1200px;height:760px;display:grid;place-items:center}
.mu-card{position:relative;width:1100px;height:620px;border-radius:34px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);box-shadow:0 40px 100px rgba(0,0,0,.5);display:grid;grid-template-columns:400px 1fr;padding:34px;box-sizing:border-box;gap:36px;overflow:hidden}
.mu-card.drop:after{content:"松手即可添加音乐";position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.65);font-size:30px;font-weight:800;z-index:9;border-radius:34px;border:3px dashed var(--ac)}
.mu-L{position:relative;display:grid;place-items:center}
.mu-disc{position:relative;width:360px;height:360px;border-radius:50%;background:repeating-radial-gradient(circle,#15161c 0 3px,#1c1e26 3px 5px),#15161c;box-shadow:0 30px 60px rgba(0,0,0,.6),inset 0 0 0 6px #0c0d11;animation:mu-spin var(--sp,6s) linear infinite;animation-play-state:paused}
.mu-disc.run{animation-play-state:running}
.mu-disc:before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 20%,rgba(255,255,255,.14) 25%,transparent 32% 70%,rgba(255,255,255,.1) 76%,transparent 82%)}
.mu-lab{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;background:conic-gradient(from 0deg,hsl(var(--th) 85% 62%),hsl(calc(var(--th) + 60) 85% 55%),hsl(var(--th) 85% 62%));display:grid;place-items:center;font-size:44px;color:rgba(0,0,0,.45);font-weight:800}
.mu-lab:after{content:"";width:16px;height:16px;border-radius:50%;background:#0b0c12;position:absolute}
@keyframes mu-spin{to{transform:rotate(360deg)}}
.mu-arm{position:absolute;right:6px;top:10px;width:150px;height:16px;transform-origin:130px 8px;transform:rotate(-8deg);transition:transform .8s cubic-bezier(.3,.9,.3,1)}
.mu-arm:before{content:"";position:absolute;inset:6px 0 6px 10px;border-radius:4px;background:linear-gradient(#e7e9f2,#8f93a6)}.mu-arm:after{content:"";position:absolute;left:0;top:-2px;width:26px;height:20px;border-radius:4px;background:#2a2c38;border:1px solid #666b82}
.mu-R{display:flex;flex-direction:column;gap:14px;min-width:0}
.mu-meta small{font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:var(--ac)}.mu-t{font-size:40px;line-height:1.1;margin:8px 0 4px;letter-spacing:-.025em;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mu-a{margin:0;color:#a7acc0;font-size:16px}
.mu-vz{width:100%;height:96px;display:block}
.mu-bar{display:flex;align-items:center;gap:12px;font:600 13px ui-monospace,Menlo,monospace;color:#a7acc0}
.mu-seek{position:relative;flex:1;height:8px;border-radius:8px;background:rgba(255,255,255,.12);cursor:pointer}.mu-seek:before{content:"";position:absolute;left:0;right:0;top:-10px;bottom:-10px}
.mu-seek i{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:var(--ac);width:0}.mu-seek i:after{content:"";position:absolute;right:-7px;top:-4px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.5)}
.mu-ctl{display:flex;align-items:center;gap:14px}.mu-ctl button{border:0;background:rgba(255,255,255,.08);color:#fff;width:46px;height:46px;border-radius:50%;cursor:pointer;display:grid;place-items:center;transition:transform .2s,background .2s}.mu-ctl button:hover{transform:scale(1.08);background:rgba(255,255,255,.16)}
.mu-ctl button.on{background:var(--ac);color:#15060d}.mu-ctl .mu-pp{width:68px;height:68px;background:var(--ac);color:#15060d}
.mu-ctl svg{width:22px;height:22px;fill:currentColor}.mu-pp svg{width:30px;height:30px}
.mu-vol{margin-left:auto;display:flex;align-items:center;gap:10px;color:#a7acc0;font-size:13px}.mu-vol input{width:130px;accent-color:var(--ac)}
.mu-pl{flex:1;min-height:0;border-radius:20px;background:rgba(0,0,0,.25);padding:12px;display:flex;flex-direction:column;gap:4px;overflow:hidden}
.mu-ph{display:flex;align-items:center;justify-content:space-between;font:700 12px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#8d93a8;padding:2px 8px 6px}.mu-ph button{border:1px solid rgba(255,255,255,.2);background:none;color:#fff;border-radius:16px;font-weight:600;font-size:12px;font-family:inherit;padding:6px 12px;cursor:pointer;letter-spacing:0}.mu-ph button:hover{background:rgba(255,255,255,.1)}
.mu-items{overflow:auto;display:flex;flex-direction:column;gap:2px}.mu-items::-webkit-scrollbar{width:0}
.mu-it{display:grid;grid-template-columns:28px 1fr 130px 50px;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;cursor:pointer;font-size:14px}.mu-it:hover{background:rgba(255,255,255,.07)}.mu-it.on{background:rgba(255,255,255,.12);color:var(--ac)}.mu-it span{color:#8d93a8;font-size:13px}.mu-it.on span{color:inherit}.mu-it em{font-style:normal;font-variant-numeric:tabular-nums;text-align:right;color:#8d93a8;font-size:13px}`,
mount(h,ctx){
  const P=ctx.P;
  // 示例曲：全部现场合成。bpm 速度 / root 主音 MIDI / sc 音阶 / prog 和弦走向 / wave 琶音音色 / th 唱片色相
  const TRACKS=[
    {name:'Neon Drive',artist:'Synth Demo',dur:96,bpm:104,root:57,sc:[0,2,3,5,7,8,10],prog:[0,5,3,4],wave:'sawtooth',seed:11,th:330},
    {name:'Paper Lanterns',artist:'Synth Demo',dur:84,bpm:84,root:60,sc:[0,2,4,5,7,9,11],prog:[0,3,4,3],wave:'triangle',seed:42,th:40},
    {name:'Night Bus',artist:'Synth Demo',dur:108,bpm:116,root:55,sc:[0,2,3,5,7,9,10],prog:[0,2,5,4],wave:'square',seed:7,th:200}];
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const esc=s=>s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
  const ic={play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',prev:'<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM9.5 12L19 6v12z"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM5 6l9.500 6L5 18z"/></svg>',shuf:'<svg viewBox="0 0 24 24"><path d="M16 4l4 4-4 4V9h-3.500L9 15H4v-2h4l3.500-6H16zM4 7h5l1.500 2.500-1.200 2L8 9H4zM16 20l4-4-4-4v3h-3l-1.500-2.500-1.200 2L12 18h4z"/></svg>',rep:'<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2z"/><text x="12" y="15.500" font-size="7" text-anchor="middle" font-weight="800">1</text></svg>'};
  h.innerHTML=`<div class="stg mu"><div class="mu-st"><div class="mu-card">
    <div class="mu-L"><div class="mu-disc"><div class="mu-lab">♪</div></div><div class="mu-arm"></div></div>
    <div class="mu-R">
      <div class="mu-meta"><small>NOW PLAYING</small><div class="mu-t"></div><p class="mu-a"></p></div>
      <canvas class="mu-vz" width="1360" height="192"></canvas>
      <div class="mu-bar"><span class="mu-cur">0:00</span><div class="mu-seek"><i></i></div><span class="mu-du">0:00</span></div>
      <div class="mu-ctl"><button data-a="shuf" title="随机">${ic.shuf}</button><button data-a="prev">${ic.prev}</button><button class="mu-pp" data-a="pp">${ic.play}</button><button data-a="next">${ic.next}</button><button data-a="rep" title="单曲循环">${ic.rep}</button>
        <div class="mu-vol">音量<input type="range" min="0" max="1" step="0.05"></div></div>
      <div class="mu-pl"><div class="mu-ph"><span>PLAYLIST</span><button class="mu-add">＋ 添加本地音乐</button></div><div class="mu-items"></div></div>
    </div><input class="mu-file" type="file" accept="audio/*" multiple hidden></div></div></div>`;
  const root=$('.mu',h),st=$('.mu-st',h),card=$('.mu-card',h),disc=$('.mu-disc',h),arm=$('.mu-arm',h),lab=$('.mu-lab',h),cv=$('.mu-vz',h),g2=cv.getContext('2d'),seek=$('.mu-seek',h),sk=$('.mu-seek i',h),tT=$('.mu-t',h),tA=$('.mu-a',h),tC=$('.mu-cur',h),tD=$('.mu-du',h),pp=$('.mu-pp',h),items=$('.mu-items',h),vol=$('.mu-vol input',h),file=$('.mu-file',h),bShuf=$('[data-a=shuf]',h),bRep=$('[data-a=rep]',h);
  const ro=new ResizeObserver(()=>css(st,'transform',`translate(-50%,-50%) scale(${Math.min(root.clientWidth/1200,root.clientHeight/760)})`));ro.observe(root);
  const fmt=s=>!isFinite(s)||s<0?'0:00':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  const setP=(k,v)=>{P[k]=v;if(ctx.set)ctx.set(k,v)};
  // ── 引擎：合成曲和本地文件共用一套接口 ──
  const list=TRACKS.map(t=>({...t,kind:'gen'}));let idx=0,playing=false,shuf=false,rep=false;
  let AC=null,master,an,aud,bus=null,timer=0,T0=0,step=0,pausedAt=0,nz=null;
  const fq=new Uint8Array(128),urls=[];
  const ensure=()=>{if(AC||ctx.auto)return;AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();an=AC.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=.78;master.connect(an);an.connect(AC.destination);
    aud=new Audio();aud.crossOrigin='anonymous';AC.createMediaElementSource(aud).connect(master);aud.addEventListener('ended',()=>next(true));
    nz=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=nz.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1};
  const mid=m=>440*2**((m-69)/12);
  const rnd=(n,s)=>{let t=(s+Math.imul(n,0x9E3779B9))>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
  const tone=(t,f,len,type,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+len);o.connect(g);g.connect(bus);o.start(t);o.stop(t+len+.05)};
  const kick=t=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.25)};
  const hat=(t,v)=>{const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nz;f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f);f.connect(g);g.connect(bus);s.start(t);s.stop(t+.08)};
  const sd=tr=>60/tr.bpm/4;
  // 第 n 个十六分音符该响什么：只由 n 决定，所以能随意跳转
  const play16=(tr,n,t)=>{
    const bar=Math.floor(n/16),s=n%16,deg=tr.prog[bar%4],note=d=>tr.root+tr.sc[((d%7)+7)%7]+12*Math.floor(d/7);
    if(s%8===0){tone(t,mid(tr.root-12+tr.sc[deg]),sd(tr)*7,'triangle',.26);kick(t)}
    if(s%8===4&&bar%2===1)kick(t);
    if(rnd(n,tr.seed)<.72&&s%2===0)tone(t,mid(note(deg+[0,2,4,2,5,4,2,1][s/2%8]+7)),sd(tr)*2.2,tr.wave,.055);
    if(s%2===1)hat(t,s%4===3?.09:.05)};
  const stopGen=()=>{clearInterval(timer);if(bus){const b=bus;b.gain.setTargetAtTime(0,AC.currentTime,.03);setTimeout(()=>b.disconnect(),300);bus=null}};
  const startGen=off=>{stopGen();const tr=list[idx];bus=AC.createGain();bus.connect(master);T0=AC.currentTime-off;step=Math.ceil(off/sd(tr));
    timer=setInterval(()=>{while(T0+step*sd(tr)<AC.currentTime+.3){play16(tr,step,T0+step*sd(tr));step++}},50)};
  const cur=()=>{const tr=list[idx];if(!AC)return pausedAt;return tr.kind==='gen'?(playing?AC.currentTime-T0:pausedAt):(aud.currentTime||0)};
  const dur=()=>{const tr=list[idx];return tr.kind==='gen'?tr.dur:(aud&&aud.duration)||tr.dur||0};
  function load(i,autoplay){
    idx=(i+list.length)%list.length;const tr=list[idx];pausedAt=0;
    if(AC){stopGen();if(aud)aud.pause();if(tr.kind==='file'){aud.src=tr.url;aud.currentTime=0}}
    css(root,'--th',String(tr.th||hash(tr.name)));tT.textContent=tr.name;tA.textContent=tr.artist;lab.textContent=(tr.name[0]||'♪').toUpperCase();tD.textContent=fmt(dur());
    items.querySelectorAll('.mu-it').forEach((e,j)=>e.classList.toggle('on',j===idx));ctx.status('♪ '+tr.name);
    playing=false;if(autoplay)toggle(true);else paint()}
  const hash=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))%360;return x};
  function toggle(on){
    if(ctx.auto)return;ensure();const tr=list[idx];on=on===undefined?!playing:on;
    if(on){AC.resume();if(tr.kind==='gen')startGen(pausedAt);else aud.play().catch(()=>{});playing=true}
    else{if(tr.kind==='gen'){pausedAt=cur();stopGen()}else aud.pause();playing=false}
    paint()}
  function seekTo(t){const tr=list[idx];t=clamp(t,0,Math.max(0,dur()-.05));ensure();if(!AC)return;if(tr.kind==='gen'){pausedAt=t;if(playing)startGen(t)}else aud.currentTime=t}
  function next(auto){if(rep&&auto){seekTo(0);if(list[idx].kind==='file')aud.play();return}
    let n=idx+1;if(shuf&&list.length>1){do n=Math.floor(Math.random()*list.length);while(n===idx)}load(n,playing||auto)}
  const paint=()=>{pp.innerHTML=playing?ic.pause:ic.play;disc.classList.toggle('run',playing);css(arm,'transform',playing?'rotate(24deg)':'rotate(-8deg)');bShuf.classList.toggle('on',shuf);bRep.classList.toggle('on',rep)};
  const drawList=()=>{items.innerHTML=list.map((t,i)=>`<div class="mu-it${i===idx?' on':''}" data-i="${i}"><span>${i+1}</span><b>${esc(t.name)}</b><span>${esc(t.artist)}</span><em>${t.dur?fmt(t.dur):'–'}</em></div>`).join('')};
  const addFiles=fs=>{[...fs].filter(f=>f.type.indexOf('audio')===0||!f.type).forEach(f=>{const u=URL.createObjectURL(f);urls.push(u);list.push({kind:'file',url:u,name:f.name.lastIndexOf('.')>0?f.name.slice(0,f.name.lastIndexOf('.')):f.name,artist:'本地文件',dur:0,th:hash(f.name)})});drawList();if(fs.length&&!playing)load(list.length-fs.length,true)};
  // ── 事件 ──
  h.querySelector('.mu-ctl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
    if(a==='pp')toggle();else if(a==='next')next();else if(a==='prev'){if(cur()>3)seekTo(0);else load(idx-1,playing)}
    else if(a==='shuf'){shuf=!shuf;paint()}else if(a==='rep'){rep=!rep;paint()}});
  items.addEventListener('click',e=>{const it=e.target.closest('.mu-it');if(!it)return;const i=+it.dataset.i;if(i===idx)toggle();else load(i,true)});
  $('.mu-add',h).addEventListener('click',()=>file.click());file.addEventListener('change',()=>{addFiles(file.files);file.value=''});
  card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drop')});card.addEventListener('dragleave',e=>{if(e.target===card)card.classList.remove('drop')});
  card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drop');addFiles(e.dataTransfer.files)});
  vol.addEventListener('input',()=>setP('VOL',+vol.value));
  let sdrag=false;const sp=e=>seekTo(clamp((e.clientX-seek.getBoundingClientRect().left)/seek.getBoundingClientRect().width,0,1)*dur());
  seek.addEventListener('pointerdown',e=>{sdrag=true;seek.setPointerCapture(e.pointerId);sp(e)});seek.addEventListener('pointermove',e=>{if(sdrag)sp(e)});seek.addEventListener('pointerup',()=>{sdrag=false});
  root.tabIndex=0;root.style.outline='none';root.addEventListener('pointerdown',()=>root.focus({preventScroll:true}));
  root.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'&&e.key!==' ')return;
    if(e.key===' '){toggle();e.preventDefault()}else if(e.key==='ArrowRight')seekTo(cur()+5);else if(e.key==='ArrowLeft')seekTo(cur()-5);
    else if(e.key==='ArrowUp'){setP('VOL',clamp(P.VOL+.05,0,1));e.preventDefault()}else if(e.key==='ArrowDown'){setP('VOL',clamp(P.VOL-.05,0,1));e.preventDefault()}
    else if(e.key.toLowerCase()==='n')next();else if(e.key.toLowerCase()==='p')load(idx-1,playing)});
  // ── 每帧：进度、频谱、转速、音量 ──
  let ph=0;
  const draw=()=>{const W=cv.width,H=cv.height,n=P.BARS|0,w=W/n;g2.clearRect(0,0,W,H);
    const live=AC&&playing;if(live)an.getByteFrequencyData(fq);
    for(let i=0;i<n;i++){let v;
      if(live){const a=Math.floor(Math.pow(i/n,1.7)*100)+1;v=fq[a]/255}
      else v=(.12+.1*Math.sin(ph*2+i*.5)+(ctx.auto?.25*Math.abs(Math.sin(ph*3+i*.7)):0))*(playing?1:.8);
      const hh=Math.max(6,v*H*.95);g2.fillStyle=`hsl(${P.HUE+i/n*50} 90% ${58+v*18}%)`;
      g2.beginPath();(g2.roundRect||g2.rect).call(g2,i*w+w*.18,H-hh,w*.64,hh,w*.3);g2.fill()}};
  drawList();load(0,false);paint();vol.value=P.VOL;
  let lastEnd=0;
  const stop=ticker(dt=>{
    ph+=dt;css(root,'--h',String(P.HUE));css(disc,'--sp',P.SPIN+'s');
    if(ctx.auto&&!playing){playing=true;paint()}   // 画廊缩略图：只演示动画，不发声
    if(AC&&master)master.gain.value=P.VOL;if(+vol.value!==P.VOL)vol.value=P.VOL;
    const c=cur(),d=dur();if(!sdrag){css(sk,'width',(d?clamp(c/d,0,1)*100:0)+'%');tC.textContent=fmt(c)}
    if(list[idx].kind==='file'&&d)tD.textContent=fmt(d);
    if(playing&&list[idx].kind==='gen'&&c>=d&&performance.now()-lastEnd>800){lastEnd=performance.now();next(true)}
    draw()});
  return()=>{stop();stopGen();if(aud){aud.pause();aud.src=''}if(AC)AC.close();urls.forEach(u=>URL.revokeObjectURL(u));ro.disconnect()};
}});
