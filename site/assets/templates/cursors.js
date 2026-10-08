/* ─── 1 Live Cursors ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'cursors',name:'Live Cursors',cat:'Interaction',mat:'在场',
spell:'打开第二个标签页 → 对方的光标带着名字滑进你的页面。',core:'别人的指针也在这一页',tags:['Interaction','Presence','Realtime'],
credit:{n:'Live Cursors',u:'https://carterogunsola.com/lab/live-cursors'},
notes:['每个访客把自己的指针以 0–1 的比例坐标广播出去，别人收到后在自己的舞台上用同样的比例还原，所以窗口大小不同也对得上。','网络位置是一阵一阵到的，直接画会瞬移。每个人保存“目标”和“已渲染”两个位置，每帧按时间无关的阻尼（1−e^(−λ·dt)）靠近目标。','每 50ms 最多发一次，静止时每 4 秒补发一次，12 秒没有消息就把光标撤掉。','这里用 BroadcastChannel 代替服务器：同一浏览器的两个标签页就能互相看到。另外放了几个“幽灵”，一个人时也能看到效果。'],
knobs:[{k:'LAMBDA',label:'平滑 λ',v:18,min:4,max:40,step:1},{k:'GHOSTS',label:'幽灵数量',v:4,min:0,max:8,step:1,remount:true}],
css:`.lc{cursor:crosshair}
.lc-cap{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;width:80%}
.lc-cap b{display:block;font-size:clamp(28px,6.4vw,92px);letter-spacing:-.045em;font-weight:600;line-height:1}
.lc-cap span{display:block;margin-top:14px;font:11px var(--mono);opacity:.6}
.lc-layer{position:absolute;inset:0;pointer-events:none}
.lc-c{position:absolute;left:0;top:0;will-change:transform}
.lc-c svg{display:block;width:22px;height:22px;fill:var(--c);stroke:var(--st-bg);stroke-width:1.6;stroke-linejoin:round}
.lc-c span{position:absolute;left:16px;top:20px;white-space:nowrap;font:10px var(--mono);padding:2px 6px;border-radius:4px;background:var(--c);color:#fff}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg lc"><div class="lc-cap"><b>Everyone else<br>on the page</b><span>在另一个标签页打开这个文件，你们会互相看见 · <i class="lc-n">1</i> ONLINE</span></div><div class="lc-layer"></div></div>`;
  const root=$('.lc',h),layer=$('.lc-layer',h),cnt=$('.lc-n',h);
  const ADJ=['Quiet','Amber','Swift','Lunar','Tidy','Mossy','Brisk','Hazy','Odd'],ANI=['Heron','Otter','Finch','Lynx','Moth','Koi','Wren','Fox','Newt'];
  const hash=s=>{let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0};
  const me='p'+Math.random().toString(36).slice(2,8),peers=new Map();
  function peer(id,ghost){let p=peers.get(id);if(!p){const hs=hash(id);const node=el('div','lc-c',`<svg viewBox="0 0 24 24"><path d="M3.5 2.5l16 7.7-7 2.1-2.6 7.2z"/></svg><span>${ADJ[hs%9]} ${ANI[(hs>>>4)%9]}${ghost?' ·':''}</span>`);node.style.setProperty('--c',`hsl(${hs%360} 68% 48%)`);layer.appendChild(node);p={id,node,svg:node.firstChild,x:.5,y:.5,tx:.5,ty:.5,flip:1,last:performance.now(),ghost,next:0};peers.set(id,p)}return p}
  for(let k=0;k<Math.round(P.GHOSTS);k++){const g=peer('ghost-'+k+Math.random().toString(36).slice(2,5),true);g.x=g.tx=.2+Math.random()*.6;g.y=g.ty=.2+Math.random()*.6}
  const bc=window.BroadcastChannel?new BroadcastChannel('tpl-live-cursors'):null;
  let lastSend=0,mx=.5,my=.5;
  const send=(leave)=>{if(bc)bc.postMessage(leave?{id:me,leave:1}:{id:me,x:mx,y:my})};
  if(bc)bc.onmessage=e=>{const m=e.data;if(!m||m.id===me)return;if(m.leave){const p=peers.get(m.id);if(p){p.node.remove();peers.delete(m.id)}return}const p=peer(m.id,false);p.tx=clamp(m.x,0,1);p.ty=clamp(m.y,0,1);p.last=performance.now()};
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();mx=clamp((e.clientX-r.left)/r.width,0,1);my=clamp((e.clientY-r.top)/r.height,0,1);const now=performance.now();if(now-lastSend>50){lastSend=now;send()}});
  const keep=setInterval(()=>send(),4000);send();
  const onUnload=()=>send(true);addEventListener('beforeunload',onUnload);
  const stop=ticker((dt)=>{
    const W=root.clientWidth,H=root.clientHeight,now=performance.now(),k=1-Math.exp(-P.LAMBDA*dt);
    peers.forEach((p,id)=>{
      if(p.ghost&&now>p.next){p.tx=clamp(p.tx+(Math.random()-.5)*.5,.04,.96);p.ty=clamp(p.ty+(Math.random()-.5)*.5,.06,.94);p.next=now+500+Math.random()*1700}
      if(!p.ghost&&now-p.last>12000){p.node.remove();peers.delete(id);return}
      const dx=p.tx-p.x;p.x+=dx*k;p.y+=(p.ty-p.y)*k;if(Math.abs(dx)>.0006)p.flip=dx<0?-1:1;
      p.node.style.transform=`translate(${p.x*W}px,${p.y*H}px)`;p.svg.style.transform=`scaleX(${p.flip})`;
    });
    cnt.textContent=peers.size+1;
  });
  ctx.status('PEERS '+(peers.size+1));
  return()=>{stop();clearInterval(keep);removeEventListener('beforeunload',onUnload);send(true);if(bc)bc.close()};
}});
