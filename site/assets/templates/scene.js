/* ─── 5 ThreeJs Scene ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'scene',name:'3D Scene',cat:'3D',mat:'网格',
spell:'一个只保留基本功的 3D 场景：拖动环绕，滚轮推拉。',core:'三角形、光、相机，仅此而已',tags:['3D','Orbit','Software render','Basics'],
credit:{n:'ThreeJs Scene',u:'https://carterogunsola.com/lab/threejs-test'},
notes:['原作是一个精简到基本功的原生 Three.js 场景。这里没有引入任何库，用 2D 画布实现了最小的 3D 管线：顶点变换、透视投影、背面剔除、按深度排序、漫反射光照。','模型是一个细分过的二十面体；地面网格随距离淡出。','拖动环绕相机，滚轮推拉，松手后有阻尼。'],
knobs:[{k:'AUTO',label:'AUTO 自转 °/s',v:18,min:0,max:90,step:1},{k:'FOV',label:'FOV 视野',v:60,min:30,max:100,step:1},{k:'WIRE',label:'线框叠加',v:0,min:0,max:1,step:1},{k:'DETAIL',label:'细分',v:2,min:0,max:3,step:1,remount:true}],
css:`.sc{background:#1b1b1b;color:#d6d6d5;cursor:grab}.sc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sc-cap{position:absolute;left:14px;bottom:12px;font:10px var(--mono);opacity:.55;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg sc"><canvas></canvas><div class="sc-cap">drag · orbit &nbsp; wheel · dolly</div></div>`;
  const root=$('.sc',h),cv=$('canvas',h),c=cv.getContext('2d'),dpr=(EMBED&&EMBED.auto?1:Math.min(devicePixelRatio||1,2)),W=root.clientWidth,H=root.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const norm=v=>{const l=Math.hypot(v[0],v[1],v[2]);return[v[0]/l,v[1]/l,v[2]/l]};
  const tt=(1+Math.sqrt(5))/2;let V=[[-1,tt,0],[1,tt,0],[-1,-tt,0],[1,-tt,0],[0,-1,tt],[0,1,tt],[0,-1,-tt],[0,1,-tt],[tt,0,-1],[tt,0,1],[-tt,0,-1],[-tt,0,1]].map(norm);
  let Fc=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let d=0;d<Math.round(P.DETAIL);d++){const cache={};const mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!==undefined)return cache[k];V.push(norm([(V[a][0]+V[b][0])/2,(V[a][1]+V[b][1])/2,(V[a][2]+V[b][2])/2]));return cache[k]=V.length-1};const nf=[];for(const[a,b,c2]of Fc){const ab=mid(a,b),bc=mid(b,c2),ca=mid(c2,a);nf.push([a,ab,ca],[b,bc,ab],[c2,ca,bc],[ab,bc,ca])}Fc=nf}
  let yaw=.6,pitch=.35,dist=4.6,vyaw=0,vpitch=0,dragging=false,lx=0,ly=0,spin=0;
  root.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(!dragging)return;vyaw=(e.clientX-lx)*.006;vpitch=(e.clientY-ly)*.006;yaw+=vyaw;pitch=clamp(pitch+vpitch,-1.2,1.2);lx=e.clientX;ly=e.clientY});
  const up=()=>dragging=false;root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('wheel',e=>{e.preventDefault();dist=clamp(dist*(1+e.deltaY*.001),2.6,9)},{passive:false});
  const rot=(p,ya,pi)=>{const cy=Math.cos(ya),sy=Math.sin(ya),cp=Math.cos(pi),sp=Math.sin(pi);const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy;return[x,p[1]*cp-z*sp,p[1]*sp+z*cp]};
  const stop=ticker(dt=>{
    if(!dragging){vyaw=damp(vyaw,0,3,dt);yaw+=vyaw;}
    spin+=P.AUTO*Math.PI/180*dt;
    c.clearRect(0,0,W,H);const f=1/Math.tan(P.FOV*Math.PI/360)*Math.min(W,H)*.5;
    const proj=p=>{const q=rot(p,yaw,pitch);const z=q[2]+dist;return[W/2+q[0]/z*f,H*.52-q[1]/z*f,z,q]};
    // ground grid
    c.lineWidth=1;
    for(let i=-6;i<=6;i++){for(const dir of[0,1]){const a=dir?[-6,-1.25,i]:[i,-1.25,-6],b=dir?[6,-1.25,i]:[i,-1.25,6];const pa=proj(a),pb=proj(b);if(pa[2]<.3||pb[2]<.3)continue;const al=Math.max(0,.28-Math.abs(i)*.04);c.strokeStyle=`rgba(214,214,213,${al})`;c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1]);c.stroke()}}
    // mesh
    const tv=V.map(v=>{const m=rot(v,spin,0);return m});
    const L=norm([Math.cos(spin*.3)*.8,.9,.6]);
    const faces=[];
    for(const[a,b,c2]of Fc){const A=tv[a],B=tv[b],C=tv[c2];const n=norm([(A[0]+B[0]+C[0]),(A[1]+B[1]+C[1]),(A[2]+B[2]+C[2])]);
      const pa=proj(A),pb=proj(B),pc=proj(C);
      const nv=rot(n,yaw,pitch),vx=-(0)-0,cull=nv[2]*1+0; // facing camera when normal z < 0 in view space
      if(nv[2]>0.02)continue;
      const lam=clamp(n[0]*L[0]+n[1]*L[1]+n[2]*L[2],0,1);
      faces.push({pa,pb,pc,z:(pa[2]+pb[2]+pc[2])/3,lam})}
    faces.sort((a,b)=>b.z-a.z);
    for(const fc of faces){const g=Math.round(38+lam2(fc.lam)*200);c.fillStyle=`rgb(${g},${g},${Math.min(255,g+6)})`;c.strokeStyle=c.fillStyle;c.lineWidth=.6;c.beginPath();c.moveTo(fc.pa[0],fc.pa[1]);c.lineTo(fc.pb[0],fc.pb[1]);c.lineTo(fc.pc[0],fc.pc[1]);c.closePath();c.fill();c.stroke();
      if(P.WIRE>=.5){c.strokeStyle='rgba(27,27,27,.55)';c.lineWidth=.7;c.stroke()}}
  });
  function lam2(x){return .15+.85*x}
  ctx.status('ORBIT');
  return stop;
}});
