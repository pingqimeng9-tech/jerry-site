/* ─── 21 New Era Motion ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'newera',name:'New Era Motion',cat:'Motion',mat:'运镜',bake:1,
spell:'页面倾斜着铺开 → 镜头依次推到标题、玻璃卡、人像、数据；右下角是整页缩略图：黄框是镜头此刻的位置，拖字母圆点改落点。',core:'镜头不是动画，是一条随时间变化的 transform',tags:['Motion','Camera','3D','Glass','Timeline'],
credit:{n:'Dribbble · New Era – Your Project UI Motion',u:'https://dribbble.com/shots/26498015-New-Era-Your-Project-UI-Motion',own:1},
notes:['整个页面是一块 1400×960 的画布，镜头就是一条 transform：把页面坐标 (x,y) 钉在屏幕中心，再叠 rotateX / rotateY / rotateZ 和 scale。所谓运镜，其实只是 6 个数在变：x、y、放大、两个倾斜、一个横滚。','每一镜 = 目标位置 + 放大倍数。从上一镜出发走 SPEED 决定的时长（四次方缓入缓出），移动中叠一段先升后降的运动模糊，到位后停留并缓慢漂移（放大 +5%，横滚回正）。','整条时间线是时间的纯函数 render(T)：没有 GSAP、没有定时器链，所以能暂停、能跳到任一镜、任何时刻读到的都是同一帧。','右下角小地图就是“圈化位置”：字母是每一镜的落点，虚线框是当前镜头看到的范围，框越小放得越大。拖圆点改位置，拖框右下角的方块改放大；Tune 里的数字和导出的代码会同步变成你调好的值。','玻璃卡 = 1 张磨砂正面 + 8 层半透明侧边叠出厚度；高光是 --sx 驱动的斜向渐变，随时间扫过。噪点改为一次性生成的小画布贴图，比 SVG 滤镜 + 混合模式省得多。'],
knobs:[
{k:'SPEED',label:'SPEED 运镜速度 ×',v:1,min:.4,max:2.5,step:.1,remount:true},
{k:'HOLD',label:'HOLD 停留时长 ×',v:1,min:.4,max:2.5,step:.1,remount:true},
{k:'TILT',label:'TILT 倾斜强度',v:1,min:0,max:2,step:.1},
{k:'MBLUR',label:'MBLUR 运动模糊 px',v:3,min:0,max:8,step:.5},
{k:'DRIFT',label:'DRIFT 停留漂移',v:1,min:0,max:3,step:.1},
{k:'MAP',label:'MAP 运镜小地图',v:1,min:0,max:1,step:1},
{k:'GLASS',label:'GLASS 真毛玻璃（部分设备会闪）',v:0,min:0,max:1,step:1},
{k:'A_X',label:'A·Logo 位置 X',v:330,min:0,max:1400,step:5},{k:'A_Y',label:'A·Logo 位置 Y',v:200,min:0,max:960,step:5},{k:'A_Z',label:'A·Logo 放大',v:1.9,min:.5,max:3.2,step:.05},
{k:'B_X',label:'B·标题 位置 X',v:400,min:0,max:1400,step:5},{k:'B_Y',label:'B·标题 位置 Y',v:600,min:0,max:960,step:5},{k:'B_Z',label:'B·标题 放大',v:1.55,min:.5,max:3.2,step:.05},
{k:'C_X',label:'C·玻璃卡 位置 X',v:790,min:0,max:1400,step:5},{k:'C_Y',label:'C·玻璃卡 位置 Y',v:500,min:0,max:960,step:5},{k:'C_Z',label:'C·玻璃卡 放大',v:2.2,min:.5,max:3.2,step:.05},
{k:'D_X',label:'D·人像 位置 X',v:1190,min:0,max:1400,step:5},{k:'D_Y',label:'D·人像 位置 Y',v:430,min:0,max:960,step:5},{k:'D_Z',label:'D·人像 放大',v:1.75,min:.5,max:3.2,step:.05},
{k:'E_X',label:'E·数据 位置 X',v:320,min:0,max:1400,step:5},{k:'E_Y',label:'E·数据 位置 Y',v:830,min:0,max:960,step:5},{k:'E_Z',label:'E·数据 放大',v:2,min:.5,max:3.2,step:.05},
{k:'F_X',label:'F·全景 位置 X',v:700,min:0,max:1400,step:5},{k:'F_Y',label:'F·全景 位置 Y',v:480,min:0,max:960,step:5},{k:'F_Z',label:'F·全景 放大',v:1,min:.5,max:3.2,step:.05}],
css:`.ne{background:#aeb868;color:#f4f5f8;font-family:Inter,"SF Pro Display","Helvetica Neue",Helvetica,Arial,"PingFang SC","Noto Sans SC",sans-serif}
.ne-st{position:absolute;left:50%;top:50%;width:1600px;height:1200px;overflow:hidden;perspective:2000px}
.ne-world{position:absolute;left:0;top:0;width:1400px;height:960px;transform-origin:0 0;background:linear-gradient(135deg,#2b2f45,#1b1e2d 70%);overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.25);opacity:0;will-change:transform,filter,opacity}
.ne-world:before{content:"";position:absolute;inset:0;z-index:20;pointer-events:none;background:var(--ne-nz);background-size:96px}
.ne-a{position:absolute}
.ne-o{border-radius:50%;filter:blur(60px);opacity:0}
.ne-logo{left:70px;top:46px;font-weight:500;font-size:24px;display:flex}
.ne-nav{left:430px;top:54px;display:flex;gap:34px;font-size:14px;color:#8d93a8}.ne-nav b{color:#f4f5f8;font-weight:500}
.ne-ico{right:70px;top:50px;display:flex;gap:22px}.ne-ico i{width:16px;height:16px;border:2px solid #f4f5f8;border-radius:50%}
.ne-intro{left:70px;top:150px;display:flex;gap:26px;align-items:flex-start}
.ne-k b{font-size:46px;color:#e6f56a;display:block;line-height:1}.ne-k small{font-size:14px;color:#8d93a8}
.ne-t{width:300px;font-size:18px;line-height:1.35;padding-top:4px}
.ne-wd{display:inline-block;white-space:nowrap}
.ne-ch{display:inline-block;opacity:0}
.ne-h1{left:70px;top:400px;font-weight:800;font-size:120px;line-height:.96;letter-spacing:-.04em}
.ne-h1>div{display:flex;align-items:center;white-space:nowrap}
.ne-pill{background:linear-gradient(#f2fc8a,#d6e84c);box-shadow:inset 0 2px 0 rgba(255,255,255,.7),0 8px 20px rgba(214,232,76,.3);color:#222;font-size:15px;font-weight:800;letter-spacing:0;padding:11px 22px;border-radius:30px;margin-right:14px;transform:scale(0)}
.ne-rule{left:70px;top:790px;width:520px;height:2px;background:rgba(255,255,255,.18);transform-origin:left;transform:scaleX(0)}
.ne-stat{left:70px;top:820px;display:flex;align-items:center;gap:16px;opacity:0}
.ne-av{display:flex}.ne-av i{width:44px;height:44px;border-radius:50%;margin-right:-12px;border:3px solid #1d2030}
.ne-stat b{font-size:22px;display:block}.ne-stat small{font-size:12px;color:#8d93a8}
.ne-arrow{width:46px;height:46px;border:2px solid #8d93a8;border-radius:50%;display:grid;place-items:center;margin-left:80px}
.ne-cl{left:540px;top:320px;width:500px;height:360px;perspective:1100px}
.ne-gw{position:absolute;width:380px;height:240px;transform-style:preserve-3d;opacity:0}
.ne-edge{position:absolute;inset:0;border-radius:26px;background:rgba(140,255,170,.2);border:1px solid rgba(255,255,255,.28)}
.ne-face{position:absolute;inset:0;border-radius:26px;overflow:hidden;border:1px solid rgba(255,255,255,.5);background:linear-gradient(135deg,rgba(255,255,255,.36),rgba(255,255,255,.05) 38%,rgba(255,255,255,.02) 62%,rgba(255,255,255,.22)),var(--t);box-shadow:inset 0 2px 0 rgba(255,255,255,.75),inset 0 -30px 40px -22px rgba(255,255,255,.2),0 40px 60px -12px rgba(0,0,0,.55)}
.ne:not(.ne-bf) .ne-face{background-color:rgba(255,255,255,.12)}
.ne-bf .ne-face{-webkit-backdrop-filter:blur(16px) saturate(1.7);backdrop-filter:blur(16px) saturate(1.7)}
.ne-face:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 36%,rgba(255,255,255,.6) 48%,rgba(255,255,255,.08) 55%,transparent 63%);background-size:320% 100%;background-position:var(--sx,130%) 0}
.ne-chip{position:absolute;left:30px;top:78px;width:54px;height:40px;border-radius:9px;background:linear-gradient(135deg,#f6e3a1,#b98f3c);box-shadow:inset 0 0 0 1px rgba(0,0,0,.2)}
.ne-chip:before{content:"";position:absolute;inset:12px 0;border-top:1px solid rgba(0,0,0,.25);border-bottom:1px solid rgba(0,0,0,.25)}
.ne-no{position:absolute;left:30px;bottom:50px;font-size:18px;letter-spacing:.2em;opacity:.9}
.ne-own{position:absolute;left:30px;bottom:24px;font-size:12px;color:rgba(255,255,255,.7)}
.ne-vs{position:absolute;right:28px;top:22px;font-style:italic;font-weight:800;font-size:34px;letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.25)}
.ne-card{width:240px;height:300px;border-radius:40px;overflow:hidden;opacity:0}
.ne-c1{left:1070px;top:110px;background:linear-gradient(#6df27f,#9cf58a 60%,#3b4a47)}
.ne-c2{left:1110px;top:450px;background:linear-gradient(#f3f67a,#d8f05a 60%,#2d3028)}
.ne-hair,.ne-head,.ne-body{position:absolute;left:50%}
.ne-hair{top:40px;width:104px;height:90px;margin-left:-52px;border-radius:60% 60% 30% 30%;background:#2a1d1a}
.ne-c2 .ne-hair{height:160px;background:#7a4c2a}
.ne-head{top:56px;width:84px;height:100px;margin-left:-42px;border-radius:50% 50% 45% 45%;background:#e7b9a0}
.ne-body{top:160px;width:190px;height:220px;margin-left:-95px;border-radius:90px 90px 0 0}
.ne-c1 .ne-body{background:#d9b3c4}.ne-c2 .ne-body{background:#121212}
.ne-card p{position:absolute;left:20px;bottom:24px;margin:0;font-size:13px;line-height:1.25;width:110px}
.ne-card em{position:absolute;right:16px;bottom:18px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.5)}
.ne-bf .ne-card em{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.ne-badge{left:985px;top:700px;width:92px;height:92px;border-radius:50%;background:radial-gradient(#d6d1a4,#8f9070);border:2px dashed rgba(255,255,255,.5);opacity:0}
.ne-spark{color:#8d93a8;font-size:22px;opacity:0}
.ne-doodle{left:500px;top:720px;width:64px;opacity:0}
.ne-cur{position:absolute;left:0;top:0;width:30px;opacity:0;z-index:25;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}
.ne-map{position:absolute;right:12px;bottom:12px;width:clamp(150px,30%,260px);aspect-ratio:1400/960;border:1px solid #ffffff66;border-radius:10px;background:#0b0d16;overflow:hidden;touch-action:none;z-index:5;font:600 10px var(--mono,monospace);color:#fff;box-shadow:0 8px 30px #0006}
.ne-map[hidden]{display:none}
.ne-mini{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.ne-flat{position:absolute;left:0;top:0;width:1400px;height:960px;transform-origin:0 0;transform:scale(var(--k,.13));background:linear-gradient(135deg,#2b2f45,#1b1e2d 70%)}
.ne-flat .ne-o{opacity:.55}.ne-flat .ne-gw,.ne-flat .ne-card,.ne-flat .ne-badge,.ne-flat .ne-doodle,.ne-flat .ne-stat,.ne-flat .ne-nav,.ne-flat .ne-ico{opacity:1}.ne-flat .ne-spark{opacity:.8}
.ne-flat .ne-rule,.ne-flat .ne-pill{transform:none}.ne-flat .ne-cur{display:none}
.ne-flat .ne-gw:nth-child(1){transform:rotate(-16deg)}.ne-flat .ne-gw:nth-child(2){transform:rotate(-4deg)}.ne-flat .ne-gw:nth-child(3){transform:rotate(9deg)}
.ne-map svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ne-path{fill:none;stroke:#ffffff90;stroke-width:2.5;stroke-dasharray:10 8;vector-effect:non-scaling-stroke}
.ne-cap{position:absolute;left:6px;top:4px;font-size:8px;opacity:.75;letter-spacing:.04em;pointer-events:none;text-shadow:0 1px 3px #000;z-index:3}
.ne-fr{position:absolute;border:2px solid #e6f56a;box-shadow:0 0 0 999px #0008;border-radius:2px;cursor:move;z-index:1}
.ne-hd{position:absolute;right:-8px;bottom:-8px;width:16px;height:16px;border-radius:4px;background:#e6f56a;cursor:nwse-resize}
.ne-dot{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;display:grid;place-items:center;background:#000a;border:1.5px solid #fff;cursor:grab;z-index:2}
.ne-dot.on{background:#e6f56a;color:#111;border-color:#e6f56a}`,
mount(h,ctx){
  const P=ctx.P,SPEED=P.SPEED,HOLD=P.HOLD;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 运镜表：每一镜 = 对准页面哪个点 (x,y) + 放大 z + 三个倾斜 (rx,ry,rz) + 移动 move 秒 + 停留 hold 秒
  // 每一帧都重新读取，所以 Tune 里的数字实时生效
  const shots=()=>[
    {id:'A',name:'Logo + 简介',x:P.A_X,y:P.A_Y,z:P.A_Z,rx:3,ry:-6,rz:3,move:1.3,hold:1.1},
    {id:'B',name:'标题',x:P.B_X,y:P.B_Y,z:P.B_Z,rx:2,ry:5,rz:-3,move:1.3,hold:.9},
    {id:'C',name:'玻璃卡',x:P.C_X,y:P.C_Y,z:P.C_Z,rx:7,ry:-14,rz:-6,move:1.4,hold:3},
    {id:'D',name:'人像',x:P.D_X,y:P.D_Y,z:P.D_Z,rx:3,ry:10,rz:4,move:1.3,hold:1.9},
    {id:'E',name:'数据',x:P.E_X,y:P.E_Y,z:P.E_Z,rx:-3,ry:-5,rz:2,move:1.3,hold:1.3},
    {id:'F',name:'全景',x:P.F_X,y:P.F_Y,z:P.F_Z,rx:0,ry:0,rz:0,move:1.5,hold:1.1}
  ];
  // 缓动（o = out，io = inOut，数字 = 次方）
  const lerp=(a,b,t)=>a+(b-a)*t,seq=(v,...s)=>s.reduce((a,[to,p])=>lerp(a,to,p),v);
  const bo=s=>t=>1+(s+1)*(t-1)**3+s*(t-1)**2;
  const ez={o2:t=>1-(1-t)**2,o3:t=>1-(1-t)**3,o4:t=>1-(1-t)**4,i4:t=>t**4,io2:t=>t<.5?2*t*t:1-(-2*t+2)**2/2,io3:t=>t<.5?4*t**3:1-(-2*t+2)**3/2,io4:t=>t<.5?8*t**4:1-(-2*t+2)**4/2};
  const b13=bo(1.3),b14=bo(1.4),b15=bo(1.5),b2=bo(2),b22=bo(2.2),b3=bo(3);
  const css=(e,p,v)=>{const c=e._c||(e._c={});if(c[p]===v)return;c[p]=v;if(p[0]==='-')e.style.setProperty(p,v);else e.style[p]=v};
  const owners=['Zahra Mohammadi','Alex Moreno','Mia Chen'];
  let slabs='';[['left:0;top:90px;--t:rgba(110,120,210,.3)'],['left:60px;top:20px;--t:rgba(255,255,255,.08)'],['left:110px;top:110px;--t:rgba(109,242,127,.3)']].forEach(([s],i)=>{
    let e='';for(let k=1;k<=8;k++)e+=`<div class="ne-edge" style="transform:translateZ(${-k*1.8}px)"></div>`;
    slabs+=`<div class="ne-gw" style="${s}">${e}<div class="ne-face"><div class="ne-chip"></div><div class="ne-vs">VISA</div><div class="ne-no">•••• •••• •••• ${4821+i*137}</div><div class="ne-own">${owners[i]}</div></div></div>`});
  const dotsH=['A','B','C','D','E','F'].map((c,i)=>`<b class="ne-dot" data-i="${i}">${c}</b>`).join('');
  const worldHTML=`
    <div class="ne-a ne-o ne-o1" style="left:620px;top:400px;width:320px;height:320px;background:#6df27f"></div>
    <div class="ne-a ne-o ne-o2" style="left:860px;top:300px;width:220px;height:220px;background:#e6f56a"></div>
    <div class="ne-a ne-logo">Finance</div>
    <div class="ne-a ne-nav"><b>Home</b><span>Career</span><span>Plans</span><span>Our Story</span><span>Contact</span><span>Learn &amp; Support</span></div>
    <div class="ne-a ne-ico"><i></i><i></i></div>
    <div class="ne-a ne-intro"><div class="ne-k"><b class="ne-num">0K</b><small>Design</small></div><div class="ne-t">A modern agency with new solution to creating website.</div></div>
    <div class="ne-a ne-h1"><div class="ne-l1">NEW ERA</div><div><span class="ne-pill">JOIN NOW</span><span class="ne-yo">YOUR</span></div><div class="ne-l3">PROJECT</div></div>
    <div class="ne-a ne-rule"></div>
    <div class="ne-a ne-stat"><div class="ne-av"><i style="background:#f3c64f"></i><i style="background:#8bd49a"></i><i style="background:#e9a98b"></i></div><div><b>10.2k+</b><small>Active users around the world</small></div><div class="ne-arrow">→</div></div>
    <div class="ne-a ne-cl">${slabs}</div>
    <div class="ne-a ne-card ne-c1"><div class="ne-hair"></div><div class="ne-head"></div><div class="ne-body"></div><p>Consulting in design</p><em></em></div>
    <div class="ne-a ne-card ne-c2"><div class="ne-hair"></div><div class="ne-head"></div><div class="ne-body"></div><p>Consulting on development</p><em class="ne-btn"></em></div>
    <div class="ne-a ne-badge"></div>
    <div class="ne-a ne-spark" style="left:500px;top:330px">✦</div><div class="ne-a ne-spark" style="left:1060px;top:660px">✧</div><div class="ne-a ne-spark" style="left:640px;top:880px">✦</div>
    <svg class="ne-a ne-doodle" viewBox="0 0 60 30" fill="none" stroke="#cfd3e0" stroke-width="2" stroke-linecap="round"><path d="M4 8l14 2-8 8M10 10c14 6 30 14 40 4"/></svg>
    <svg class="ne-cur" viewBox="0 0 24 24"><path d="M3 2l7 19 3-8 8-3z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>
`;
  h.innerHTML=`<div class="stg ne"><div class="ne-st"><div class="ne-world">${worldHTML}</div></div>
  <div class="ne-map" hidden><div class="ne-mini"><div class="ne-flat">${worldHTML.replace('>0K<','>12K<')}</div></div><svg viewBox="0 0 1400 960" preserveAspectRatio="none"><polyline class="ne-path"/></svg><div class="ne-cap">CAMERA MAP</div><div class="ne-fr"><b class="ne-hd"></b></div>${dotsH}</div></div>`;
  const root=$('.ne',h),st=$('.ne-st',h),W=$('.ne-world',h),map=$('.ne-map',h),fr=$('.ne-fr',h),path=$('.ne-path',h),dots=[...map.querySelectorAll('.ne-dot')];
  const q=s=>$(s,W),qa=s=>[...W.querySelectorAll(s)];
  // 把文字拆成字符（词保持不断行），返回所有字符 span
  const split=(e,words)=>{const t=e.textContent;e.textContent='';const out=[];const put=(p,s)=>{const c=document.createElement('span');c.className='ne-ch';c.textContent=s===' '?'\u00a0':s;p.appendChild(c);out.push(c)};
    if(!words){[...t].forEach(c=>put(e,c));return out}
    t.split(' ').forEach((w,i,a)=>{const s=document.createElement('span');s.className='ne-wd';[...w].forEach(c=>put(s,c));e.appendChild(s);if(i<a.length-1)e.appendChild(document.createTextNode(' '))});return out};
  const LG=split(q('.ne-logo')),L1=split(q('.ne-l1')),W2=split(q('.ne-yo')),L3=split(q('.ne-l3')),TX=split(q('.ne-t'),1);
  const G=[[LG,.9,.04],[L1,1,.05],[W2,1.3,.06],[L3,1.5,.05],[TX,2.3,.03]].map(([cs,t0,s])=>({cs,t0,s,n:0}));
  const gw=qa('.ne-gw'),faces=qa('.ne-face'),o1=q('.ne-o1'),o2=q('.ne-o2'),c1=q('.ne-c1'),c2=q('.ne-c2'),btn=q('.ne-btn'),badge=q('.ne-badge'),sparks=qa('.ne-spark'),doodle=q('.ne-doodle'),cur=q('.ne-cur'),pill=q('.ne-pill'),num=q('.ne-num'),nav=q('.ne-nav'),ico=q('.ne-ico'),rule=q('.ne-rule'),stat=q('.ne-stat');
  // 噪点：一次性生成的小贴图，代替 SVG 滤镜 + 混合模式
  const nz=document.createElement('canvas');nz.width=nz.height=96;const nc=nz.getContext('2d'),im=nc.createImageData(96,96);
  for(let i=0;i<im.data.length;i+=4){im.data[i]=im.data[i+1]=im.data[i+2]=Math.random()*255;im.data[i+3]=16}
  nc.putImageData(im,0,0);root.style.setProperty('--ne-nz','url('+nz.toDataURL()+')');
  const ro=new ResizeObserver(()=>{css(st,'transform',`translate(-50%,-50%) scale(${Math.min(root.clientWidth/1600,root.clientHeight/1200)})`);if(map.clientWidth)map.style.setProperty('--k',map.clientWidth/1400)});ro.observe(root);ro.observe(map);
  // 镜头时间线：开场两段 + 六镜 + 退场。每一镜的起点 = 上一镜的起点 + 移动 + 停留
  const plan=()=>{
    const sh=shots(),kf=[{t:0,d:1.8,e:E.expoOut,to:{z:.9,rx:0,rz:0}},{t:3,d:1.4,e:ez.io3,to:{z:1}}],sts=[];let t=4.4;
    sh.forEach(s=>{const d=s.move/SPEED,hd=s.hold*HOLD;sts.push({t,d});
      kf.push({t,d,hd,e:ez.io4,b:P.MBLUR,to:{cx:s.x,cy:s.y,z:s.z,rx:s.rx*P.TILT,ry:s.ry*P.TILT,rz:s.rz*P.TILT}});t+=d+hd});
    kf.push({t,d:.9,e:ez.i4,b:'rise',to:{cy:1300,z:.8,rz:8,rx:-35}});
    return{sh,kf,st:sts,tx:t,len:t+1.4}};
  const AX=['cx','cy','z','rx','ry','rz'];
  const cam=(T,pl)=>{
    let c={cx:700,cy:480,z:.55,rx:55,ry:0,rz:-8,b:0};
    for(const k of pl.kf){
      if(T<k.t)return c;
      const to=Object.assign({},c,k.to,{b:0}),e=T-k.t;
      if(e<k.d){const p=e/k.d,o={b:0};for(const n of AX)o[n]=lerp(c[n],to[n],k.e(p));
        o.b=k.b==='rise'?7*p**3:p<.35?(k.b||0)*(p/.35)**3:(k.b||0)*(1-(p-.35)/.65)**3;return o}
      c=to;
      if(k.hd){const dr=e-k.d,end=Object.assign({},c,{z:c.z*(1+.05*P.DRIFT),rz:c.rz+(c.rz>0?-1:1)*P.DRIFT});
        if(dr<k.hd){const o={b:0};for(const n of AX)o[n]=lerp(c[n],end[n],dr/k.hd);return o}
        c=end}}
    return c};
  const FAN=[{r:-24,x:-50,ry:-14,y:0},{r:-2,x:0,ry:12,y:-16},{r:15,x:50,ry:22,y:0}],R0=[-16,-4,9],FLOAT=[[6,2.8],[-8,3.2],[7,3.6]];
  let T=0,pl=plan(),frozen=false,drag=null,thaw=0,ci=-2,lastN='',lastMap='',lastKey='';
  const setP=(k,v)=>{P[k]=v;if(ctx.set)ctx.set(k,v)};
  function render(){
    pl=plan();
    // 改了某一镜的参数（滑块或拖拽）：时间停在那一镜刚到位的地方，别让镜头在两镜之间乱跳
    const key=pl.sh.map(s=>s.x+','+s.y+','+s.z).join('|');
    if(lastKey&&key!==lastKey&&!drag){const i=pl.sh.findIndex((s,j)=>s.x+','+s.y+','+s.z!==lastKey.split('|')[j]);if(i>=0){clearTimeout(thaw);frozen=true;T=pl.st[i].t+pl.st[i].d+.05;thaw=setTimeout(()=>{frozen=false},1500)}}
    lastKey=key;
    const P1=(t0,d)=>clamp((T-t0)/d,0,1),R=(t0,d,e)=>(e||ez.o4)(P1(t0,d)),tri=(t0,d)=>{const u=P1(t0,d);return u<.5?u*2:2-u*2};
    const [tA,tB,tC,tD,tE]=pl.st.map(s=>s.t),H=HOLD;
    // 镜头
    const c=cam(T,pl),f=n=>+n.toFixed(2);
    css(W,'transform',`translate3d(800px,600px,0) rotateX(${f(c.rx)}deg) rotateY(${f(c.ry)}deg) rotateZ(${f(c.rz)}deg) scale(${+c.z.toFixed(3)}) translate3d(${f(-c.cx)}px,${f(-c.cy)}px,0)`);
    css(W,'filter',`blur(${c.b>.25?Math.round(c.b*2)/2:0}px)`);
    css(W,'opacity',String(+(R(0,.5)*(1-R(pl.tx+.6,.3))).toFixed(3)));
    // 逐字出现
    G.forEach(g=>{const n=T<g.t0?0:Math.min(g.cs.length,Math.floor((T-g.t0)/g.s)+1);if(n!==g.n){for(let i=Math.min(n,g.n);i<Math.max(n,g.n);i++)g.cs[i].style.opacity=i<n?1:0;g.n=n}});
    // A 镜：Logo 字母依次扫成荧光绿再回白
    LG.forEach((s,i)=>{const u=P1(tA+1.2*H+.07*i,.15)-P1(tA+1.8*H+.07*i,.3);css(s,'color',u>.004?`rgb(${Math.round(lerp(244,230,u))},${Math.round(lerp(245,245,u))},${Math.round(lerp(248,106,u))})`:'')});
    const pn=R(1.8,.6);css(nav,'opacity',String(+pn.toFixed(3)));css(ico,'opacity',String(+pn.toFixed(3)));css(nav,'transform',`translateY(${f(-10*(1-pn))}px)`);css(ico,'transform',`translateY(${f(-10*(1-pn))}px)`);
    // B 镜：按钮脉冲
    css(pill,'transform',`scale(${+(R(1.7,.5,b22)*(1+.14*ez.io3(tri(tB+1.3*H,.5)))).toFixed(3)})`);
    // 数字：开场数一次，E 镜再数一次
    const cn=T>=tE+1.3*H?12*R(tE+1.3*H,.9,ez.o3):T>=2?12*R(2,.9,ez.o3):0,ns=Math.round(cn)+'K';if(ns!==lastN){num.textContent=ns;lastN=ns}
    css(rule,'transform',`scaleX(${+R(2.2,.8).toFixed(3)})`);css(stat,'opacity',String(+R(2.4,.5).toFixed(3)));
    // 光球
    const oo=String(+(.55*R(1.2,1.2)).toFixed(3)),po=R(tC+1.8*H,1.6,ez.io2);css(o1,'opacity',oo);css(o2,'opacity',oo);css(o1,'transform',`translateX(${f(60*po)}px) scale(${+(1+.2*po).toFixed(3)})`);
    // 玻璃卡：入场下落 → C 镜扇形展开 → 收回
    gw.forEach((g,i)=>{
      const pi=R(2.6+.2*i,1,b13),pf=R(tC+1.8*H,.9,b15),pr=R(tC+3.9*H,.9,ez.io3),n=FAN[i];
      const x=seq(0,[n.x,pf],[0,pr]),y=seq(-300,[0,pi],[n.y,pf],[0,pr]),rz=seq(R0[i],[n.r,pf],[R0[i],pr]),ry=seq(0,[n.ry,pf],[0,pr]);
      css(g,'transform',`translate3d(${f(x)}px,${f(y)}px,0) rotate(${f(rz)}deg) rotateY(${f(ry)}deg) rotateX(${f(lerp(50,0,pi))}deg)`);
      css(g,'opacity',String(+clamp(pi,0,1).toFixed(3)));
      css(faces[i],'--sx',f(lerp(130,-60,R(tC+2*H+.12*i,1.6,ez.io3)))+'%');
      const[fv,fd]=FLOAT[i];css(faces[i],'transform',`translateY(${f(fv*(.5-.5*Math.cos(Math.PI*T/fd)))}px)`)});
    // 人像卡
    const p1=R(3,.9,b14),p2=R(3.3,.9,b14),lift=R(tD+1.6*H,.5,b2),down=R(tD+3*H,.5,ez.o4);
    css(c1,'transform',`translate(0,${f(lerp(160,0,p1))}px) rotate(${f(lerp(-6,0,p1))}deg) scale(${+lerp(.6,1,p1).toFixed(3)})`);css(c1,'opacity',String(+clamp(p1,0,1).toFixed(3)));
    css(c2,'transform',`translate(0,${f(seq(200,[0,p2],[-18,lift],[0,down]))}px) rotate(${f(lerp(6,0,p2))}deg) scale(${+seq(.6,[1,p2],[1.05,lift],[1,down]).toFixed(3)})`);css(c2,'opacity',String(+clamp(p2,0,1).toFixed(3)));
    const pb=R(tD+1.55*H,.3,bo(3)),pbr=R(tD+3*H,.4);
    css(btn,'background',`rgba(255,255,255,${+clamp(seq(.25,[1,pb],[.25,pbr]),0,1).toFixed(3)})`);css(btn,'transform',`scale(${+seq(1,[1.25,pb],[1,pbr]).toFixed(3)})`);
    // 徽章、星星、涂鸦
    const pbg=R(3.7,.7,b2);css(badge,'transform',`scale(${+pbg.toFixed(3)}) rotate(${f(lerp(-90,0,pbg))}deg)`);css(badge,'opacity',String(+clamp(pbg,0,1).toFixed(3)));
    sparks.forEach((s,i)=>css(s,'opacity',String(+(.8*R(3.8+.2*i,.4)).toFixed(3))));css(doodle,'opacity',String(+R(4,.5).toFixed(3)));
    // 光标：C 镜点玻璃卡，D 镜点按钮
    const m1=R(tC+.7*H,1,ez.io3),m2=R(tD+.5*H,1,ez.io3),cs=1-.22*(tri(tC+1.7*H,.2)+tri(tD+1.5*H,.2));
    css(cur,'transform',`translate(${f(seq(560,[800,m1],[1318,m2]))}px,${f(seq(780,[540,m1],[726,m2]))}px) scale(${+cs.toFixed(3)})`);
    css(cur,'opacity',String(+((T>=tC+.6*H?1:0)*(1-R(tD+2.2*H,.3))).toFixed(3)));
    // 小地图与状态
    let k=-1;pl.st.forEach((s,i)=>{if(T>=s.t&&T<pl.tx)k=i});
    if(k!==ci){ci=k;dots.forEach((d,i)=>d.classList.toggle('on',i===k));ctx.status(k>=0?'SHOT '+pl.sh[k].id+' · '+pl.sh[k].name:T<4.4?'INTRO':'EXIT');ctx.focus(k>=0?k:null,k>=0?pl.sh[k].id:'')}
    root.classList.toggle('ne-bf',P.GLASS>0);
    const on=!ctx.auto&&P.MAP>0;if(map.hidden===on)map.hidden=!on;
    if(on){
      // 虚线框 = 镜头此刻真正看到的范围（实时跟着镜头走）；字母圆点 = 每一镜的落点
      css(fr,'left',((c.cx-800/c.z)/14).toFixed(2)+'%');css(fr,'top',((c.cy-600/c.z)/9.6).toFixed(2)+'%');
      css(fr,'width',(1600/c.z/14).toFixed(2)+'%');css(fr,'height',(1200/c.z/9.6).toFixed(2)+'%');
      const key=pl.sh.map(s=>s.x+','+s.y).join('|');
      if(key!==lastMap){lastMap=key;path.setAttribute('points',pl.sh.map(s=>s.x+','+s.y).join(' '));
        dots.forEach((d,i)=>{d.style.left=(pl.sh[i].x/14)+'%';d.style.top=(pl.sh[i].y/9.6)+'%'})}}
  }
  // 拖拽：圆点 = 改这一镜的落点；右下角方块 = 改放大倍数。拖的时候时间停在“刚到位”
  const wp=e=>{const r=map.getBoundingClientRect();return[clamp((e.clientX-r.left)/r.width*1400,0,1400),clamp((e.clientY-r.top)/r.height*960,0,960)]};
  map.addEventListener('pointerdown',e=>{
    const d=e.target.closest('.ne-dot'),g=e.target.closest('.ne-hd'),bd=e.target.closest('.ne-fr'),i=d?+d.dataset.i:ci;
    if((!d&&!g&&!bd)||i<0)return;
    clearTimeout(thaw);frozen=true;drag={i,zoom:!d&&!!g};T=pl.st[i].t+pl.st[i].d+.05;
    map.setPointerCapture(e.pointerId);e.preventDefault();if(still)render()});
  map.addEventListener('pointermove',e=>{
    if(!drag)return;const s=pl.sh[drag.i],[wx,wy]=wp(e);
    if(drag.zoom)setP(s.id+'_Z',+clamp(Math.round(800/Math.max(40,wx-s.x)/.05)*.05,.5,3.2).toFixed(2));
    else{setP(s.id+'_X',Math.round(wx/5)*5);setP(s.id+'_Y',Math.round(wy/5)*5)}
    if(still)render()});
  const up=()=>{if(!drag)return;drag=null;thaw=setTimeout(()=>{frozen=false},800)};
  map.addEventListener('pointerup',up);map.addEventListener('pointercancel',up);
  if(still){T=pl.st[5].t+pl.st[5].d+.6;render();ctx.status('STILL');return()=>ro.disconnect()}
  const stop=ticker(dt=>{if(!frozen)T+=dt;if(T>=pl.len)T-=pl.len;render()});
  return()=>{stop();ro.disconnect();clearTimeout(thaw)};
}});
