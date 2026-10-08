/* ─── 31 Lanyard ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'lanyard',name:'Lanyard',cat:'Interaction',mat:'织带',
spell:'一张工牌挂在织带上：拖它、甩它、拉长它；轻点一下，翻到背面。',core:'织带是一条 Verlet 绳，工牌是绳末端的一根刚性杆',tags:['Canvas','Physics','Verlet','Drag','Flip'],
credit:{n:'Lanyard',u:'',own:true},
notes:['织带是一条 14 段的 Verlet 绳，顶端钉在屏幕外。每一帧只做三件事：积分（位置减去上一帧位置就是速度）、重力与微风、把每段拉回原长。','工牌不是独立物体，而是绳子末端的一根刚性杆（两个质点，距离固定）。抓住牌子的哪个位置，就按距离把拉力分给上下两个点，所以抓下沿会甩出自然的摆动。','Elasticity 决定每段「超过原长时被拉回多少」，越高越像橡皮筋；Damping 是每秒损失的速度。点一下（不拖）会让牌子弹簧式翻面，正反两面用同一张牌身，只换内容。','全部是原生 Canvas 2D，没有 three.js 和物理引擎依赖。'],
knobs:[{k:'SIZE',label:'Size',v:.6,min:.3,max:1,step:.05,remount:1},{k:'BAND_LEN',label:'Band Length',v:.5,min:.2,max:1,step:.05,remount:1},{k:'BAND_W',label:'Band Width',v:.65,min:.3,max:1,step:.05},
{k:'GRAVITY',label:'Gravity',v:1,min:.2,max:2,step:.1},{k:'DAMPING',label:'Damping',v:.5,min:0,max:1,step:.05},{k:'ELASTIC',label:'Elasticity',v:.5,min:0,max:1,step:.05},
{k:'BREEZE',label:'Breeze',v:.5,min:0,max:2,step:.1},{k:'RADIUS',label:'Corner Radius',v:.25,min:0,max:.5,step:.01},{k:'GLOSS',label:'Gloss',v:.7,min:0,max:1,step:.05},
{k:'CARD_L',label:'Card Light',v:100,min:40,max:100,step:1},{k:'BAND_HUE',label:'Band Hue',v:220,min:0,max:360,step:5},{k:'BAND_TINT',label:'Band Tint',v:0,min:0,max:90,step:5},
{k:'INTERACTIVE',label:'Interactive',v:1,min:0,max:1,step:1},{k:'INTRO',label:'Intro',v:1,min:0,max:1,step:1,remount:1}],
css:`.ly{touch-action:none}.ly canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ly-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg ly"><canvas></canvas><div class="ly-cap">拖动 · 甩 · 点击翻面</div></div>`;
  const root=$('.ly',h),cv=$('canvas',h),c=cv.getContext('2d');
  const dpr=(EMBED&&EMBED.auto?1:Math.min(devicePixelRatio||1,2)),W=root.clientWidth,H=root.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const U=Math.max(.5,Math.min(H,W*1.5)/600);
  const cardH=Math.min(P.SIZE/.6*H*.34,W*.74/.64),cw=cardH*.64,LC=cardH*.94;
  const N=14,bandLen=P.BAND_LEN/.5*H*.2,seg=bandLen/N,ax=W/2,ay=-8;
  const R=[];
  for(let i=0;i<=N;i++){const k=P.INTRO?.12:1;R.push({x:ax+i*.25,y:ay+i*seg*k,px:ax+i*.25,py:ay+i*seg*k})}
  const A=R[N],B={x:A.x+1,y:A.y+LC,px:A.x+1,py:A.y+LC};
  const wA=.45;
  let ang=0,drag=null,ptr={x:0,y:0},fl={t:0,v:0,to:0},autoK=-1;
  const hit=(x,y)=>{const dx=x-A.x,dy=y-A.y,ca=Math.cos(-ang),sa=Math.sin(-ang),lx=dx*ca-dy*sa,ly=dx*sa+dy*ca;return{lx,ly,ok:Math.abs(lx)<cw/2&&ly>-cardH*.06&&ly<LC}};
  const pos=e=>{const r=root.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  root.addEventListener('pointerdown',e=>{
    if(!P.INTERACTIVE)return;const p=pos(e),q=hit(p.x,p.y);if(!q.ok)return;
    drag={gx:q.lx,gy:q.ly,x0:p.x,y0:p.y,t0:performance.now(),moved:false};ptr=p;
    root.setPointerCapture(e.pointerId);root.style.cursor='grabbing';ctx.status('DRAG')});
  root.addEventListener('pointermove',e=>{
    const p=pos(e);ptr=p;
    if(drag){if(Math.hypot(p.x-drag.x0,p.y-drag.y0)>5)drag.moved=true;return}
    root.style.cursor=P.INTERACTIVE&&hit(p.x,p.y).ok?'grab':'default'});
  const up=()=>{if(!drag)return;if(!drag.moved&&performance.now()-drag.t0<400){fl.to=1-fl.to;ctx.status(fl.to?'BACK':'FRONT')}else ctx.status('IDLE');drag=null;root.style.cursor='default'};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  const SUB=3,IT=5;
  const step=(dt,t)=>{
    const ks=Math.max(.05,1-P.ELASTIC*1.5),hs=dt/SUB,keep=Math.exp(-hs*(.25+P.DAMPING*2.2)),g=1500*P.GRAVITY*U;
    for(let s=0;s<SUB;s++){
      const all=R.concat(B);
      for(let i=1;i<all.length;i++){
        const p=all[i],wind=P.BREEZE*U*260*(Math.sin(t*.8+i*.3)*.6+Math.sin(t*2.1+i)*.4);
        const vx=(p.x-p.px)*keep,vy=(p.y-p.py)*keep;p.px=p.x;p.py=p.y;
        p.x+=vx+wind*hs*hs;p.y+=vy+g*hs*hs}
      if(drag){
        const tx=ptr.x-(Math.cos(ang)*drag.gx-Math.sin(ang)*drag.gy+A.x),ty=ptr.y-(Math.sin(ang)*drag.gx+Math.cos(ang)*drag.gy+A.y);
        const tb=clamp(drag.gy/LC,0,1),k=.4;
        A.x+=tx*k*(1-tb);A.y+=ty*k*(1-tb);B.x+=tx*k*tb;B.y+=ty*k*tb}
      for(let it=0;it<IT;it++){
        for(let i=0;i<N;i++){
          const a=R[i],b=R[i+1],wa=i===0?0:1,wb=i+1===N?wA:1,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1e-6,e=d-seg,k=e>0?ks:.5,f=e/d*k/(wa+wb);
          a.x+=dx*f*wa;a.y+=dy*f*wa;b.x-=dx*f*wb;b.y-=dy*f*wb}
        const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||1e-6,f=(d-LC)/d/2;
        A.x+=dx*f;A.y+=dy*f;B.x-=dx*f;B.y-=dy*f;
        R[0].x=ax;R[0].y=ay}
      B.y=Math.min(B.y,H-8);B.x=clamp(B.x,8,W-8)}
    ang=Math.atan2(B.y-A.y,B.x-A.x)-Math.PI/2;
    const acc=(fl.to-fl.t)*150-fl.v*15;fl.v+=acc*dt;fl.t+=fl.v*dt;
  };
  const rr=(x,y,w,hh,r)=>{r=Math.min(r,w/2,hh/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+hh,r);c.arcTo(x+w,y+hh,x,y+hh,r);c.arcTo(x,y+hh,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
  const tracePath=()=>{c.beginPath();c.moveTo(R[0].x,R[0].y);for(let i=1;i<N;i++)c.quadraticCurveTo(R[i].x,R[i].y,(R[i].x+R[i+1].x)/2,(R[i].y+R[i+1].y)/2);c.lineTo(R[N].x,R[N].y)};
  const drawBand=()=>{
    const bw=P.BAND_W/.65*cw*.17;
    const hue=P.BAND_HUE,sat=P.BAND_TINT;
    c.lineJoin='round';c.lineCap='butt';tracePath();
    c.strokeStyle=`hsl(${hue} ${sat}% 20%)`;c.lineWidth=bw+2.5;c.stroke();
    tracePath();c.strokeStyle=`hsl(${hue} ${sat}% 8%)`;c.lineWidth=bw;c.stroke();
    tracePath();c.setLineDash([1.2,4.2]);c.strokeStyle='rgba(255,255,255,.1)';c.lineWidth=Math.max(1,bw-3);c.stroke();c.setLineDash([]);
    const m=Math.floor(N*.3),a=R[m],b=R[m+1],ta=Math.atan2(b.y-a.y,b.x-a.x);
    c.save();c.translate((a.x+b.x)/2,(a.y+b.y)/2);c.rotate(ta+Math.PI/2);c.fillStyle='rgba(255,255,255,.85)';c.font=`${bw*.62}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('✺',0,0);c.restore();
  };
  const drawCard=()=>{
    const phi=fl.t*Math.PI,cs=Math.cos(phi),back=cs<0,sx=Math.max(.02,Math.abs(cs)),r=P.RADIUS*cw*.45,x0=-cw/2,y0=-cardH*.06,hh=cardH,m=cw*.08;
    c.save();c.translate(A.x,A.y);c.rotate(ang);c.scale(sx,1);
    c.shadowColor='rgba(0,0,0,.38)';c.shadowBlur=24*U;c.shadowOffsetY=10*U;
    const L=P.CARD_L;c.fillStyle=`hsl(40 ${L<100?6:0}% ${back?L-5:L}%)`;rr(x0,y0,cw,hh,r);c.fill();
    c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;
    c.save();rr(x0,y0,cw,hh,r);c.clip();
    if(!back){
      const ax0=x0+m,ay0=cardH*.09,aw=cw-m*2,ah=cardH*.56,pc=posterCanvas(0,400,500),k=Math.max(aw/pc.width,ah/pc.height),sw=aw/k,sh=ah/k;
      c.save();rr(ax0,ay0,aw,ah,r*.6);c.clip();c.drawImage(pc,(pc.width-sw)/2,(pc.height-sh)/2,sw,sh,ax0,ay0,aw,ah);c.restore();
      c.fillStyle='#151515';c.textAlign='left';c.textBaseline='alphabetic';c.font=`700 ${cw*.15}px Helvetica,Arial,sans-serif`;c.fillText('Jerry',ax0,ay0+ah+cw*.2);
      c.fillStyle='rgba(21,21,21,.55)';c.font=`${cw*.062}px ui-monospace,Menlo,monospace`;c.fillText('CREATIVE LAB · 2026',ax0,ay0+ah+cw*.31);
      c.fillStyle='#151515';for(let i=0;i<22;i++){const bx=ax0+i*(aw/22);c.fillRect(bx,ay0+ah+cw*.38,(i%3?1.1:2.2)*U,cw*.1)}
    }else{
      c.fillStyle='#151515';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${cw*.34}px Helvetica,Arial,sans-serif`;c.fillText('J',0,cardH*.3);
      c.fillStyle='rgba(21,21,21,.6)';c.font=`${cw*.062}px ui-monospace,Menlo,monospace`;
      ['JERRY-SITE','模板库 / TEMPLATES','ID 0001 · VALID'].forEach((s,i)=>c.fillText(s,0,cardH*.52+i*cw*.12));
      c.fillStyle='#151515';for(let i=0;i<26;i++)c.fillRect(x0+m+i*((cw-m*2)/26),cardH*.78,(i%3?1.1:2.4)*U,cw*.18);
    }
    if(P.GLOSS>0){
      const gx=Math.sin(ang*2.2+fl.t*3)*cw*.9,gr=c.createLinearGradient(gx-cw*.55,0,gx+cw*.55,cardH*.6);
      gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,`rgba(255,255,255,${(P.GLOSS*.42).toFixed(3)})`);gr.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=gr;c.fillRect(x0,y0,cw,hh)}
    c.restore();
    c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1;rr(x0,y0,cw,hh,r);c.stroke();
    c.fillStyle='#0e0e0e';rr(-cw*.14,-cardH*.012,cw*.28,cw*.045,cw*.022);c.fill();
    c.restore();
  };
  const drawClip=()=>{
    const bw=P.BAND_W/.65*cw*.17;
    const p=R[N-1],ca=Math.atan2(A.y-p.y,A.x-p.x)-Math.PI/2;
    c.save();c.translate(A.x,A.y);c.rotate(ca);
    c.strokeStyle='#b9bcc2';c.lineWidth=Math.max(1.5,bw*.1);c.beginPath();c.ellipse(0,bw*.1,bw*.24,bw*.42,0,0,Math.PI*2);c.stroke();
    const g=c.createLinearGradient(-bw*.55,0,bw*.55,0);g.addColorStop(0,'#cfd2d8');g.addColorStop(.45,'#7e828a');g.addColorStop(.7,'#eceef2');g.addColorStop(1,'#8d9199');
    c.fillStyle=g;rr(-bw*.56,-bw*1.05,bw*1.12,bw*.9,bw*.14);c.fill();
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.stroke();c.restore();
  };
  const stop=ticker((dt,t)=>{
    if(ctx.auto){const k=Math.floor(t/3.4);if(k!==autoK){autoK=k;B.px-=(k%2?-1:1)*2.4*U;if(k%2)fl.to=1-fl.to}}
    step(dt,t);
    c.clearRect(0,0,W,H);drawBand();drawCard();drawClip();
  });
  ctx.status('IDLE');
  return stop;
}});
