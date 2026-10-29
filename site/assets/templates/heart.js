/* ─── 4 Heart ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'heart',name:'Heart',cat:'Canvas',mat:'点云',
spell:'一个隐函数曲面，被解成点云，在画布上自转；拖动可以拨它。',core:'形状来自方程，不是图片',tags:['Canvas','3D','Math','Particles'],
credit:{n:'Heart',u:'https://carterogunsola.com/lab/heart'},
notes:['心形来自 Taubin 的隐函数曲面：(x²+9/4·y²+z²−1)³ − x²z³ − 9/80·y²z³ = 0。','做法：随机取很多 (x,y)，沿 z 轴一步步找函数符号变化的位置，再用二分法逼近，得到落在曲面上的点。','每帧绕竖轴转动，按深度从远到近画点：近处点更大更实，远处更小更淡。','拖动给它一个角速度，松手后慢慢衰减回到匀速自转。'],
knobs:[{k:'SPIN',label:'SPIN 自转 °/s',v:26,min:0,max:120,step:1},{k:'SIZE',label:'SIZE 点大小',v:1.9,min:.8,max:4,step:.1},{k:'BEAT',label:'BEAT 心跳',v:.04,min:0,max:.15,step:.005},{k:'POINTS',label:'点数',v:4500,min:1500,max:9000,step:250,remount:true}],
css:`.hr{cursor:grab}.hr canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.hr-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg hr"><canvas></canvas><div class="hr-cap">F(x,y,z)=0 · 拖动旋转</div></div>`;
  const root=$('.hr',h),cv=$('canvas',h),c=cv.getContext('2d'),dpr=(EMBED&&EMBED.auto?1:Math.min(devicePixelRatio||1,2)),W=root.clientWidth,H=root.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const F=(x,y,z)=>{const a=x*x+2.25*y*y+z*z-1;return a*a*a-x*x*z*z*z-.1125*y*y*z*z*z};
  const pts=[],target=Math.round(P.POINTS);let guard=0;
  while(pts.length<target&&guard++<target*60){
    const x=(Math.random()*2-1)*1.25,y=(Math.random()*2-1)*1.05;let pz=-1.4,pf=F(x,y,pz);
    for(let z=-1.36;z<=1.5;z+=.04){const f=F(x,y,z);if((pf<0)!==(f<0)){let lo=pz,hi=z,flo=pf;for(let k=0;k<14;k++){const m=(lo+hi)/2,fm=F(x,y,m);if((fm<0)===(flo<0)){lo=m;flo=fm}else hi=m}pts.push([x,y,(lo+hi)/2]);if(pts.length>=target)break}pf=f;pz=z}
  }
  let psi=0,vel=0,dragging=false,lx=0,tiltT=.28,tilt=.28,zoom=1,t=0;
  root.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(!dragging)return;vel=(e.clientX-lx)*.6;psi+=(e.clientX-lx)*.01;lx=e.clientX});
  const up=()=>dragging=false;root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*(1-e.deltaY*.001),.5,2)},{passive:false});
  const stop=ticker(dt=>{
    t+=dt;const ink=inkRGB();
    if(!dragging){vel=damp(vel,0,2.2,dt);psi+=(P.SPIN*Math.PI/180+vel)*dt}
    const beat=1+P.BEAT*Math.pow(Math.max(0,Math.sin(t*5.2)),6),S=Math.min(W,H)*.3*zoom*beat,cs=Math.cos(psi),sn=Math.sin(psi),ct=Math.cos(tilt),st=Math.sin(tilt);
    const out=new Array(pts.length);
    for(let i=0;i<pts.length;i++){const p=pts[i];const x=p[0]*cs-p[1]*sn,y=p[0]*sn+p[1]*cs,z=p[2];const z2=z*ct-y*st,y2=z*st+y*ct;out[i]=[x,z2,y2]}
    out.sort((a,b)=>b[2]-a[2]);
    c.clearRect(0,0,W,H);
    for(let i=0;i<out.length;i++){const o=out[i],f=1/(1-o[2]*.16),near=clamp(.5-o[2]*.5,0,1);
      c.fillStyle=`rgba(${ink[0]},${ink[1]},${ink[2]},${.18+.82*near})`;c.beginPath();c.arc(W/2+o[0]*S*f,H*.52-o[1]*S*f,P.SIZE*(.55+.9*near)*f,0,6.2832);c.fill()}
  });
  ctx.status('SPIN');
  return stop;
}});
