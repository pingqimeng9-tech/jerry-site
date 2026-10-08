
let SELF='<!doctype html>\n'+document.documentElement.outerHTML;
let selfReady=!document.currentScript?.src,selfSourceError=null;
const sourceMarkupReady=(()=>{
  const script=document.currentScript;
  if(window.__EMBED||!script?.src)return Promise.resolve();
  const stylesheet=document.querySelector('link[data-index-source]');
  if(!stylesheet)return Promise.reject(new Error('Homepage source stylesheet link is missing.'));
  const templateRequests=window.__JERRY_TEMPLATES.map(template=>fetch(`/assets/templates/${template.id}.js`,{cache:'force-cache'}));
  return Promise.all([fetch(stylesheet.href,{cache:'force-cache'}),fetch(script.src,{cache:'force-cache'}),...templateRequests]).then(async responses=>{
    responses.forEach(response=>{if(!response.ok)throw new Error(`Could not load homepage source: ${response.url} (${response.status}).`)});
    const sources=await Promise.all(responses.map(response=>response.text()));
    const [css,js,...templateSources]=sources;
    const styleTag=/<link\b(?=[^>]*\bhref="[^"]*\/assets\/index\.css")[^>]*>/;
    const scriptTag=/<script\b(?=[^>]*\bsrc="[^"]*\/assets\/index-runtime\.js")[^>]*><\/script>/;
    if(!styleTag.test(SELF)||!scriptTag.test(SELF))throw new Error('Homepage source asset markers are missing.');
    const registrations=templateSources.map(source=>source.replace('window.__JERRY_REGISTER_TEMPLATE(', 'registerTemplate(')).join('\n');
    const runtime=js.replace(/^const TPL=window\.__JERRY_TEMPLATES;$/m,()=>`const TPL=[];\nconst registerTemplate=t=>TPL.push(t);\n${registrations}`);
    if(runtime===js)throw new Error('Homepage template registry marker is missing.');
    SELF=SELF
      .replace(/<script\b(?=[^>]*\bsrc="[^"]*\/assets\/(?:template-registry|templates\/[^"]+)\.js")[^>]*><\/script>/g,'')
      .replace(/<script\b(?=[^>]*\bsrc="[^"]*\/admin\/studio\/bridge\.js")[^>]*><\/script>/g,'')
      .replace(styleTag,()=>`<style>${css}</style>`)
      .replace(scriptTag,()=>`<script>${runtime.replace(/<\/script/gi,'<\\/script')}</script>`);
  });
})();
const selfSourceReady=sourceMarkupReady.then(()=>{
  selfReady=true;
  if(typeof mdl!=='undefined'&&!mdl.hidden)cpRender(true);
}).catch(error=>{
  selfSourceError=error;
  console.error('Could not prepare homepage source for preview exports:',error);
  if(typeof mdl!=='undefined'&&!mdl.hidden)cpRender(true);
});
const EMBED=window.__EMBED||null;
/* ════════════════ 工具 ════════════════ */
const $=(s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(n,m)=>((n%m)+m)%m;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* 时间无关的阻尼：1-e^(-λ·dt)，30fps 和 120fps 手感一致 */
const damp=(c,t,l,dt)=>c+(t-c)*(1-Math.exp(-l*dt));
const E={
  expoOut:t=>t>=1?1:1-Math.pow(2,-10*t),
  p3io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  backIO:(t,s=2.2)=>{const c=s*1.525;return t<.5?(Math.pow(2*t,2)*((c+1)*2*t-c))/2:(Math.pow(2*t-2,2)*((c+1)*(t*2-2)+c)+2)/2},
  /* 等价于 elastic.out(amp, period) */
  elastic:(t,a=2,p=.6)=>{if(t<=0)return 0;if(t>=1)return 1;const s=p/(2*Math.PI)*Math.asin(1/a);return a*Math.pow(2,-10*t)*Math.sin((t-s)*(2*Math.PI)/p)+1}
};
function tween(dur,fn,ease=t=>t,done){let on=true;const s=performance.now();const f=now=>{if(!on)return;const t=Math.min(1,(now-s)/(dur*1000));fn(ease(t),t);if(t<1)requestAnimationFrame(f);else done&&done()};requestAnimationFrame(f);return()=>{on=false}}
function ticker(fn){let on=true,last=performance.now(),raf;const f=now=>{if(!on)return;const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;fn(dt,now/1000);raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);return()=>{on=false;cancelAnimationFrame(raf)}}
function inkRGB(){const c=getComputedStyle(document.documentElement).getPropertyValue('--st-ink').trim().replace('#','');const n=parseInt(c.length===3?c.replace(/./g,'$&$&'):c,16);return[(n>>16)&255,(n>>8)&255,n&255]}
function bgRGB(){const c=getComputedStyle(document.documentElement).getPropertyValue('--st-bg').trim().replace('#','');const n=parseInt(c.length===3?c.replace(/./g,'$&$&'):c,16);return[(n>>16)&255,(n>>8)&255,n&255]}
/* 点击声：音调随速度变化（playbackRate 0.8 → 1.6） */
let _ac,_clickBuf;
function audioReady(){if(EMBED&&EMBED.auto)return;try{_ac=_ac||new(window.AudioContext||window.webkitAudioContext)();if(_ac.state==='suspended')_ac.resume()}catch(e){}}
function clickSound(speed=0,vol=.5){
  if(EMBED&&EMBED.auto||!_ac||_ac.state!=='running')return;
  if(!_clickBuf){const sr=_ac.sampleRate,n=Math.floor(sr*.035),b=_ac.createBuffer(1,n,sr),d=b.getChannelData(0);for(let i=0;i<n;i++){const t=i/sr;d[i]=((Math.random()*2-1)*.5+Math.sin(2*Math.PI*1100*t))*Math.exp(-t*180)}_clickBuf=b}
  const s=_ac.createBufferSource(),g=_ac.createGain();s.buffer=_clickBuf;s.playbackRate.value=.8+Math.min(.8,speed/600*.8);g.gain.value=vol*.35;s.connect(g);g.connect(_ac.destination);s.start();
}
function stopClickAudio(){
  if(!_ac)return;
  const ac=_ac;_ac=null;_clickBuf=null;
  try{ac.close().catch(e=>console.error('Could not close template click audio:',e))}catch(e){console.error('Could not close template click audio:',e)}
}
/* 程序化海报：无需图片文件 */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function drawPoster(c,w,h,i){
  const it=CONTENT[i%CONTENT.length],r=rng(i*977+31),hue=it.hue;
  const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,`hsl(${hue} 38% ${14+r()*8}%)`);g.addColorStop(1,`hsl(${(hue+40)%360} 52% ${48+r()*14}%)`);
  c.fillStyle=g;c.fillRect(0,0,w,h);
  const n=3+Math.floor(r()*3);
  for(let k=0;k<n;k++){const t=Math.floor(r()*4);c.save();c.globalAlpha=.25+r()*.5;c.fillStyle=`hsl(${(hue+r()*80)%360} ${40+r()*40}% ${60+r()*30}%)`;
    if(t===0){c.beginPath();c.arc(r()*w,r()*h,(.12+r()*.3)*w,0,7);c.fill()}
    else if(t===1){c.translate(r()*w,r()*h);c.rotate(r()*3);c.fillRect(-w*.2,-h*.05,w*(.3+r()*.5),h*(.08+r()*.2))}
    else if(t===2){c.lineWidth=w*(.02+r()*.05);c.strokeStyle=c.fillStyle;c.beginPath();c.arc(r()*w,r()*h,(.15+r()*.35)*w,r()*6,r()*6+2+r()*3);c.stroke()}
    else{const ox=w*(.3+r()*.5),oy=h*(.2+r()*.4);for(let y=0;y<h;y+=w*.06)for(let x=0;x<w;x+=w*.06){const d=Math.hypot(x-ox,y-oy)/w;c.globalAlpha=Math.max(0,.7-d);c.beginPath();c.arc(x,y,w*.013*Math.max(.1,1.2-d),0,7);c.fill()}}
    c.restore()}
}
const _pc={};
function posterCanvas(i,w=400,h=500){const k=i+'-'+w+'-'+h;if(!_pc[k]){const cv=document.createElement('canvas');cv.width=w;cv.height=h;drawPoster(cv.getContext('2d'),w,h,i);_pc[k]=cv}return _pc[k]}
const posterURL=(i,w,h)=>posterCanvas(i,w,h).toDataURL('image/jpeg',.82);

/* ════════════════ CONTENT ════════════════ */
const CONTENT=[
{title:'把博客当成一张纸',kind:'ESSAY',date:'OCT 05 2026',sum:'文章先是一张纸，读之前要先撕开。',body:'传统博客把文章当成一条记录。这里文章是一件物体：纸、磁带、档案。物体的形状，决定你怎么打开它。',code:'open(object)\n  → reveal(content)',hue:210},
{title:'说明书式的状态机',kind:'GUIDE',date:'OCT 03 2026',sum:'教程一折一步，折痕就是进度。',body:'把教程拆成状态，每个状态只做一件事。读者每折一次，就离结果近一步，折痕本身就是进度条。',code:'idle → fold → next\ncrease = 50%',hue:30},
{title:'写坏了的草稿',kind:'ESSAY',date:'SEP 30 2026',sum:'揉成团的文章，往往最诚实。',body:'没发出去的草稿也值得被保存。它们不整齐，但留着最初的判断，以及后来被删掉的犹豫。',code:'clip-path: rect → ball\nthrow(arc)',hue:50},
{title:'一个会扩散的 Prompt',kind:'PROMPT',date:'SEP 22 2026',sum:'墨水盖住整页，新内容从墨里长出来。',body:'好的 Prompt 像一滴墨：条件写得越具体，扩散的边界越清楚。这一篇记录了三次改写，如何把输出从泛泛而谈收敛到可用。',code:'角色 + 约束 + 例子\n  → 输出',hue:265},
{title:'潜入下一层的上下文',kind:'PROMPT',date:'SEP 18 2026',sum:'沉下去的不是页面，是上一层语境。',body:'长对话里，上下文会一层层沉底。这篇讲怎样在每一层留下“地平线”，让模型知道哪些是现在，哪些是背景。',code:'summary(prev)\n  + task(now)',hue:175},
{title:'CSS 磁铁',kind:'CSS',date:'SEP 08 2026',sum:'两张页面靠加速度吸合，撞上去震一下。',body:'吸合感来自两件事：撞击前不断加速，撞击后有一次很短的震动。用 cubic-bezier 加 3px 位移就够了。',code:'transition: transform .6s\n  cubic-bezier(.7,0,1,.5)',hue:0},
{title:'重力的四行代码',kind:'CSS',date:'AUG 29 2026',sum:'先歪一下，再掉。预备动作让重力可信。',body:'物体坠落前会先失去平衡。给动画加一帧反向的预备动作，观众就会相信这是重力，而不是位移。',code:'origin: 0 100%;\nrotate(-7deg);\ntranslateY(110vh)',hue:145},
{title:'掀桌布：作品展台',kind:'CASE',date:'AUG 20 2026',sum:'桌布抽走，展品还立在原地，只是晃了晃。',body:'展台切换最怕“换页”的感觉。把旧页当桌布抽走，新作品一直在桌上，只是被带得晃了几下。',code:'skewX(-32deg)\nscaleX(1.5)',hue:320},
{title:'页面叠成纸飞机',kind:'NOTE',date:'AUG 12 2026',sum:'没有“下一页”，只有被扔出去的上一页。',body:'如果网页里没有“下一页”这个概念，翻页就可以变成折纸：把当前页折成飞机，飞向下一篇。',code:'polygon(rect → dart)\nrotate(-38deg)',hue:95}
];
const docHTML=(it,i)=>`<div class="k"><span>${it.kind}</span><span>N°${pad(i+1)} · ${it.date}</span></div><h2>${esc(it.title)}</h2><p>${esc(it.body)}</p><pre>${esc(it.code)}</pre>`;

/* ════════════════ 模板注册表 ════════════════ */
const TPL=window.__JERRY_TEMPLATES;

/* ════════════════ SHELL ════════════════ */
const stage=$('#stage');
let tIdx=-1,cleanup=null,lastW=innerWidth,lastT=0,demoT=[];
const PSTORE={};
const defaults=t=>Object.fromEntries((t.knobs||[]).map(k=>[k.k,k.v]));
const paramsFor=t=>Object.assign(defaults(t),(EMBED&&EMBED.id===t.id&&EMBED.params)||{},PSTORE[t.id]||{});
function clearDemo(){demoT.forEach(id=>{clearTimeout(id);clearInterval(id)});demoT=[]}
function releaseTemplate(){
  clearDemo();
  if(cleanup){try{cleanup()}catch(e){console.error('Template cleanup failed:',e)}cleanup=null}
  stopClickAudio();
}
const ctx0={items:CONTENT,P:{},auto:!!(EMBED&&EMBED.auto),
  status:s=>{},
  hint:s=>{$('#hint').textContent=s},
  demo:(fn,ms)=>{if(!(EMBED&&EMBED.auto))return;demoT.push(setTimeout(fn,900),setInterval(fn,ms))},
  focus:(i,extra)=>{},
  set:(k,v)=>{ctx0.P[k]=v;const t=TPL[tIdx];if(t)PSTORE[t.id]=Object.assign(PSTORE[t.id]||{},{[k]:v});if(EMBED&&parent!==window)parent.postMessage({type:'tpl-set',k,v},'*')}};

function showTemplate(i,animate=true){
  i=mod(i,TPL.length);const t=TPL[i];
  document.body.classList.remove('gal');$('#gal').hidden=true;lastT=i;
  releaseTemplate();
  stage.innerHTML='';
  const host=el('div','tpl');stage.appendChild(host);
  ctx0.hint(t.spell);
  ctx0.P=paramsFor(t);
  let tc=document.getElementById('tplcss');if(!tc){tc=document.createElement('style');tc.id='tplcss';document.head.appendChild(tc)}tc.textContent=t.css||'';
  try{cleanup=t.mount(host,ctx0)||null}catch(e){console.error(e);host.innerHTML='<p style="padding:20px;font:12px var(--mono)">TEMPLATE ERROR: '+esc(e.message)+'</p>'}
  tIdx=i;
  document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cat===t.cat));
  document.querySelectorAll('#chips button').forEach((b,j)=>{const on=j===i;b.classList.toggle('on',on);if(on&&!EMBED)b.scrollIntoView({inline:'center',block:'nearest',behavior:animate?'smooth':'auto'})});
  if(!EMBED){try{history.replaceState(null,'','#'+t.id)}catch(e){}}
  if(animate)host.animate([{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:650,easing:'cubic-bezier(.65,0,.35,1)'});
}

[...new Set(TPL.map(t=>t.cat))].forEach(cat=>{
  const b=el('button','',cat);b.dataset.cat=cat;b.setAttribute('aria-pressed','false');
  b.onclick=()=>{if(document.body.classList.contains('gal')){catF=catF===cat?null:cat;syncNav();applyFilter();return}
    const group=TPL.map((t,i)=>({t,i})).filter(x=>x.t.cat===cat),here=group.findIndex(x=>x.i===tIdx);showTemplate(group[(here+1)%group.length].i)};
  $('#nav').appendChild(b);
});
TPL.forEach((t,i)=>{const b=el('button','',t.name);b.onclick=()=>showTemplate(i);$('#chips').appendChild(b)});
/* 配色：顶部栏目的圆点切换整站颜色 */
const PK=['bg','bg2','fg','mut','line','pill','st-bg','st-ink','mn-a','mn-b','mn-ink','mn-mut','mn-cta','mn-cta-ink','mn-sh'];
const PALS=[
['ink','墨黑','dark','#222222','#1b1b1b','#121212','#ececec','#8b8b8b','#ffffff1f','#ffffff0d','#1e1e1e','#d6d6d5','#343434','#1f1f1f','#f2f2f2','#a5a5a5','#ececec','#151515','#00000080'],
['cream','奶油','light','#e6d3b8','#f6ecdf','#e6d3b8','#1f1812','#7b6a58','#3d2a1a26','#3d2a1a0d','#e9dac3','#2a2018','#fcf6ec','#eadcc8','#1f1812','#85735f','#1c1713','#f6ecdf','#8a6a4333'],
['sage','鼠尾草','light','#cdd8c6','#e6ece1','#cdd8c6','#15201a','#5f7063','#1d332226','#1d33220d','#d6dfd0','#1a2a1f','#f5f8f2','#d9e3d2','#15201a','#667a6a','#18261d','#e6ece1','#4a6b5033'],
['rose','玫瑰','light','#e8c8c6','#f6e4e2','#e8c8c6','#2b1618','#8a6264','#4a1f2326','#4a1f230d','#ecd3d1','#2f1a1c','#fdf0ef','#eccfcd','#2b1618','#8f6b6d','#2f1518','#f6e4e2','#8a4a4d33'],
['night','夜蓝','dark','#1d2f50','#121b2e','#0a101d','#e7edf8','#8494b0','#ffffff1f','#ffffff0d','#16223a','#d2dbee','#24344f','#142038','#e7edf8','#93a3bf','#e7edf8','#0d1526','#00000080']
];
function applyPal(id,save){
  const p=PALS.find(x=>x[0]===id)||PALS[0],r=document.documentElement;
  r.dataset.theme=p[2];
  PK.forEach((k,i)=>r.style.setProperty('--'+k,p[4+i]));
  const stageHex=p[10].slice(1),stageRGB=[0,2,4].map(i=>parseInt(stageHex.slice(i,i+2),16)/255);
  const luminance=stageRGB.reduce((sum,value,i)=>{
    const linear=value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);
    return sum+linear*[.2126,.7152,.0722][i];
  },0);
  r.style.setProperty('--st-ink',(1.05/(luminance+.05))>=((luminance+.05)/.05)?'#fff':'#111');
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=p[4];
  document.querySelectorAll('#msw button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===p[0]));
  if(save){try{localStorage.setItem('jerry-pal',p[0])}catch(e){}}
  if(save&&window.JerryHomeLayout)window.JerryHomeLayout.applyCurrentPalette();
  else if(!EMBED)refreshFrames();
}
if(!EMBED){
  const sw=$('#msw');
  PALS.forEach(p=>{const b=el('button','');b.dataset.p=p[0];b.title=p[1];b.setAttribute('aria-label','配色：'+p[1]);b.style.setProperty('--sw',p[3]);b.onclick=()=>applyPal(p[0],true);sw.appendChild(b)});
  let sv=null;try{sv=localStorage.getItem('jerry-pal')}catch(e){}
  applyPal(PALS.some(p=>p[0]===sv)?sv:'ink',false);
}

/* ════════════════ 画廊 + 弹窗 ════════════════ */
const gal=$('#gal'),mdl=$('#mdl');
let modalScrollY=0;
function lockPageScroll(){
  if(document.body.classList.contains('modal-open'))return;
  modalScrollY=window.scrollY;
  document.body.style.top=`-${modalScrollY}px`;
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
}
function unlockPageScroll(){
  if(!document.body.classList.contains('modal-open'))return;
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
  document.body.style.removeProperty('top');
  window.scrollTo(0,modalScrollY);
}
let catF=null,tagF=null,qF='',mdlIdx=0,curParams={};
const FRAME_W=1000;
const frameDoc=(id,auto,params)=>SELF.replace('<html lang="zh" data-theme="dark">','<html lang="zh" data-theme="'+document.documentElement.dataset.theme+'" class="embed" style="'+document.documentElement.style.cssText.replace(/"/g,'&quot;')+'">').replace('<head>','<head><style>'+(document.getElementById('jerry-home-layout')?.textContent||'')+'</style><script>window.__EMBED='+JSON.stringify({id,auto,params:params||{}})+';<\/script>');
const mkFrame=(id,auto,params)=>{const f=document.createElement('iframe');f.title=id;f.allow='fullscreen';f.allowFullscreen=true;f.addEventListener('load',()=>syncEmbeddedFrame(f));f.srcdoc=frameDoc(id,auto,params);return f};
const manifestOf=t=>({id:t.id,name:t.name,category:t.cat,material:t.mat,spell:t.spell,core:t.core,tags:t.tags,knobs:(t.knobs||[]).map(k=>({key:k.k,default:k.v,min:k.min,max:k.max})),credit:t.credit});
const promptOf=(t,p)=>`请使用「创意网站模板库」里的 ${t.name} 模板（id: ${t.id}，分类 ${t.cat}）。
咒语：${t.spell}
唯一的反常规核心：${t.core}。
当前参数：${JSON.stringify(p)}
内容数据按 {title, kind, date, sum, body, code, hue} 提供；换成我的内容和视觉语言即可。
${t.credit.u?`${t.credit.own?'灵感方向':'原作参考'}：${t.credit.n}（${t.credit.u}），${t.credit.own?'本模板为原创实现。':'本模板是按其公开说明自行实现的复刻。'}`:''}`;
async function copyText(text,btn){
  try{await navigator.clipboard.writeText(text)}catch(e){const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(_){}ta.remove()}
  const o=btn.dataset.o||btn.textContent;btn.dataset.o=o;btn.textContent='已复制 ✓';clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent=o},1400);
}
/* 源码切片 */
function slice(a,b){const i=SELF.indexOf(a);if(i<0)return '';const j=SELF.indexOf(b,i+a.length);return SELF.slice(i,j<0?undefined:j)}
const toolsSrc=()=>pretty(slice('/* ════════════════ 工具','/* ════════════════ CONTENT'));
const contentSrc=()=>pretty(slice('/* ════════════════ CONTENT','/* ════════════════ 模板注册表'));
function blockSrc(t,p){
  const a=SELF.indexOf("registerTemplate({id:'"+t.id+"'");if(a<0)return '';
  const m=SELF.indexOf('/* ════════════════ SHELL',a);let e=SELF.indexOf('\n/* ─── ',a+1);
  if(e<0||(m>=0&&e>m))e=m;let out=pretty(SELF.slice(a,e<0?undefined:e).trim());
  /* bake：模板声明 bake:1 时，把 P.KEY 直接换成当前取值，导出的代码就是调好的那一版 */
  if(t.bake&&p!==undefined){const mp=mergedP(t,p);out=out.replace(/\bP\.([A-Z][A-Z0-9_]*)\b/g,(s,k)=>k in mp?String(mp[k]):s)}
  return out;
}
function cssVars(){const a=SELF.indexOf('<style>')+7;return SELF.slice(a,SELF.indexOf('*{box-sizing',a))}
function cssShared(){const a=SELF.indexOf('/* ───── 共用舞台 ───── */');return SELF.slice(a,SELF.indexOf('/* ───── 画廊',a))}
function cssBase(){
  const a=SELF.indexOf('<style>')+7;
  const root=SELF.slice(a,SELF.indexOf('/* ───── SHELL ───── */'));
  const g=slice('.grain,.dots{position:fixed','.nav::-webkit-scrollbar');
  return root+g+cssShared()+'\n.tpl{position:absolute;inset:0}\nhtml.embed .tpl .stg,.tpl .stg{border-radius:0;border:0}\n';
}
function scopedCSS(t){return prettyCSS(cssVars()+'.tpl-host button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}\n'+cssShared().replace(/\.tpl \.stg[^}]*}\n?/g,'').replace(/html\.embed[^}]*}\n?/g,'')+'\n'+t.css)}
function standalone(t,p){
  return `<!doctype html>
${t.credit.u?`\x3c!-- ${t.name} · ${t.credit.own?'灵感来源':'原作来源'}：${t.credit.n} ${t.credit.u} --\x3e`:''}
<html lang="zh" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.name}</title>
<style>
${prettyCSS(cssBase())}
</style>
</head>
<body>
<div id="app" class="tpl"></div>
<script>
const EMBED = null;
${toolsSrc()}
${contentSrc()}
const TPL = [];
const registerTemplate = (t) => TPL.push(t);
${blockSrc(t,p)}

const t0 = TPL[0];
const st = document.createElement('style');
st.textContent = t0.css;
document.head.appendChild(st);
const P = Object.assign(Object.fromEntries((t0.knobs || []).map(k => [k.k, k.v])), ${JSON.stringify(p||{})});
const ctx = { items: CONTENT, P, auto: false, status() {}, hint() {}, focus() {}, demo() {} };
t0.mount(document.getElementById('app'), ctx);
<\/script>
</body>
</html>`;
}
function tsx(t,p){
  const raw=t.name.replace(/[^A-Za-z0-9]/g,''),comp=/^[A-Za-z]/.test(raw)?raw:'Tpl'+raw;
  return [
    '// @ts-nocheck',
    '// '+t.name+' — '+t.spell,
    (t.credit.u?'// '+(t.credit.own?'灵感方向：':'原作参考：')+t.credit.n+' ('+t.credit.u+')；'+(t.credit.own?'本文件为原创实现。':'本文件是按其公开说明自行实现的复刻。'):'// '+t.name),
    '// 说明：这是对原生实现的 React 封装（useEffect 负责挂载/卸载），不是逐行改写的 React 组件。',
    'import { useEffect, useRef } from "react";','',
    'const BASE_CSS = `'+scopedCSS({css:''})+'`;','',
    'const EMBED = null;',
    toolsSrc(),contentSrc(),
    'const TPL = []; const registerTemplate = (t) => TPL.push(t);',
    blockSrc(t,p),'',
    'export default function '+comp+'({ items = CONTENT, params = '+JSON.stringify(p||{})+', onFocus, onStatus }) {',
    '  const ref = useRef(null);',
    '  useEffect(() => {',
    '    const t0 = TPL[0];',
    '    const style = document.createElement("style");',
    '    style.textContent = BASE_CSS + t0.css; document.head.appendChild(style);',
    '    const P = Object.assign(Object.fromEntries((t0.knobs || []).map((k) => [k.k, k.v])), params);',
    '    const ctx = { items, P, auto: false, status: (s) => onStatus && onStatus(s), hint() {}, focus: (i, x) => onFocus && onFocus(i, x), demo() {} };',
    '    const cleanup = t0.mount(ref.current, ctx);',
    '    return () => { cleanup && cleanup(); style.remove(); if (ref.current) ref.current.innerHTML = ""; };',
    '  }, [items, JSON.stringify(params)]);',
    '  return <div ref={ref} className="tpl-host" style={{ position: "relative", width: "100%", height: 560, color: "var(--st-ink)" }} />;',
    '}'
  ].join('\n');
}

/* ════════════════ 代码面板：真实代码 · 行号 · 高亮 · 复制 ════════════════ */
const JS_KW=new Set('const let var function return if else for while do switch case break continue new this typeof instanceof in of delete void try catch finally throw async await class extends super import export from default null undefined true false'.split(' '));
function skipTpl(s,i){let j=i+1;while(j<s.length){const c=s[j];if(c==='\\'){j+=2;continue}if(c==='`')return j+1;if(c==='$'&&s[j+1]==='{'){j=skipExpr(s,j+2);continue}j++}return j}
function skipExpr(s,j){let d=1;while(j<s.length&&d){const c=s[j];if(c==='`'){j=skipTpl(s,j);continue}if(c==='"'||c==="'"){let k=j+1;while(k<s.length&&s[k]!==c){if(s[k]==='\\')k++;k++}j=k+1;continue}if(c==='{')d++;else if(c==='}')d--;j++}return j}
/* JS 分词：返回 [类名, 文本]。k 关键字 s 字符串 c 注释 n 数字 f 函数名 r 正则 */
function tokJS(s){
  const out=[],n=s.length;let i=0,txt='',prev='';
  const flush=()=>{if(txt){out.push(['',txt]);txt=''}};
  const push=(c,t)=>{flush();out.push([c,t])};
  const RXB='(,=:[!&|?{;+-*%<>~^';
  while(i<n){
    const c=s[i],d=s[i+1];
    if(c==='/'&&d==='/'){let j=s.indexOf('\n',i);if(j<0)j=n;push('c',s.slice(i,j));i=j;continue}
    if(c==='/'&&d==='*'){let j=s.indexOf('*/',i+2);j=j<0?n:j+2;push('c',s.slice(i,j));i=j;continue}
    if(c==="'"||c==='"'){let j=i+1;while(j<n&&s[j]!==c&&s[j]!=='\n'){if(s[j]==='\\')j++;j++}j=Math.min(n,j+1);push('s',s.slice(i,j));i=j;prev='"';continue}
    if(c==='`'){const j=Math.min(n,skipTpl(s,i));push('s',s.slice(i,j));i=j;prev='"';continue}
    if(c==='/'){
      if(prev===''||prev==='K'||(prev.length===1&&RXB.includes(prev))){
        let j=i+1,cls=false,ok=false;
        while(j<n){const x=s[j];if(x==='\n')break;if(x==='\\'){j+=2;continue}if(x==='[')cls=true;else if(x===']')cls=false;else if(x==='/'&&!cls){ok=true;break}j++}
        if(ok){j++;while(/[a-z]/i.test(s[j]||''))j++;push('r',s.slice(i,j));i=j;prev='"';continue}
      }
      txt+=c;i++;prev='/';continue;
    }
    if(/[A-Za-z_$]/.test(c)){
      let j=i+1;while(j<n&&/[\w$]/.test(s[j]))j++;
      const w=s.slice(i,j);let k=j;while(k<n&&s[k]===' ')k++;
      if(JS_KW.has(w)){push('k',w);prev=/^(return|typeof|case|in|of|else|do|delete|void|new|throw|instanceof)$/.test(w)?'K':'a'}
      else if(s[k]==='('){push('f',w);prev='a'}
      else{txt+=w;prev='a'}
      i=j;continue;
    }
    if(/\d/.test(c)&&!/[\w$]/.test(s[i-1]||'')){
      const m=/^(0x[\da-f]+|\d[\d_]*\.?\d*(?:e[+-]?\d+)?)/i.exec(s.slice(i,i+40));
      if(m){push('n',m[0]);i+=m[0].length;prev='a';continue}
    }
    if(c==='.'&&/\d/.test(d||'')&&!/[\w$)\]]/.test(s[i-1]||'')){
      const m=/^\.\d+(?:e[+-]?\d+)?/i.exec(s.slice(i,i+20));
      if(m){push('n',m[0]);i+=m[0].length;prev='a';continue}
    }
    txt+=c;if(!/\s/.test(c))prev=c;i++;
  }
  flush();return out;
}
/* CSS 分词：y 选择器 p 属性 n 数值/颜色 f 函数/伪类 k @规则 */
function tokCSS(s){
  const out=[],n=s.length;let i=0;
  const P=(c,t)=>{if(t)out.push([c,t])};
  const endOf=j=>{let p=0;while(j<n){const c=s[j];
    if(c==='/'&&s[j+1]==='*'){const k=s.indexOf('*/',j+2);if(k<0)return n;j=k+2;continue}
    if(c==='"'||c==="'"){let k=j+1;while(k<n&&s[k]!==c){if(s[k]==='\\')k++;k++}j=k+1;continue}
    if(c==='(')p++;else if(c===')')p--;else if(p<=0&&(c==='{'||c===';'||c==='}'))return j;
    j++}return n};
  const SEL=/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[.#][\w-]+|::?[\w-]+|@[\w-]+|[\s\S]/g;
  const VAL=/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[\da-f]{3,8}\b|-?(?:\d+\.?\d*|\.\d+)(?:[a-z%]+)?|!important|@[\w-]+|--[\w-]+|[a-z-]+(?=\()|[\s\S]/gi;
  const inner=(txt,mode)=>{
    const re=new RegExp(mode==='sel'?SEL:VAL);let m;
    while((m=re.exec(txt))){const t=m[0];let c='';
      if(t[0]==='/'&&t[1]==='*')c='c';
      else if(t[0]==='"'||t[0]==="'")c='s';
      else if(mode==='sel'){if(t[0]==='.'||t[0]==='#')c='y';else if(t[0]===':')c='f';else if(t[0]==='@')c='k'}
      else{
        if(t[0]==='#'&&t.length>1)c='n';
        else if(/\d/.test(t)&&/^-?[\d.]/.test(t))c='n';
        else if(t==='!important'||t[0]==='@')c='k';
        else if(t.startsWith('--'))c='p';
        else if(/^[a-z-]+$/i.test(t)&&t.length>1&&txt[m.index+t.length]==='(')c='f';
      }
      P(c,t)}
  };
  while(i<n){
    const c=s[i];
    if(/\s/.test(c)){let j=i;while(j<n&&/\s/.test(s[j]))j++;P('',s.slice(i,j));i=j;continue}
    if(c==='/'&&s[i+1]==='*'){let k=s.indexOf('*/',i+2);k=k<0?n:k+2;P('c',s.slice(i,k));i=k;continue}
    if(c==='}'||c===';'||c==='{'){P('',c);i++;continue}
    const e=endOf(i),term=s[e]||';',chunk=s.slice(i,e);
    if(term==='{')inner(chunk,'sel');
    else{
      let p=0,ci=-1;
      for(let j=0;j<chunk.length;j++){const x=chunk[j];if(x==='(')p++;else if(x===')')p--;else if(x===':'&&p===0){ci=j;break}}
      if(ci<0)inner(chunk,'val');else{P('p',chunk.slice(0,ci));P('',':');inner(chunk.slice(ci+1),'val')}
    }
    i=Math.max(e,i+1);
  }
  return out;
}
/* HTML / Vue / Svelte 分词：<script> 走 JS，<style> 走 CSS */
function tokHTML(s){
  const out=[],P=(c,t)=>{if(t)out.push([c,t])};
  const re=/(\x3c!--[\s\S]*?--\x3e)|(\x3cscript\b[^>]*>)([\s\S]*?)(\x3c\/script>)|(\x3cstyle\b[^>]*>)([\s\S]*?)(\x3c\/style>)|(\x3c[\/!]?[A-Za-z][^>]*>)/g;
  const tag=t=>{
    if(t.startsWith('\x3c!')){P('k',t);return}
    const mm=/^(\x3c\/?)([\w:-]+)([\s\S]*?)(\/?>)$/.exec(t);
    if(!mm){P('',t);return}
    P('',mm[1]);P('t',mm[2]);
    const ra=/(\s+)|([^\s=\/]+)(=)?("[^"]*"|'[^']*'|\{[^}]*\})?|([\s\S])/g;let a;
    while((a=ra.exec(mm[3]))){
      if(a[1])P('',a[1]);
      else if(a[2]){P('a',a[2]);if(a[3])P('',a[3]);if(a[4])P('s',a[4])}
      else P('',a[5]);
    }
    P('',mm[4]);
  };
  let last=0,m;
  while((m=re.exec(s))){
    P('',s.slice(last,m.index));last=re.lastIndex;
    if(m[1])P('c',m[1]);
    else if(m[2]){tag(m[2]);tokJS(m[3]).forEach(x=>out.push(x));tag(m[4])}
    else if(m[5]){tag(m[5]);tokCSS(m[6]).forEach(x=>out.push(x));tag(m[7])}
    else tag(m[8]);
  }
  P('',s.slice(last));return out;
}
/* 提示词：【标题】高亮，``` 围栏淡化 */
function tokText(s){const out=[],a=s.split('\n');a.forEach((l,i)=>{const e=i<a.length-1?'\n':'';out.push([/^```/.test(l)?'c':/^【/.test(l)?'k':'',l+e])});return out}
function codeHTML(tokens){
  const lines=[[]];
  for(const [c,t] of tokens){t.split('\n').forEach((p,k)=>{if(k)lines.push([]);if(p)lines[lines.length-1].push([c,p])})}
  if(lines.length>1&&!lines[lines.length-1].length)lines.pop();
  return{n:lines.length,html:lines.map(l=>'<div class="cl"><span class="lc">'+l.map(([c,t])=>c?`<span class="t-${c}">${esc(t)}</span>`:esc(t)).join('')+'</span></div>').join('')};
}
/* 格式化：只增删空白，且带校验——去掉所有空白后与原文不一致就原样返回，保证复制出去的代码不会被改坏 */
function pretty(src){
  pretty.calls=(pretty.calls||0)+1;
  try{
    const T=[];
    for(const [c,t] of tokJS(src)){
      const atom=c==='s'||c==='c'||c==='r',last=T[T.length-1];
      if(atom)T.push([c,t,true]);else if(last&&!last[2])last[1]+=t;else T.push(['',t,false]);
    }
    let out='',ind=0,paren=0,pend=false,run=0;const st=[];
    const nl=()=>{out=out.replace(/[ \t]+$/,'');if(!out.endsWith('\n'))out+='\n';out+='  '.repeat(Math.max(0,ind))};
    const bol=()=>out===''||/\n[ ]*$/.test(out);
    for(const [c,t,atom] of T){
      if(atom){
        if(pend){pend=false;nl()}
        if(c==='c'&&t.startsWith('//')&&!bol()&&!/\s$/.test(out))out+=' ';
        out+=t;run=0;continue;
      }
      for(let k=0;k<t.length;k++){
        const ch=t[k];
        if(pend){
          if(/\s/.test(ch))continue;
          pend=false;
          if(/^(else|catch|finally|while\b)/.test(t.slice(k)))out+=' ';
          else if(!/[),;.\]:?]/.test(ch))nl();
        }
        if(ch==='\n'){run++;if(bol()){if(run===2&&ind===0&&!/\n\n$/.test(out))out+='\n';continue}nl();continue}
        if(ch===' '||ch==='\t'){if(!bol())out+=ch;continue}
        run=0;
        if(ch==='('||ch==='['){paren++;out+=ch;continue}
        if(ch===')'||ch===']'){paren=Math.max(0,paren-1);out+=ch;continue}
        if(ch==='{'){
          const tail=out.replace(/\s+$/,'');
          const exp=/registerTemplate\($/.test(tail)&&!st.length;
          const blk=!exp&&(tail===''||/(\)|=>|;|\{|\}|\belse|\bdo|\btry|\bfinally)$/.test(tail));
          if(blk&&!bol()&&!/\s$/.test(out))out+=' ';
          out+='{';st.push({t:blk?'b':exp?'x':'o',p:paren});paren=0;
          if(blk||exp){ind++;nl()}
          continue;
        }
        if(ch==='}'){
          const f=st.pop()||{t:'o',p:0};paren=f.p;
          if(f.t==='b'||f.t==='x'){ind=Math.max(0,ind-1);nl();out+='}';pend=f.t==='b'}else out+='}';
          continue;
        }
        if(ch===';'){out+=';';const f=st[st.length-1];if(paren===0&&(!f||f.t==='b'))nl();continue}
        if(ch===','&&paren===0&&st.length&&st[st.length-1].t==='x'){out+=',';nl();continue}
        out+=ch;
      }
    }
    out=out.replace(/\s+$/,'');
    const norm=x=>x.replace(/\s+/g,'');
    if(norm(out)===norm(src))return out;
    pretty.fail=(pretty.fail||0)+1;return src;
  }catch(e){pretty.fail=(pretty.fail||0)+1;return src}
}
function prettyCSS(src){
  try{
    const n=src.length;let out='',ind=0,i=0,par=0,mode='',chunk=true,colon=false;
    const nl=()=>{out=out.replace(/[ ]+$/,'');if(!out.endsWith('\n'))out+='\n';out+='  '.repeat(Math.max(0,ind))};
    const look=j=>{let p=0;while(j<n){const c=src[j];
      if(c==='/'&&src[j+1]==='*'){const k=src.indexOf('*/',j+2);if(k<0)return';';j=k+2;continue}
      if(c==='"'||c==="'"){let k=j+1;while(k<n&&src[k]!==c){if(src[k]==='\\')k++;k++}j=k+1;continue}
      if(c==='(')p++;else if(c===')')p--;else if(p<=0&&(c==='{'||c===';'||c==='}'))return c;
      j++}return';'};
    while(i<n){
      const c=src[i];
      if(chunk&&par===0){if(/\s/.test(c)){i++;continue}mode=look(i)==='{'?'sel':'decl';colon=false;chunk=false}
      if(c==='/'&&src[i+1]==='*'){let j=src.indexOf('*/',i+2);j=j<0?n:j+2;if(!bol2())nl();out+=src.slice(i,j);nl();i=j;chunk=true;continue}
      if(c==='"'||c==="'"){let j=i+1;while(j<n&&src[j]!==c){if(src[j]==='\\')j++;j++}j++;out+=src.slice(i,j);i=j;continue}
      if(c==='('){par++;out+=c;i++;continue}
      if(c===')'){par--;out+=c;i++;continue}
      if(par>0){out+=c;i++;continue}
      if(/\s/.test(c)){if(!/[ \n]$/.test(out))out+=' ';i++;continue}
      if(c==='{'){out=out.replace(/ +$/,'')+' {';ind++;nl();chunk=true;i++;continue}
      if(c==='}'){ind=Math.max(0,ind-1);out=out.replace(/[ \n]+$/,'');nl();out+='}';nl();if(ind===0)out+='\n';chunk=true;i++;continue}
      if(c===';'){out=out.replace(/ +$/,'')+';';nl();chunk=true;i++;continue}
      if(c===','&&mode==='sel'){out+=',';nl();i++;while(/\s/.test(src[i]||'x'))i++;continue}
      if(c===':'&&mode==='decl'&&!colon){out+=': ';colon=true;i++;while(/\s/.test(src[i]||'x'))i++;continue}
      out+=c;i++;
    }
    function bol2(){return out===''||/\n[ ]*$/.test(out)}
    out=out.replace(/\s+$/,'');
    const norm=x=>x.replace(/\s+/g,'');
    if(norm(out)===norm(src))return out;
    prettyCSS.fail=(prettyCSS.fail||0)+1;return src;
  }catch(e){prettyCSS.fail=(prettyCSS.fail||0)+1;return src}
}

/* ───── 各种格式的生成器 ───── */
const FENCE='`'.repeat(3);
const mergedP=(t,p)=>Object.assign(defaults(t),p||{});
const compName=t=>{const raw=t.name.replace(/[^A-Za-z0-9]/g,'');return /^[A-Za-z]/.test(raw)?raw:'Tpl'+raw};
const knobList=t=>(t.knobs||[]).length?t.knobs.map(k=>`- ${k.label}（${k.k}）：默认 ${k.v}，范围 ${k.min}–${k.max}${k.remount?'，改变后需重新挂载':''}`).join('\n'):'- 无可调参数';
const srcLine=t=>`${t.credit.own?'灵感来源':'原作来源'}：${t.credit.n}${t.credit.u?`（${t.credit.u}）`:''}`;
function jsOf(t,p){
  const b=blockSrc(t,p),mi=b.search(/mount\(h,\s*ctx\)\s*\{/),i=mi;
  let m=i<0?b:b.slice(i);
  const ls=i<0?0:b.lastIndexOf('\n',i)+1,base=i<0?0:i-ls;
  if(base)m=m.split('\n').map((l,k)=>k&&l.startsWith(' '.repeat(base))?l.slice(base):l).join('\n');
  m=m.replace(/\}\s*\}\s*\)\s*;?\s*$/,'}');
  return `// ${t.name} — mount(h, ctx)：把模板挂到容器 h，返回清理函数\n// ${srcLine(t)}\n// 参数 P：${JSON.stringify(mergedP(t,p))}\n// 依赖的工具函数（$ el clamp damp ticker …）在「HTML」标签页里\nfunction ${m}\n`;
}
function vue(t,p){
  const P0=JSON.stringify(p||{});
  return [
    '\x3c!-- '+t.name+' — '+t.spell+' --\x3e',
    '\x3c!-- '+srcLine(t)+'；原生实现的 Vue 3 封装 --\x3e',
    '<template>',
    '  <div ref="host" class="tpl-host" style="position:relative;width:100%;height:560px;color:var(--st-ink)"></div>',
    '</template>','',
    '<script setup>',
    "import { ref, onMounted, onBeforeUnmount } from 'vue';",
    'const props = defineProps({ items: { type: Array, default: null }, params: { type: Object, default: () => ('+P0+') } });',
    "const emit = defineEmits(['focus', 'status']);",
    'const host = ref(null);',
    'const BASE_CSS = `'+scopedCSS({css:''})+'`;','',
    'const EMBED = null;',
    toolsSrc(),contentSrc(),
    'const TPL = [];','const registerTemplate = (t) => TPL.push(t);',
    blockSrc(t,p),'',
    'let cleanup, style;',
    'onMounted(() => {',
    '  const t0 = TPL[0];',
    "  style = document.createElement('style');",
    '  style.textContent = BASE_CSS + t0.css;',
    '  document.head.appendChild(style);',
    '  const P = Object.assign(Object.fromEntries((t0.knobs || []).map((k) => [k.k, k.v])), props.params);',
    "  const ctx = { items: props.items || CONTENT, P, auto: false, status: (s) => emit('status', s), hint() {}, focus: (i, x) => emit('focus', i, x), demo() {} };",
    '  cleanup = t0.mount(host.value, ctx);',
    '});',
    'onBeforeUnmount(() => {',
    '  cleanup && cleanup();',
    '  style && style.remove();',
    "  if (host.value) host.value.innerHTML = '';",
    '});',
    '<\/script>',''
  ].join('\n');
}
function svelte(t,p){
  return [
    '\x3c!-- '+t.name+' — '+t.spell+' --\x3e',
    '\x3c!-- '+srcLine(t)+'；原生实现的 Svelte 封装 --\x3e',
    '<script>',
    "  import { onMount } from 'svelte';",
    '  export let items = null;',
    '  export let params = '+JSON.stringify(p||{})+';',
    '  export let onFocus = null;',
    '  export let onStatus = null;',
    '  let host;','',
    '  const BASE_CSS = `'+scopedCSS({css:''})+'`;','',
    '  const EMBED = null;',
    toolsSrc(),contentSrc(),
    '  const TPL = [];','  const registerTemplate = (t) => TPL.push(t);',
    blockSrc(t,p),'',
    '  onMount(() => {',
    '    const t0 = TPL[0];',
    "    const style = document.createElement('style');",
    '    style.textContent = BASE_CSS + t0.css;',
    '    document.head.appendChild(style);',
    '    const P = Object.assign(Object.fromEntries((t0.knobs || []).map((k) => [k.k, k.v])), params);',
    '    const ctx = { items: items || CONTENT, P, auto: false, status: (s) => onStatus && onStatus(s), hint() {}, focus: (i, x) => onFocus && onFocus(i, x), demo() {} };',
    '    const cleanup = t0.mount(host, ctx);',
    '    return () => { cleanup && cleanup(); style.remove(); host.innerHTML = \'\'; };',
    '  });',
    '<\/script>','',
    '<div bind:this={host} class="tpl-host" style="position:relative;width:100%;height:560px;color:var(--st-ink)"></div>',''
  ].join('\n');
}
function wcode(t,p){
  const tag='tpl-'+t.id,cls='Tpl'+compName(t).replace(/^Tpl/,'');
  return [
    '// <'+tag+'></'+tag+'> — '+t.name,
    '// '+srcLine(t)+'；原生自定义元素，不依赖任何框架（Lit / React / Vue 里都能直接用）',
    '// 用法：<'+tag+" params='{\"KEY\": 1}'></"+tag+'>，事件：status、focus','',
    'const BASE_CSS = `'+scopedCSS({css:''})+'`;','',
    'const EMBED = null;',
    toolsSrc(),contentSrc(),
    'const TPL = [];','const registerTemplate = (t) => TPL.push(t);',
    blockSrc(t,p),'',
    'class '+cls+' extends HTMLElement {',
    '  connectedCallback() {',
    '    const t0 = TPL[0];',
    "    if (!document.getElementById('"+tag+"-css')) {",
    "      const style = document.createElement('style');",
    "      style.id = '"+tag+"-css';",
    '      style.textContent = BASE_CSS + t0.css;',
    '      document.head.appendChild(style);',
    '    }',
    "    this.style.cssText = 'display:block;position:relative;width:100%;height:560px;color:var(--st-ink)';",
    '    const defaults = Object.fromEntries((t0.knobs || []).map((k) => [k.k, k.v]));',
    "    const P = Object.assign(defaults, "+JSON.stringify(p||{})+", JSON.parse(this.getAttribute('params') || '{}'));",
    '    const ctx = {',
    '      items: CONTENT, P, auto: false, hint() {}, demo() {},',
    "      status: (s) => this.dispatchEvent(new CustomEvent('status', { detail: s })),",
    "      focus: (i, x) => this.dispatchEvent(new CustomEvent('focus', { detail: { i, x } })),",
    '    };',
    '    this._off = t0.mount(this, ctx);',
    '  }',
    '  disconnectedCallback() {',
    '    this._off && this._off();',
    "    this.innerHTML = '';",
    '  }',
    '}',
    "customElements.define('"+tag+"', "+cls+');',''
  ].join('\n');
}
function jsonOf(t,p){return JSON.stringify(Object.assign(manifestOf(t),{params:mergedP(t,p),source:{name:t.credit.n,url:t.credit.u,kind:t.credit.own?'inspired':'recreation'}}),null,2)}
function p1(t,p){
  return `你是一位资深前端动效工程师。请从零实现一个交互模板「${t.name}」（${t.cat} · ${t.mat}）。

【一句话效果】
${t.spell}

【反常规核心】
${t.core}

【标签】${t.tags.join('、')}

【交互与手感要点】
${t.notes.map(n=>'- '+n).join('\n')}

【可调参数】
${knobList(t)}
当前取值：${JSON.stringify(mergedP(t,p))}

【技术约束】
- 原生 HTML / CSS / JS，单文件，零依赖；不使用 localStorage
- 动画用 requestAnimationFrame，平滑用时间无关阻尼 1 − e^(−λ·dt)，30fps 与 120fps 手感一致
- 触屏优先：用 pointer events；窄屏（≤ 430px）不溢出，不依赖 hover
- 深浅色用 CSS 变量，不写死颜色；尊重 prefers-reduced-motion；键盘焦点可见
- 暴露 mount(el, { params })，返回 cleanup()，卸载时释放事件、定时器、AudioContext

【验收】
1. 控制台无报错
2. 每个可调参数改变后立即生效（标注“需重新挂载”的除外）
3. cleanup 之后没有残留监听
4. 手机竖屏与横屏都能正常使用
5. 先用 3 句话复述你理解的效果，再给代码

【参考】${srcLine(t)}。请自行实现，不要复制其源码或素材。`;
}
function p2(t,p){
  return `下面是「${t.name}」模板的真实代码（原生 JS，单文件，可直接运行）。请在保持交互逻辑和手感常数不变的前提下，把它改造成我的版本。

【我的内容与风格】（没填的项请先问我）
- 标题 / 文案：
- 品牌色与字体：
- 使用场景与尺寸（Hero / 卡片 / 全屏）：
- 需要接入的数据：

【改造规则】
1. 只改外观、文案与数据结构；物理与动效参数保持默认，除非我明确要求
2. 输出完整的单文件 HTML，保存后双击即可运行
3. 所有改动处加注释“// CHANGED:”，最后列出改了哪些参数
4. 保留 cleanup 逻辑，保留 prefers-reduced-motion 与键盘可达
5. 不引入新依赖

【当前参数】${JSON.stringify(mergedP(t,p))}

【原始代码】
${FENCE}html
${standalone(t,p)}
${FENCE}

${srcLine(t)}。`;
}
function p3(t,p){
  return `【任务】在当前项目里新增交互组件「${t.name}」。

【步骤】
1. 先检查项目用的框架（React / Vue / Svelte / 原生）与样式方案，按现有目录和命名约定放置；组件名建议 ${compName(t)}
2. 以下面的参考实现为准封装成组件：mount 需要的容器用 ref 取得；卸载时必须调用 cleanup
3. 参数做成 props，默认值见下；只在客户端副作用里访问 window / document（兼容 SSR）
4. 增加 prefers-reduced-motion 降级，保证键盘可达
5. 不新增依赖；写完运行 lint / 类型检查 / 构建，并贴出结果
6. 最后给我一个 15 行以内的使用示例

【props 与默认值】
${knobList(t)}

【参考实现 · 样式】
${FENCE}css
${prettyCSS(t.css)}
${FENCE}

【参考实现 · 工具函数】
${FENCE}js
${toolsSrc()}
${FENCE}

【参考实现 · mount】
${FENCE}js
${jsOf(t,p)}
${FENCE}

${srcLine(t)}。`;
}
const FORMATS=[
 {id:'html',g:0,l:'HTML',dot:'#e44d26',lang:'html',ext:t=>t.id+'.html',gen:standalone,note:'完整可运行的单文件：存成 .html，双击就能打开。包含样式、工具函数、内容数据和这个模板，顶部注释标明了来源。'},
 {id:'css',g:0,l:'CSS',dot:'#2965f1',lang:'css',ext:t=>t.id+'.css',gen:t=>scopedCSS(t),note:'这个模板的全部样式，每个属性单独一行。变量与共用舞台样式在前，模板自己的类在后。'},
 {id:'js',g:0,l:'JS',dot:'#f7df1e',lang:'js',ext:t=>t.id+'.js',gen:jsOf,note:'核心代码 mount(h, ctx)：把模板挂到容器上并返回清理函数。工具函数在「HTML」标签页里。'},
 {id:'tsx',g:1,l:'React',dot:'#61dafb',lang:'js',ext:t=>compName(t)+'.tsx',gen:tsx,note:'React 组件，useEffect 负责挂载与卸载。放进 Vite 或 Next（客户端组件）即可用。'},
 {id:'vue',g:1,l:'Vue',dot:'#42b883',lang:'html',ext:t=>compName(t)+'.vue',gen:vue,note:'Vue 3 单文件组件（script setup）。onMounted 挂载，onBeforeUnmount 清理，支持 items / params 属性。'},
 {id:'svelte',g:1,l:'Svelte',dot:'#ff3e00',lang:'html',ext:t=>compName(t)+'.svelte',gen:svelte,note:'Svelte 组件。onMount 返回清理函数，items / params 作为 props。'},
 {id:'wc',g:1,l:'Web Component',dot:'#324fff',lang:'js',ext:t=>'tpl-'+t.id+'.js',gen:wcode,note:'原生自定义元素，不依赖任何框架。Lit、React、Vue 里都能直接写成标签使用。'},
 {id:'json',g:1,l:'JSON',dot:'#9a9a9a',lang:'js',ext:t=>t.id+'.json',gen:jsonOf,note:'模板清单：分类、参数范围、当前取值与来源。可以喂给自己的工具，或直接贴给 Claude。'},
 {id:'p1',g:2,l:'做同款',dot:'#d97757',lang:'text',ext:t=>t.id+'-prompt.md',gen:p1,note:'让 Claude 从零做出同款：只描述效果、手感、参数与验收标准，不含代码。整段复制发给 Claude 即可。'},
 {id:'p2',g:2,l:'改造成我的',dot:'#d97757',lang:'text',ext:t=>t.id+'-remix.md',gen:p2,note:'让 Claude 在这份真实代码上改成你的内容和品牌：含完整可运行文件，并要求改动处标注 CHANGED。'},
 {id:'p3',g:2,l:'Claude Code',dot:'#d97757',lang:'text',ext:t=>t.id+'-claude-code.md',gen:p3,note:'给 Claude Code：在你的项目里按现有框架封装成组件，带样式、工具函数与 mount 参考实现。'}
];
const cp=$('#cp');let cpFmt='html',cpText='',cpTimer=0;
cp.querySelector('.cp-tabs').innerHTML=(()=>{let g=-1,h='';FORMATS.forEach(f=>{if(g>=0&&f.g!==g)h+='<i></i>';g=f.g;h+=`<button data-f="${f.id}" aria-pressed="${f.id===cpFmt}" style="--dot:${f.dot}">${f.l}</button>`});return h})();
function cpRender(keep){
  if(mdl.hidden&&!keep&&false)return;
  const box=$('.cp-code',cp),buttons=cp.querySelectorAll('[data-a=copy],[data-a=save]');
  if(!selfReady){
    buttons.forEach(button=>button.disabled=true);
    $('.cp-file',cp).textContent=selfSourceError?'源码不可用':'正在准备源码…';
    $('.cp-meta',cp).textContent='';
    $('.cp-note',cp).textContent=selfSourceError?'加载源码失败，无法生成代码。请刷新页面后重试。':'正在加载模板源码…';
    box.textContent=selfSourceError?'源码加载失败，代码导出已停用。':'正在准备模板源码…';
    return;
  }
  buttons.forEach(button=>button.disabled=false);
  const t=TPL[mdlIdx],f=FORMATS.find(x=>x.id===cpFmt),p=Object.assign({},curParams);
  let text;try{text=f.gen(t,p)}catch(e){text='// 生成失败：'+e.message;console.error(e)}
  cpText=text;
  const tk=f.lang==='html'?tokHTML(text):f.lang==='css'?tokCSS(text):f.lang==='text'?tokText(text):tokJS(text);
  const r=codeHTML(tk),sc=keep?box.scrollTop:0;
  box.innerHTML=r.html;box.scrollTop=sc;
  $('.cp-file',cp).textContent=f.ext(t);
  $('.cp-meta',cp).textContent=r.n+' 行 · '+(new Blob([text]).size/1024).toFixed(1)+' KB';
  $('.cp-note',cp).textContent=f.note;
}
function scheduleCode(){clearTimeout(cpTimer);cpTimer=setTimeout(()=>{if(!mdl.hidden)cpRender(true)},700)}
cp.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.f){cpFmt=b.dataset.f;cp.querySelectorAll('.cp-tabs button').forEach(x=>x.setAttribute('aria-pressed',x===b));cpRender();return}
  if(b.dataset.a==='copy')copyText(cpText,b);
  if(b.dataset.a==='save'){const f=FORMATS.find(x=>x.id===cpFmt),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([cpText],{type:'text/plain;charset=utf-8'}));a.download=f.ext(TPL[mdlIdx]);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
});
function openPen(t,p){
  const js=['const EMBED = null;',toolsSrc(),contentSrc(),'const TPL = [];','const registerTemplate = (t) => TPL.push(t);',blockSrc(t,p),'',
    'const t0 = TPL[0];',
    'const P = Object.assign(Object.fromEntries((t0.knobs || []).map(k => [k.k, k.v])), '+JSON.stringify(p||{})+');',
    'const ctx = { items: CONTENT, P, auto: false, status() {}, hint() {}, focus() {}, demo() {} };',
    "t0.mount(document.getElementById('app'), ctx);"].join('\n');
  const data={title:t.name+' · 创意网站模板库',description:srcLine(t),html:'<div id="app" class="tpl"></div>',css:prettyCSS(cssBase())+'\n'+prettyCSS(t.css),js,editors:'0011'};
  const f=document.createElement('form');f.method='POST';f.action='https://codepen.io/pen/define';f.target='_blank';
  const i=document.createElement('input');i.type='hidden';i.name='data';i.value=JSON.stringify(data);f.appendChild(i);document.body.appendChild(f);f.submit();f.remove();
}

/* 画廊：一排四个，每张卡是实时演示 */
const ioG=new IntersectionObserver(es=>es.forEach(en=>{const f=en.target;if(en.isIntersecting&&!f._done){f._done=true;f.appendChild(mkFrame(f.dataset.id,true))}else if(!en.isIntersecting&&f._done){f._done=false;f.innerHTML=''}}),{rootMargin:'60px'});
const roG=new ResizeObserver(es=>es.forEach(en=>en.target.style.setProperty('--s',en.contentRect.width/FRAME_W)));
function buildGal(){
  gal.innerHTML=`<div class="gal-inner"><div class="gal-head" data-module="gallery-heading"><h1>Templates</h1><p>${TPL.length} 个模板，每张卡都在实时运行。点开可以玩、调参数，并复制提示词、HTML、TSX。前 12 个复刻自 carterogunsola.com/lab，其余为原创实现（灵感来自 Design Spells、Skillry 等）。</p></div>
  <label class="gal-search" data-module="gallery-search"><input id="gq" placeholder="What do you want to create?  搜名称 / 咒语 / 标签" autocomplete="off"><span>⌕</span></label>
  <div class="gal-filters" data-module="gallery-filters"><div class="gal-tagbar"><button class="gal-tgl" aria-expanded="false" aria-controls="gtw">标签 <i aria-hidden="true">▾</i></button><span class="gal-cur"></span></div><div class="gal-tagwrap" id="gtw"><div class="gal-tags"></div></div></div><div class="gal-grid" data-module="gallery-grid"></div></div>`;
  const grid=$('.gal-grid',gal),tg=$('.gal-tags',gal),tw=$('.gal-tagwrap',gal),tgl=$('.gal-tgl',gal),cur=$('.gal-cur',gal);
  const setOpen=o=>{tw.classList.toggle('open',o);tgl.setAttribute('aria-expanded',o)};
  const paintCur=()=>{cur.classList.toggle('on',!!tagF);cur.innerHTML=tagF?`${esc(tagF)} <b role="button" aria-label="清除标签" title="清除">✕</b>`:'';const x=$('b',cur);if(x)x.onclick=()=>{tagF=null;tg.querySelectorAll('button').forEach(y=>y.setAttribute('aria-pressed',!y.dataset.tag));paintCur();applyFilter()}};
  tgl.onclick=()=>setOpen(!tw.classList.contains('open'));
  [null,...[...new Set(TPL.flatMap(t=>t.tags))].sort()].forEach(tag=>{const b=el('button','',tag||'All');b.dataset.tag=tag||'';b.setAttribute('aria-pressed',tag===tagF);b.onclick=()=>{tagF=tag;tg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',(x.dataset.tag||null)===tagF));paintCur();setOpen(false);applyFilter()};tg.appendChild(b)});
  TPL.forEach((t,i)=>{
    const c=el('article','gc',`<div class="gc-pv"><span class="gc-badge">${t.cat} · ${t.mat}</span><span class="gc-live">● LIVE</span><div class="gc-fr" data-id="${t.id}"></div></div><div class="gc-meta"><h3>${esc(t.name)}</h3><div class="gc-tags">${t.tags.slice(0,2).map(x=>`<i>${esc(x)}</i>`).join('')}</div></div>`);
    c.style.setProperty('--home-stagger',Math.min(i,18)*38+'ms');
    c.tabIndex=0;c._i=i;c.setAttribute('role','button');c.setAttribute('aria-label',t.name);
    c.onclick=()=>openModal(i);c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openModal(i)}};
    grid.appendChild(c);const fr=$('.gc-fr',c);ioG.observe(fr);roG.observe(fr);
  });
  $('#gq').addEventListener('input',e=>{qF=e.target.value;applyFilter()});
}
function applyFilter(){
  const q=qF.trim().toLowerCase();let n=0;
  document.querySelectorAll('.gc').forEach(c=>{const t=TPL[c._i];
    const ok=(!catF||t.cat===catF)&&(!tagF||t.tags.includes(tagF))&&(!q||(t.name+t.spell+t.core+t.tags.join(' ')+t.cat+t.mat).toLowerCase().includes(q));
    c.hidden=!ok;if(ok)n++});
  let em=$('.gal-empty',gal);if(!n&&!em){em=el('p','gal-empty','没有匹配的模板');$('.gal-grid',gal).appendChild(em)}if(n&&em)em.remove();
  syncNav();
}
function syncNav(){document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-pressed',document.body.classList.contains('gal')?b.dataset.cat===catF:b.dataset.cat===(TPL[tIdx]||{}).cat))}
function syncEmbeddedFrame(frame){
  const frameRoot=frame.contentDocument&&frame.contentDocument.documentElement;
  if(!frameRoot)return;
  frameRoot.style.cssText=document.documentElement.style.cssText;
  frameRoot.dataset.theme=document.documentElement.dataset.theme;
}
function refreshFrames(){document.querySelectorAll('.gc-fr iframe').forEach(syncEmbeddedFrame)}
addEventListener('jerry:home-layout-applied',refreshFrames);
function enterGallery(){
  releaseTemplate();stage.innerHTML='';tIdx=-1;
  document.body.classList.add('gal');gal.hidden=false;
  syncNav();
}
addEventListener('pagehide',releaseTemplate,{once:true});

/* 来源标注：弹窗右上角，按链接域名决定图标与名称 */
const SRC={'carterogunsola.com':{n:'Carter Ogunsola',m:'C'},'designspells.com':{n:'Design Spells',m:'DS'},'skillry.dev':{n:'Skillry',m:'S'},'dribbble.com':{n:'Dribbble',m:'D'},'callmiruko.cc':{n:'Jerry · callmiruko.cc',m:'J'},'github.com':{n:'GitHub',m:'G'}};
function srcOf(t){
  let host='';try{host=new URL(t.credit.u).hostname.replace(/^www\./,'')}catch(e){}
  const k=SRC[host]||{n:host||t.credit.n,m:(host||'?')[0].toUpperCase()};
  return{host,name:k.n,mono:k.m,verb:t.credit.own?'灵感来自':'复刻自',url:t.credit.u}
}
function paintSrc(t){
  const a=$('#msrc'),s=srcOf(t);if(!s.url){a.hidden=true;return}
  a.hidden=false;a.href=s.url;a.title=s.verb+' '+s.name+'（'+s.url+'）';a.setAttribute('aria-label','来源：'+s.name+'，在新标签页打开');
  a.innerHTML=`<i aria-hidden="true">${esc(s.mono)}</i><small>${s.verb}</small><span>${esc(s.name)}</span><b aria-hidden="true">↗</b>`;
}
/* 弹窗：预览 + Notes + Tune + 复制 */
function openModal(i){
  const t=TPL[i];mdlIdx=i;curParams=Object.assign({},PSTORE[t.id]||{});
  paintSrc(t);$('.mdl-cat',mdl).textContent=t.cat+' · '+t.mat;$('.mdl-t',mdl).textContent=t.name;$('.mdl-spell',mdl).textContent=t.spell;
  $('.mdl-tags',mdl).innerHTML=t.tags.map(x=>`<i>${esc(x)}</i>`).join('')+`<i>CORE:: ${esc(t.core)}</i>`;
  $('.mdl-notes',mdl).innerHTML=t.notes.map(n=>`<p>${esc(n)}</p>`).join('')+(t.credit.own?(!t.credit.u?'':`<p class="cr">灵感方向：${t.credit.u?`<a href="${t.credit.u}" target="_blank" rel="noopener">${esc(t.credit.n)}</a>`:esc(t.credit.n)}。这是原创实现，只借用了方向与气质，不包含其源码或素材。依赖：无（原生 JS）。</p>`):`<p class="cr">复刻自 Carter Ogunsola 的 <a href="${t.credit.u}" target="_blank" rel="noopener">${esc(t.credit.n)}</a>。我只依据其公开的说明与参数自行实现，不包含其源码或素材。依赖：无（原生 JS）。</p>`);
  const tune=$('.mdl-tune',mdl);tune.innerHTML='';
  const dec=k=>{const q=String(k.step);return q.includes('.')?q.split('.')[1].length:0};
  if(!(t.knobs||[]).length)tune.innerHTML='<p>这个模板没有可调参数。</p>';
  else(t.knobs).forEach(k=>{
    const v=curParams[k.k]!=null?curParams[k.k]:k.v,sw=k.min===0&&k.max===1&&k.step===1,lab=esc(k.label)+(k.remount?' <small>↻</small>':'');
    const w=el('div','kc'+(sw?' kc-sw':''),sw?`<span>${lab}</span><input type="checkbox" aria-label="${esc(k.label)}"><i class="sw"></i>`:`<div class="kc-f"></div><span>${lab}</span><b></b><input type="range" aria-label="${esc(k.label)}" min="${k.min}" max="${k.max}" step="${k.step}">`);
    w.dataset.k=k.k;const inp=$('input',w);
    w._set=x=>{const n=+x;if(sw){inp.checked=!!n;return}inp.value=n;$('b',w).textContent=String(+n.toFixed(dec(k)));w.style.setProperty('--p',((n-k.min)/(k.max-k.min)*100).toFixed(1))};
    w._set(v);
    inp.addEventListener('input',()=>{const nv=sw?(inp.checked?1:0):+inp.value;w._set(nv);curParams[k.k]=nv;PSTORE[t.id]=Object.assign({},curParams);scheduleCode();const f=$('.mdl-pv iframe',mdl);if(f&&f.contentWindow)f.contentWindow.postMessage({type:'tpl-param',k:k.k,v:nv,remount:!!k.remount},'*')});
    tune.appendChild(w)});
  $('#czr').onclick=()=>{curParams={};delete PSTORE[t.id];openModal(i)};
  setView('preview');cpRender();
  const pv=$('.mdl-pv',mdl);pv.querySelectorAll('iframe').forEach(frame=>frame.remove());pv.appendChild(mkFrame(t.id,false,curParams));
  lockPageScroll();
  mdl.hidden=false;
}
function setPreviewExpanded(expanded){
  mdl.classList.toggle('expanded',expanded);
  const button=$('.mdl-zoom',mdl);
  button.setAttribute('aria-label',expanded?'还原预览':'放大预览');
  button.title=expanded?'还原预览':'放大预览';
  $('span',button).textContent=expanded?'⤡':'⤢';
}
$('.mdl-zoom',mdl).addEventListener('click',()=>setPreviewExpanded(!mdl.classList.contains('expanded')));
function setView(v){
  if(v!=='preview')setPreviewExpanded(false);
  mdl.querySelectorAll('.mdl-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));
  mdl.querySelectorAll('.mdl-view').forEach(x=>x.hidden=x.dataset.v!==v)
}
mdl.querySelectorAll('.mdl-seg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v)));
const aiBtn=$('.ai-btn',mdl),aiMenu=$('.ai-menu',mdl);
const setMenu=o=>{aiMenu.hidden=!o;aiBtn.setAttribute('aria-expanded',o)};
aiBtn.addEventListener('click',()=>setMenu(aiMenu.hidden));
mdl.addEventListener('click',e=>{if(!aiMenu.hidden&&!e.target.closest('.ai'))setMenu(false)});
function closeModal(){setMenu(false);setPreviewExpanded(false);mdl.hidden=true;$('.mdl-pv',mdl).querySelectorAll('iframe').forEach(frame=>frame.remove());$('.cp-code',cp).innerHTML='';unlockPageScroll()}
$('#mx').onclick=closeModal;
mdl.addEventListener('click',e=>{if(e.target===mdl)closeModal()});
aiMenu.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const t=TPL[mdlIdx],a=b.dataset.a,lab=$('span',b);
  if(a==='open'){
    setMenu(false);
    setView('preview');
    setPreviewExpanded(true);
    return;
  }
  if(a==='pen'){setMenu(false);openPen(t,Object.assign({},curParams));return}
  const text=a==='link'?location.href.split('#')[0]+'#'+t.id:FORMATS.find(x=>x.id===a).gen(t,Object.assign({},curParams));
  copyText(text,lab);setTimeout(()=>setMenu(false),900);
});
/* 预览页接收参数 */
if(EMBED){addEventListener('message',e=>{const m=e.data;if(!m||m.type!=='tpl-param')return;const t=TPL[tIdx];if(!t)return;PSTORE[t.id]=Object.assign(PSTORE[t.id]||{},{[m.k]:m.v});ctx0.P[m.k]=m.v;if(m.remount){clearTimeout(window._rm);window._rm=setTimeout(()=>showTemplate(tIdx,false),120)}})}

if(!EMBED){addEventListener('message',e=>{const m=e.data,f=$('.mdl-pv iframe',mdl);if(!m||m.type!=='tpl-set'||mdl.hidden||!f||e.source!==f.contentWindow)return;const t=TPL[mdlIdx];curParams[m.k]=m.v;PSTORE[t.id]=Object.assign({},curParams);const w=mdl.querySelector('.kc[data-k="'+m.k+'"]');if(w&&w._set)w._set(m.v);scheduleCode()})}

function shuffleTemplatesByAuthor(){
  const groups=new Map();
  TPL.forEach(t=>{
    let author=t.credit.n;
    try{author=new URL(t.credit.u).hostname.replace(/^www\./,'')}catch(e){}
    if(!groups.has(author))groups.set(author,[]);
    groups.get(author).push(t);
  });
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  groups.forEach(shuffle);
  const ordered=[];let previous='';
  while(ordered.length<TPL.length){
    const candidates=[...groups].filter(([author,items])=>items.length&&author!==previous);
    if(!candidates.length)break;
    const max=candidates.reduce((n,[,items])=>Math.max(n,items.length),0);
    const best=candidates.filter(([,items])=>items.length===max);
    const [author,items]=best[Math.floor(Math.random()*best.length)];
    ordered.push(items.pop());previous=author;
  }
  TPL.splice(0,TPL.length,...ordered,...[...groups.values()].flat());
}

addEventListener('keydown',e=>{
  if(!mdl.hidden){if(e.key==='Escape'){if(mdl.classList.contains('expanded'))setPreviewExpanded(false);else if(!aiMenu.hidden)setMenu(false);else closeModal()}return}
  if(e.target.tagName==='INPUT'||document.body.classList.contains('gal'))return;
  if(e.key==='PageDown')showTemplate(tIdx+1);
  if(e.key==='PageUp')showTemplate(tIdx-1);
});

/* 屏幕宽度变化（旋转屏幕）时重新排布当前模板 */
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(Math.abs(innerWidth-lastW)>40){lastW=innerWidth;if(tIdx>=0&&!document.body.classList.contains('gal'))showTemplate(tIdx,false)}},250)});

if(!EMBED){$('#mhome').onclick=$('#mbrand').onclick=()=>{if(!document.body.classList.contains('gal'))enterGallery();scrollTo(0,0)}}
if(EMBED){
  document.documentElement.classList.add('embed');
  showTemplate(Math.max(0,TPL.findIndex(t=>t.id===EMBED.id)),false);
}else{
  shuffleTemplatesByAuthor();
  buildGal();
  const hv=TPL.findIndex(t=>t.id===location.hash.slice(1));
  hv>=0?showTemplate(hv,false):enterGallery();
}
