import{i as e}from"./preload-helper-vzYcMpc-.js";import{ut as t}from"./lucide-icons-Dib-b9GO.js";import{$n as n,Bn as r,Gn as i,Hn as a,Jn as o,Ki as s,Kn as c,Qn as l,Rn as u,Un as d,Vn as f,Wn as p,Xn as m,Yn as h,Zn as g,ar as _,bn as v,cr as y,er as b,ii as x,ir as S,nr as ee,or as C,qn as te,rr as w,sr as T,tr as ne,yi as E,zn as D}from"./noLyricLines-Qx3AhOD-.js";import{t as re}from"./proxy-UBAZZ9Hd.js";import{F as O,G as k,L as ie,M as A,N as ae,_ as j,g as oe,j as M,k as N,pt as P}from"./playerOverlayLayout-BA3qLHxe.js";import{t as F}from"./AnimatePresence-D2U3Vg-H.js";import{t as I}from"./useTranslation-CEuzr1Hl.js";import{i as se,o as ce}from"./motionSignals-Cyvjj_1J.js";import{c as L,o as le}from"./alternateText-BFCOvxNk.js";import{i as R,n as z,r as ue}from"./wordColoring-BBDjeB1Z.js";import{l as de}from"./workerClient-DKnh1jfT.js";import{o as fe}from"./runtime-B967Hu6m.js";import{t as pe}from"./VisualizerShell-FEzLRYba.js";import{t as me}from"./VisualizerSubtitleOverlay-B1sGPAzI.js";import{t as he}from"./subtitleFontSizes-BVg3v6tT.js";import{C as B,a as V,f as ge,g as H,h as U,i as W,l as G,p as K,r as q,s as J,w as Y,x as _e,y as ve}from"./three-087zZp0e.js";import{n as ye,r as be,t as xe}from"./react-three-fiber.esm-BkXwM3dV.js";var X=e(t(),1),Se=()=>({segments:[],nextGlobalStart:0}),Ce=e=>e.segments[e.segments.length-1]??null,we=(e,t)=>{let n=o(t.lines.length,t.seed),r=y(n,t.placementOrigin),i=Math.max(t.lines.length,1),a={key:`${String(t.seed)}#${t.round}`,seed:t.seed,round:t.round,lines:t.lines,frames:r,globalStart:e.nextGlobalStart,span:i,placementOrigin:t.placementOrigin,linesEpoch:0};return e.segments.push(a),e.nextGlobalStart+=i,a},Te=(e,t)=>{let n=e.segments[e.segments.length-1];if(!n)return;let r=o(t.length,n.seed),i=Math.max(t.length,1);e.nextGlobalStart+=i-n.span,n.lines=t,n.frames=y(r,n.placementOrigin),n.span=i,n.linesEpoch+=1},Ee=e=>e.nextGlobalStart,De=(e,t)=>{for(let r of e.segments){let e=t-r.globalStart;if(e>=0&&e<r.span)return{segment:r,localIndex:e,frame:n(r.frames,e),line:r.lines[e]??null}}return null},Z=(e,t)=>{e.segments.length<=1||(e.segments=e.segments.filter(e=>e.globalStart+e.span-1>=t))},Oe=3.2,ke=.14,Q=.14,Ae=(e,t)=>{let n={x:t.z-e.z,y:0,z:-(t.x-e.x)},r=Math.hypot(n.x,n.y,n.z);return r<.001?{x:1,y:0,z:0}:{x:n.x/r,y:n.y/r,z:n.z/r}},je=(e,t)=>C(b(e)+t*17)<.5?-1:1,Me=e=>Math.hypot(e.x,e.y,e.z),Ne=(e,t)=>{let n=Me(e)||1;return{x:e.x/n*t,y:e.y/n*t,z:e.z/n*t}},Pe=(e,t)=>{let n=b(e)+t*131,r=C(n+1)*Math.PI*2,i=(C(n+2)-.35)*1.3,a=Math.cos(i);return Ne({x:Math.sin(r)*a,y:Math.sin(i),z:-Math.abs(Math.cos(r)*a)-.35},46)},Fe=e=>{let t=Math.min(1,Math.max(0,e));return t*t*t*(t*(t*6-15)+10)},Ie=new Y(0,1,0),Le=e=>Math.min(1,Math.max(0,e)),Re={hold:.9,pushIn:.85,track:.85,swell:.8,float:.78,glide:.72,crane:.7,pullBack:.7,arc:.62,pendulum:.6,orbit:.55,spiral:.5,flyby:.5},ze=.6,Be=1,Ve=.7,He=e=>{let t=Le(e);return t*t*(3-2*t)},Ue=new Y,We=new Y,Ge=new Y,Ke=new K,qe=new H,Je=new H,Ye=new H,Xe=new Y(0,1,0),Ze=new Y(0,0,1),Qe=new Y,$e=new Y,et=new H,tt=new Y,nt=1.1,rt=.16,it=(e,t,n)=>{if(t.length===0)return 0;if(n>=v(e))return 1;if(n<=e.startTime)return 0;let r=0;for(let e=0;e<t.length;e+=1){let i=t[e];if(n>=i.endTime)r=e+1;else if(n>=i.startTime){let t=Math.max(i.endTime-i.startTime,.001);r=e+Le((n-i.startTime)/t);break}else break}return r/t.length},at=({currentTime:e,sequencer:t,globalIndex:r,activeLineWidthRef:i,motion:a,transitionEpoch:o})=>{let s=(0,X.useRef)({flying:!1,epoch:0,start:0,perp:new Y,side:1,flightLen:1}),u=(0,X.useRef)(new Y(0,.6,9)),f=(0,X.useRef)(new Y(0,0,0)),h=(0,X.useRef)(new Y(0,0,-10)),y=(0,X.useRef)(new Y(0,0,0)),b=(0,X.useRef)(0),x=(0,X.useRef)(new H),ee=(0,X.useRef)(!1),C=(0,X.useRef)(new H),te=(0,X.useRef)(!1),E=(0,X.useMemo)(()=>De(t,r),[t,r]),D=E?.line??null,re=(0,X.useMemo)(()=>D?le(D):[],[D]),O=(0,X.useMemo)(()=>E?g(E.localIndex,E.segment.lines,E.segment.seed,a.subMode):`hold`,[E,a.subMode]),k=(0,X.useMemo)(()=>l(E?.localIndex??0,E?.segment.seed,a.weaveScale),[E,a.weaveScale]);return ye((t,r)=>{if(!E)return;let l=e.get(),g=D?it(D,re,l):0,ie=+!!D;if(D){let e=v(D)-D.startTime;ie=e>0?Le((l-D.startTime)/e):+(l>=D.startTime)}let A=t.camera,ae=A.isPerspectiveCamera?A.aspect:1,j=A.isPerspectiveCamera?A.fov:55,oe=m(p,j,ae)*c,M=E?E.frame:n([],0),N=M.right,P=M.up,F=M.forward,I=D?w(l-v(D)):1,se=S(g,i.current,oe)*I,ce=k.offsetR+se,L=k.offsetU,le=M.position.x+N.x*ce+P.x*L,R=M.position.y+N.y*ce+P.y*L,z=M.position.z+N.z*ce+P.z*L,ue=E?.segment.seed,de=_(O,{progress:ie,wordProgress:g,hero:p,lift:d,seed:ue,lineIndex:E?.localIndex??0,moveScale:a.moveScale*I}),fe=ne(l,ue,a.driftScale),pe=de.right+fe.swayX,me=de.up+fe.swayY+fe.lift,he=de.back+fe.dist,B=le+N.x*pe+P.x*me-F.x*he,V=R+N.y*pe+P.y*me-F.y*he,H=z+N.z*pe+P.z*me-F.z*he,U=s.current;if(o!==U.epoch&&o>0){U.epoch=o,U.flying=!0,U.start=t.clock.elapsedTime,tt.set(B,V,H);let e=Ae(u.current,tt);U.perp.set(e.x,e.y,e.z),U.side=je(ue,o),U.flightLen=u.current.distanceTo(tt)}let W=!1,G=1;U.flying&&(G=(t.clock.elapsedTime-U.start)/Oe,G>=1?U.flying=!1:W=!0);let K=W?nt+(a.smoothTime-nt)*Fe(G):a.smoothTime,q=W?Math.sin(Math.PI*G)**2:0,J=q*U.flightLen*rt,Y=q*U.flightLen*Q*U.side,_e=q*ke*U.side,ve=Math.hypot(B-u.current.x,V-u.current.y,H-u.current.z),ye=!W&&ve>24;if(ye)u.current.set(B,V,H),f.current.set(0,0,0);else{let e=T(u.current.x,B,f.current.x,K,r),t=T(u.current.y,V,f.current.y,K,r),n=T(u.current.z,H,f.current.z,K,r);u.current.set(e.value,t.value,n.value),f.current.set(e.velocity,t.velocity,n.velocity)}A.position.set(u.current.x+U.perp.x*J,u.current.y+U.perp.y*J+J*.5,u.current.z+U.perp.z*J);let be=k.lookR*I,xe=le+N.x*be+U.perp.x*Y,X=R+N.y*be+U.perp.y*Y,Se=z+N.z*be+U.perp.z*Y,Ce=Math.hypot(xe-h.current.x,X-h.current.y,Se-h.current.z);if(!W&&Ce>24)h.current.set(xe,X,Se),y.current.set(0,0,0);else{let e=T(h.current.x,xe,y.current.x,K,r),t=T(h.current.y,X,y.current.y,K,r),n=T(h.current.z,Se,y.current.z,K,r);h.current.set(e.value,t.value,n.value),y.current.set(e.velocity,t.velocity,n.velocity)}A.up.copy(Ie),A.lookAt(h.current),Ue.set(N.x,N.y,N.z),We.set(P.x,P.y,P.z),Ge.set(-F.x,-F.y,-F.z),Ke.makeBasis(Ue,We,Ge),qe.setFromRotationMatrix(Ke),k.yaw!==0&&qe.multiply(Je.setFromAxisAngle(Xe,k.yaw)),k.roll!==0&&qe.multiply(Je.setFromAxisAngle(Ze,k.roll)),ye||!ee.current?(x.current.copy(qe),ee.current=!0):x.current.slerp(qe,1-Math.exp(-2.6*r));let we=0;if(D){let e=v(D),t=He((l-(D.startTime-ze))/.95),n=1-He((l-e)/Be);we=Math.min(t,n)*(Re[O]??.7)}b.current+=(we-b.current)*(1-Math.exp(-1.2*r)),Ye.copy(A.quaternion),et.copy(Ye).slerp(x.current,b.current),Qe.subVectors(h.current,A.position).normalize(),$e.set(0,0,-1).applyQuaternion(et);let Te=$e.angleTo(Qe),Ee=ge.degToRad(j)/2,De=Math.atan(Math.tan(Ee)*ae),Z=Math.min(Ee,De)*Ve;Te>Z&&et.slerp(Ye,1-Z/Te),ye||!te.current?(C.current.copy(et),te.current=!0):C.current.slerp(et,1-Math.exp(-4.2*r)),A.quaternion.copy(C.current),_e!==0&&A.rotateZ(_e)}),null},ot=7.4,st=(e,t,n,r)=>{let i={...e.position};return{start:i,end:t==null?{x:i.x+e.forward.x*8,y:i.y+e.forward.y*8,z:i.z+e.forward.z*8}:{...t.position},startRight:e.right,endRight:t?t.right:e.right,startUp:e.up,endUp:t?t.up:e.up,pathStart:n,enabled:r}},ct=(e,t,r,i)=>{let a=De(e,t);if(!a)return[];let{segment:o}=a,s=o.globalStart,c=o.globalStart+o.span-1,l=e=>{let t=Math.min(Math.max(e,s),c);return D(n(o.frames,t-s),e-t)},u=[];for(let e=t-r;e<=t+i;e+=1)u.push(st(l(e),l(e+1),e,!0));return u},lt=new Map,ut=Math.PI*2,dt=.55,ft=.58,pt=.75,mt=.68,ht=.12,gt=[[0,.86,0],[-.81,-.5,.47],[.81,-.5,.47],[0,-.5,-.94]],_t=[[0,1,2],[0,2,3],[0,3,1],[1,3,2]],vt=[0,-.16,0],yt=(e,t,n)=>{e.positions.push(t[0],t[1],t[2]),e.normals.push(n[0],n[1],n[2])},bt=(e,t,n)=>{let r=Math.hypot(e,t,n)||1;return[e/r,t/r,n/r]},xt=(e,t=[0,0,0])=>bt(e[0]-t[0],e[1]-t[1],e[2]-t[2]),St=(e,t)=>2*(e*t+t*e+e*e)-4*(e+t+e)+8,Ct=(e,t)=>{let n=[2,2];for(let r=2;r<=96;r+=1){let i=Math.max(2,Math.round(1+(r-1)*t));if(St(r,i)>e)break;n=[r,i]}return n},wt=(e,t,n)=>{let[r,i]=Ct(e,t),a=(e,t)=>(e/(t-1)-.5)*2*dt;n.spacing=2*dt/Math.max(1,Math.min(r,i)-1);for(let e=0;e<i;e+=1)for(let t=0;t<r;t+=1)for(let o=0;o<r;o+=1){if(o>0&&o<r-1&&e>0&&e<i-1&&t>0&&t<r-1)continue;let s=[a(o,r),a(e,i),a(t,r)];yt(n,s,xt(s))}},Tt=(e,t,n)=>{let r=ut*ft/(2*pt*Math.max(.2,t)),i=Math.max(2,Math.round(Math.sqrt(e/Math.max(.1,r)))),a=Math.max(3,Math.floor(e/i));n.spacing=Math.max(2*pt/(i-1),ut*ft/a);for(let e=0;e<i;e+=1){let t=(e/(i-1)-.5)*2*pt;for(let e=0;e<a;e+=1){let r=e/a*ut,i=Math.cos(r),o=Math.sin(r);yt(n,[i*ft,t,o*ft],[i,0,o])}}},Et=(e,t)=>{let n=1;for(;_t.length*((n+2)*(n+3)/2)<=e;)n+=1;t.spacing=Math.hypot(gt[0][0]-gt[1][0],gt[0][1]-gt[1][1],gt[0][2]-gt[1][2])/n;for(let[e,r,i]of _t){let a=gt[e],o=gt[r],s=gt[i];for(let e=0;e<=n;e+=1)for(let r=0;r<=n-e;r+=1){let i=e/n,c=r/n,l=1-i-c,u=[0,1,2].map(e=>a[e]*i+o[e]*c+s[e]*l);yt(t,u,xt(u,vt))}}},Dt=(e,t)=>{let n=Math.max(4,Math.round(Math.sqrt(e/4))),r=Math.max(6,Math.floor(e/n));t.spacing=Math.max(ut*.8/r,ut*ht/n);for(let e=0;e<r;e+=1){let i=e/r*ut,a=Math.cos(i),o=Math.sin(i);for(let e=0;e<n;e+=1){let r=e/n*ut,i=Math.cos(r),s=Math.sin(r),c=mt+ht*i;yt(t,[c*a,ht*s,c*o],[i*a,s,i*o])}}},Ot=(e,t,n=1)=>{let r=Math.round(Math.max(.2,n)*4)/4,i=`${e}:${t}:${r}`,a=lt.get(i);if(a)return a;let o={positions:[],normals:[],spacing:0};e===`box`?wt(t,r,o):e===`sphere`?Tt(t,r,o):e===`cone`?Et(t,o):Dt(t,o);let s=Float32Array.from(o.positions),c=Float32Array.from(o.normals),l=s.length/3,u=0;for(let e=0;e<l;e+=1)u+=Math.hypot(s[e*3],s[e*3+1],s[e*3+2]);let d=l>0?u/l:1,f={positions:s,normals:c,radius:d,count:l,spacing:o.spacing/d};return lt.set(i,f),f},kt=1024,At=2048,jt={box:0,sphere:1,cone:2,torus:3},Mt=e=>Math.max(96,Math.floor(Math.min(E,Math.max(96,e))/24)*24),Nt=e=>Math.PI*2/Math.max(1e-4,e*4),Pt=(e,t,n)=>({positions:new Float32Array(e*3),normals:new Float32Array(e*3),anchors:new Float32Array(e*3),scales:new Float32Array(e*3),phases:new Float32Array(e),styles:new Float32Array(e*3),waves:new Float32Array(e*2),pointCount:e,pointsPerUnit:t,spacing:n}),Ft=(e,t,n,r,i)=>{let a=t*3;e.styles[a]=n,e.styles[a+1]=r,e.styles[a+2]=i},It=(e,t)=>{let n=Mt(Math.min(t,kt)),r=e.map(e=>Ot(e.kind,n,e.stretchY)),i=Pt(r.reduce((e,t)=>e+t.count,0),n,r.reduce((e,t)=>Math.max(e,t.spacing),0)),a=0;return e.forEach((e,t)=>{let n=r[t],o=b(`${e.particleSeed}|${e.kind}`),s=C(o+31)*Math.PI*2,c=jt[e.kind],l=+(e.layer===`far`);for(let t=0;t<n.count;t+=1,a+=1){let r=a*3,o=a*3,u=n.positions[t*3],d=n.positions[t*3+1],f=n.positions[t*3+2];i.positions[r]=u,i.positions[r+1]=d,i.positions[r+2]=f,i.normals[r]=n.normals[t*3],i.normals[r+1]=n.normals[t*3+1],i.normals[r+2]=n.normals[t*3+2],i.anchors[r]=e.position.x,i.anchors[r+1]=e.position.y,i.anchors[r+2]=e.position.z,i.scales[o]=e.scale,i.scales[o+1]=e.stretchY,i.scales[o+2]=n.radius,i.phases[a]=s,i.waves[a*2]=s+(u+f*.6)*2.2,i.waves[a*2+1]=s*.7+d*2.6,Ft(i,a,c,e.colorSlot,l)}}),i},Lt=(e,t,n)=>{let r=Math.hypot(e,t,n)||1;return{x:e/r,y:t/r,z:n/r}},Rt=e=>Math.max(12,Math.min(256,Math.round(Math.sqrt(e*2.4)))),zt=(e,t,n=ot)=>{let r=e.filter(e=>e.enabled),i=r.length,a=Mt(Math.min(t,At)),o=Rt(a),s=Math.max(1,Math.floor(a/o)),c=o*s,l=i*c,u=8/n,d=Pt(l,c,Math.max(u/Math.max(1,s),Math.PI*2/o)),f=0;return r.forEach(e=>{for(let t=0;t<s;t+=1){let r=s>1?t/(s-1):.5,i=e.start.x+(e.end.x-e.start.x)*r,a=e.start.y+(e.end.y-e.start.y)*r,c=e.start.z+(e.end.z-e.start.z)*r,l=Lt(e.startRight.x+(e.endRight.x-e.startRight.x)*r,e.startRight.y+(e.endRight.y-e.startRight.y)*r,e.startRight.z+(e.endRight.z-e.startRight.z)*r),p=Lt(e.startUp.x+(e.endUp.x-e.startUp.x)*r,e.startUp.y+(e.endUp.y-e.startUp.y)*r,e.startUp.z+(e.endUp.z-e.startUp.z)*r),m=e.pathStart+r;for(let r=0;r<o;r+=1){let s=r/o*Math.PI*2,h=Math.cos(s),g=Math.sin(s),_=Lt(l.x*h+p.x*g,l.y*h+p.y*g,l.z*h+p.z*g),v=f*3,y=f*3;d.positions[v]=_.x*n,d.positions[v+1]=_.y*n,d.positions[v+2]=_.z*n,d.normals[v]=_.x,d.normals[v+1]=_.y,d.normals[v+2]=_.z,d.anchors[v]=i,d.anchors[v+1]=a,d.anchors[v+2]=c,d.scales[y]=1,d.scales[y+1]=1,d.scales[y+2]=n,d.phases[f]=m*1.7,d.waves[f*2]=m*u,d.waves[f*2+1]=s,Ft(d,f,3,(Math.round(e.pathStart)+t)%2,0),f+=1}}}),d},Bt=e=>{let t=new W;return t.setAttribute(`position`,new q(e.positions,3)),t.setAttribute(`aNormal`,new q(e.normals,3)),t.setAttribute(`aAnchor`,new q(e.anchors,3)),t.setAttribute(`aScale`,new q(e.scales,3)),t.setAttribute(`aPhase`,new q(e.phases,1)),t.setAttribute(`aStyle`,new q(e.styles,3)),t.setAttribute(`aWave`,new q(e.waves,2)),t.setDrawRange(0,e.pointCount),t},Vt=(e,t,n,r,i)=>e+(t-e)*(1-Math.exp(-(t>e?n:r)*i)),Ht=e=>Math.min(1,Math.max(0,e)),Ut=()=>({fast:0,floor:0,peak:0,armed:!1,primed:!1}),Wt=22,Gt=7,Kt=2.5,qt=4,Jt=9,Yt=.28,Xt=.12,Zt=.22,Qt=.42,$t=.2,en=(e,t,n)=>{let r=Ht(t);e.primed?(e.fast=Vt(e.fast,r,Wt,Gt,n),e.floor=Vt(e.floor,r,Kt,qt,n),e.peak=Vt(e.peak,r,Jt,Yt,n)):(e.fast=r,e.floor=r,e.peak=r,e.primed=!0);let i=Math.max(Xt,e.peak-e.floor),a=Ht((e.fast-e.floor)/i),o=Ht(e.fast/Math.max(Zt,e.peak)),s=!1;return!e.armed&&a>=Qt?(e.armed=!0,s=!0):e.armed&&a<=$t&&(e.armed=!1),{transient:a,sustained:o,onset:s}},tn=[{band:`bass`,strength:1.45,speed:.9,width:.66,wavenumber:3.4},{band:`mid`,strength:.9,speed:1.6,width:.36,wavenumber:5.5},{band:`treble`,strength:.5,speed:2.5,width:.22,wavenumber:9}],nn=tn.length*3,rn=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},an=(e,t)=>({flowSpeed:Math.min(1.55,.3+Ht(e.sustained)*1.25),clusterPulse:Math.min(i,1+rn(.1,.9,e.transient)*.14+rn(.15,.95,t.transient)*.05)}),on=.12,sn=(e,t,n)=>1+(e-1)*t*(n?on:1),cn=()=>({value:1,velocity:0}),ln=(e,t,n)=>{let r=Math.min(.1,Math.max(0,n)),a=Math.min(i,Math.max(.9,t));for(;r>0;){let t=Math.min(1/240,r),n=(a-e.value)*150-e.velocity*15;e.velocity+=n*t,e.value+=e.velocity*t,r-=t}return e.value=Math.min(i,Math.max(.9,e.value)),e.value},un=`
#define RIPPLE_COUNT ${nn}

attribute vec3 aNormal;
attribute vec3 aAnchor;
attribute vec3 aScale;   // (uniformScale, yStretch, localRadius = this primitive's own size)
attribute float aPhase;
attribute vec3 aStyle;
attribute vec2 aWave;    // corridor: (along the tunnel in radius units, angle around it). clouds: dissolve seed.

uniform float uTime;
uniform float uCorridor;      // 0 = formation clouds, 1 = path tunnel
uniform float uAmplitude;     // displacement per unit of swell, as a FRACTION of the primitive's own radius
uniform float uMaxSwell;      // the DISPLACEMENT that counts as full reach - normalises d. Reading d off
                              // the raw wave instead let a point glow while the amplitude held it
                              // perfectly still (audio response at 0: no motion, full halo).
uniform float uWaveNumberMax; // finest wavenumber this buffer's lattice can carry without aliasing
uniform float uDetail;        // 0..1 sustained treble: fine surface texture ON EXISTING CRESTS only
// Ripple sources. Audio writes these and nothing else; the surface motion is autonomous after.
//   clouds:   xyz = origin on the shape's unit sphere
//   corridor: xy  = origin as (along, angle) on the tunnel wall
uniform vec4 uRippleSource[RIPPLE_COUNT];  // origin, w = birth time
uniform vec4 uRippleShape[RIPPLE_COUNT];   // x = strength, y = speed, z = packet width, w = wavenumber
uniform float uOffsetGain;    // whole-body sway gain, driven by mid energy
uniform float uFlow;          // how much the corridor's idle breath travels on its own
uniform float uFormation;     // 1 = formed, 0 = fully scattered/dissolved (song-change dissolve)
uniform float uScatter;       // how far points fly out when dissolving
uniform float uPulse;         // gentle whole-body beat scale
uniform float uSpectralCentroid;
uniform float uViewportHeight;
uniform float uSizeBase;
uniform float uSizeGain;
uniform float uGlow;
uniform float uGlowPass;
uniform vec3 uPrimaryColor;
uniform vec3 uAccentColor;
uniform vec3 uSecondaryColor;

varying vec3 vColor;
varying float vAlpha;
varying float vReaction;

float hermite(float value) { return value * value * (3.0 - 2.0 * value); }
float hash11(float n) { return fract(sin(n) * 43758.5453123); }

float resolveLife(float distanceToCamera) {
    float farT = clamp((${27 .toFixed(1)} - distanceToCamera) / ${7 .toFixed(1)}, 0.0, 1.0);
    float nearT = clamp((distanceToCamera - ${te.toFixed(1)}) / ${(3-te).toFixed(1)}, 0.0, 1.0);
    return hermite(farT) * hermite(nearT);
}

/**
 * One ripple's contribution at distance r from its origin - the whole elastic behaviour, in four terms:
 *   dr   = how far this point is from the ring the wave has expanded to (age * speed)
 *   sin  = the crest/trough, so the surface overshoots and rings back (elasticity + inertia)
 *   exp  = the packet's width, then the decay in time and in distance (birth, spread, settle)
 * Every term is a smooth function of r, so neighbouring points - including across a cube's edge or the
 * tunnel's seam - move together as one wavefront. Shared by both modes: only r is measured differently.
 */
float ripplePacket(float r, float age, vec4 shape) {
    float dr = r - age * shape.y;
    float k = min(shape.w, uWaveNumberMax);
    float packet = exp(-(dr * dr) / (shape.z * shape.z)) * sin(dr * k);
    // The age decay has to outlast the wave's own travel, or it dies before it has visibly crossed the
    // surface - and the propagation is the entire point.
    return shape.x * packet * exp(-age * 1.15) * exp(-r * 0.35);
}

/** Clouds: sum of every live ripple, in the shape's own unit space. Each cluster spins the origin by its
 *  own phase, so neighbouring clouds are struck in the same instant but not at the same spot. */
float cloudRipples(vec3 unitPos, float phase) {
    float spin = cos(phase);
    float spun = sin(phase);
    float total = 0.0;
    for (int i = 0; i < RIPPLE_COUNT; i += 1) {
        vec4 source = uRippleSource[i];
        vec4 shape = uRippleShape[i];
        float age = uTime - source.w;
        if (shape.x <= 0.0 || age < 0.0) continue;
        vec3 origin = vec3(
            source.x * spin - source.z * spun,
            source.y,
            source.x * spun + source.z * spin
        );
        total += ripplePacket(distance(unitPos, origin), age, shape);
    }
    return total;
}

/**
 * Offset from a source to this point ON THE TUNNEL WALL, as (along, arc), both in radius units so the
 * result is directly comparable to a cloud's 3D distance and one set of ripple parameters drives both.
 * The angular term is wrapped to [-PI, PI] by atan(sin, cos), which is EXACTLY periodic - that is what
 * makes a ripple cross the seam without noticing it, and lets it spread round the circumference and meet
 * itself on the far side. See the seam note at the top of this file.
 */
vec2 corridorSurfaceDelta(vec2 w, vec2 origin) {
    float dAngle = w.y - origin.y;
    return vec2(w.x - origin.x, atan(sin(dAngle), cos(dAngle)));
}

/** Corridor: the same ripples, measured across the wall - so a hit lifts a contiguous patch of cylinder
 *  that then travels both round the ring and along the tunnel. */
float corridorRipples(vec2 w) {
    float total = 0.0;
    for (int i = 0; i < RIPPLE_COUNT; i += 1) {
        vec4 source = uRippleSource[i];
        vec4 shape = uRippleShape[i];
        float age = uTime - source.w;
        if (shape.x <= 0.0 || age < 0.0) continue;
        total += ripplePacket(length(corridorSurfaceDelta(w, source.xy)), age, shape);
    }
    return total;
}

// A slow continuous breath so a cloud is alive between hits. Still one smooth field of position, so it
// cannot separate anything; deliberately far below the ripples in scale, and excluded from d so it never
// lights the shape up.
float cloudIdle(vec3 unitPos) {
    return 0.11 * sin(unitPos.x * 1.7 + uTime * 0.5) * cos(unitPos.z * 1.4 - uTime * 0.37)
         + 0.06 * sin(unitPos.y * 2.1 - uTime * 0.66);
}

// The corridor's equivalent: a slow region envelope carrying finer travelling waves along the tunnel.
// Every ANGULAR term is an integer harmonic (2.0, 3.0) so it closes on itself after a full turn.
float corridorIdle(vec2 w) {
    float t = uTime * uFlow;
    float region = 0.6 + 0.4 * sin(w.x * 0.42 - t * 0.33);
    float ripple = 0.62 * sin(w.x * 1.25 - t * 1.15)
                 + 0.30 * sin(w.x * 0.8 + w.y * 2.0 - t * 0.8)
                 + 0.08 * sin(w.y * 3.0 + t * 0.5);
    return region * ripple;
}

// Fine surface texture for sustained treble. Products of sines beat together into diagonal components
// above the nominal frequency, so these run at 0.7 of the lattice ceiling to leave that headroom.
float cloudDetail(vec3 p) {
    float k = uWaveNumberMax * 0.7;
    return sin(p.x * k + uTime * 3.1)
         * sin(p.y * k - uTime * 2.6)
         * sin(p.z * k + uTime * 2.2);
}

// Same, on the wall. The angular harmonic is floored to an integer so it closes round the circle.
float corridorDetail(vec2 w) {
    float k = uWaveNumberMax * 0.7;
    float n = max(1.0, floor(k));
    return sin(w.x * k + uTime * 3.1) * sin(w.y * n - uTime * 2.4);
}

void main() {
    float colorSlot = aStyle.y;
    float isFar = aStyle.z;
    vec3 normalDir = normalize(aNormal);
    // How big this primitive actually is, in its own local units. Everything below moves by a fraction
    // of it, never by a world-constant number of units.
    float localRadius = aScale.z;

    // Stretch the base shape FIRST, then displace: scaling AFTER would multiply the displacement by
    // aScale.y too, and a tall pillar's caps would travel ~3.4x further than its sides.
    vec3 basePos = position;
    basePos.y *= aScale.y;

    // ONE scalar swell per mode, then ONE displacement shape for both. Nothing here is per-face.
    // The field is read from the UNSTRETCHED position in the shape's own unit space, so one set of ripple
    // parameters fits every primitive and a 3.4x pillar reads the same wavefront across its width as
    // along its length.
    vec3 unitPos = position / localRadius;
    bool corridor = uCorridor > 0.5;
    float audio = corridor ? corridorRipples(aWave) : cloudRipples(unitPos, aPhase);
    float idle = corridor ? corridorIdle(aWave) : cloudIdle(unitPos);

    // HIGH FREQUENCY. Gated by the swell that is ALREADY there, so sustained treble can only sharpen the
    // texture of a crest that exists - on a still surface the gate is 0 and it cannot manufacture noise.
    // It is a continuous field like everything else, so neighbours share it and it cannot flicker or
    // scatter; and it is deliberately a fraction of the low-frequency travel, so it layers on top of the
    // big swell instead of competing with it.
    float detail = uDetail * smoothstep(0.06, 0.45, abs(audio));
    audio += (corridor ? corridorDetail(aWave) : cloudDetail(unitPos)) * detail * 0.3;

    // Safety net only: several sources peaking together must not throw a point clear of its own body.
    float swell = clamp(audio + idle, -1.6, 1.6) * uAmplitude;
    vec3 displaced = basePos + normalDir * (swell * localRadius);
    // d = how far the music ACTUALLY moved this point, against a fixed full-reach displacement. Two things
    // it must not be: the raw wave (a point held still by a zero amplitude would still glow), or the total
    // swell (the idle breath would light the shape up with no music playing). Both were true before.
    float d = clamp(abs(clamp(audio, -1.6, 1.6) * uAmplitude) / max(uMaxSwell, 0.0001), 0.0, 1.0);

    // Whole-body sway on mid energy (the reference's offsetGain): a RIGID translation of the entire
    // cluster along a FIXED local axis, exactly as the reference does it (newpos.z += ...). Along
    // normalDir it would translate each face in its own direction - a per-face displacement, which is the
    // very thing that splits a cube open. On the corridor aPhase is now ring-constant, so a ring sways as
    // one rigid ring rather than shearing itself open at the seam.
    displaced.z += sin(uTime * 0.6 + aPhase) * 0.12 * uOffsetGain * localRadius;

    // Dissolve: as uFormation falls to 0 the points fly apart into the surroundings (and fade below), so a
    // corridor leaves by dispersing and arrives by gathering back in - never a flat alpha cut.
    float scatter = 1.0 - uFormation;
    if (scatter > 0.001) {
        float r1 = hash11(aPhase * 12.9898 + aWave.x * 78.233);
        float r2 = hash11(aPhase * 39.346 + aWave.y * 11.135 + 3.7);
        float r3 = hash11(r1 * 91.7 + r2 * 47.3);
        vec3 spread = normalize(normalDir * 0.75 + vec3(r1 - 0.5, r2 - 0.5, r3 - 0.5) * 1.6);
        displaced += spread * (scatter * scatter * uScatter * (0.55 + r3 * 0.9));
    }

    displaced *= aScale.x * uPulse;
    vec3 worldPosition = aAnchor + displaced;

    float life = resolveLife(distance(worldPosition, cameraPosition));
    vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);

    // The reaching points GROW - in the reference this size gain, not the travel, is what reads as the
    // amplitude. Treble adds a further, smaller, SMOOTH size lift over its (continuous) detail region -
    // never a per-point random scale, which would read as the flicker we must avoid. The glow layer draws
    // the same points as wide soft haloes.
    float glowScale = mix(1.0, 1.9 + uGlow * 1.3, uGlowPass);
    float sizeWorld = (uSizeBase + (pow(d, 3.0) + detail * 0.35) * uSizeGain) * glowScale;
    float projected = sizeWorld * uViewportHeight * projectionMatrix[1][1] * 0.5 / max(-mvPosition.z, 0.1);
    gl_PointSize = clamp(projected, mix(1.4, 2.0, uGlowPass), mix(26.0, 64.0, uGlowPass));
    gl_Position = projectionMatrix * mvPosition;

    // Palette drift through primary/accent/secondary; reaching points re-tint toward the hot accent so
    // active regions read as coloured bands. Treble pushes its detail region further along that shift, so
    // a cymbal colours a continuous patch of surface that travels and fades with the ripple under it.
    float gradientPhase = (
        dot(basePos, vec3(0.2, 0.16, 0.13))
        + aPhase * 0.05
        + colorSlot * 0.5
        + uTime * 0.02
        + uSpectralCentroid * 0.3
    ) * 6.283;
    vec3 wgt = max(vec3(0.0), 0.5 + 0.5 * cos(gradientPhase - vec3(0.0, 2.094, 4.188)));
    wgt *= wgt; wgt /= max(wgt.x + wgt.y + wgt.z, 0.001);
    vec3 baseColor = uPrimaryColor * wgt.x + uAccentColor * wgt.y + uSecondaryColor * wgt.z;
    vec3 hotColor = mix(uAccentColor, uSecondaryColor, smoothstep(0.2, 0.9, uSpectralCentroid));
    float hot = min(1.0, smoothstep(0.1, 0.75, d) * 0.75 + detail * 0.3);
    vColor = mix(baseColor, hotColor, hot) * (0.92 + d * 0.5);

    float layerBase = mix(0.72, 0.5, isFar);
    // Contrast layer: a readable body plus a reach lift, so the geometry is legible even in silence.
    // Glow layer: bound to the DISPLACED region and nothing else. It starts at zero - a point the music is
    // not moving does not glow at all - and rises smoothly with d, which is itself a continuous field, so
    // the halo fades outward from a crest and travels and decays with it instead of blinking.
    float formed = smoothstep(0.0, 0.45, uFormation);
    vAlpha = formed * (uGlowPass > 0.5
        ? life * smoothstep(0.1, 0.8, d) * 1.15
        : life * min(1.0, layerBase + d * 0.28));
    vReaction = d;
}
`,dn=`
uniform float uGlow;
uniform float uGlowPass;

varying vec3 vColor;
varying float vAlpha;
varying float vReaction;

// three hands a ShaderMaterial its uniforms in the LINEAR working space and expects the sRGB conversion
// on the way out; for its own materials the colorspace_fragment chunk does it. That chunk is useless here
// - it expands to linearToOutputTexel(), which the ShaderMaterial prefix does not define, and including it
// compiles the shader to solid black (measured, not assumed). So this shader has to convert its own output,
// and until now it did not: it wrote linear values raw into an sRGB framebuffer and every point rendered
// far darker and more saturated than the theme colour it was handed - measured #c8783c -> #932f0c, a 3.1x
// drop in luminance, while an ordinary meshBasicMaterial on the same colour read back exactly #c8783c.
// That is what made the adaptive contrast in dioramaParticleMaterials.ts a guarantee about a colour that
// never reached the screen: it binary-searches the theme colour up to a >= 4.6 WCAG ratio, and then the
// point drew three times darker than the value it had just cleared.
vec3 dioramaLinearToSRGB(vec3 linear) {
    vec3 safe = max(linear, vec3(0.0));
    return mix(
        pow(safe, vec3(0.41666)) * 1.055 - vec3(0.055),
        safe * 12.92,
        vec3(lessThanEqual(safe, vec3(0.0031308)))
    );
}

void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float radius = length(point);

    if (uGlowPass > 0.5) {
        // Additive soft halo: a wide falloff whose strength rides the glow slider and the point's reach.
        // Hard-capped so several overlapping crests cannot stack into a blown-out white blob.
        float halo = pow(clamp(1.0 - radius * 2.0, 0.0, 1.0), 1.7);
        float alpha = min(0.5, halo * vAlpha * uGlow * 0.4);
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(dioramaLinearToSRGB(vColor * (1.0 + uGlow * 0.25)), alpha);
        return;
    }

    // Contrast layer: a soft-edged but near-opaque disc so the theme-adapted colour actually reads.
    float core = 1.0 - smoothstep(0.14, 0.48, radius);
    float alpha = core * vAlpha;
    if (alpha < 0.01) discard;
    float emission = 0.95 + vReaction * 0.22;
    gl_FragColor = vec4(dioramaLinearToSRGB(vColor * emission), alpha);
}
`,fn=e=>.2126*e.r+.7152*e.g+.0722*e.b,pn=(e,t)=>{let n=fn(e),r=fn(t),i=Math.max(n,r),a=Math.min(n,r);return(i+.05)/(a+.05)},mn=.874,hn=.72,gn=(e,t)=>{let n=e.clone().multiplyScalar(mn).convertLinearToSRGB(),r=t.clone().convertLinearToSRGB(),i=(e,t)=>e*hn+t*.28;return new J(i(n.r,r.r),i(n.g,r.g),i(n.b,r.b)).convertSRGBToLinear()},_n=(e,t)=>pn(gn(e,t),t),vn=(e,t,n)=>{if(_n(e,t)>=n)return e.clone();let r=new J(16777215),i=new J(328965),a=_n(r,t)>=_n(i,t)?r:i,o=0,s=1;for(let r=0;r<10;r+=1){let r=(o+s)*.5;_n(e.clone().lerp(a,r),t)>=n?s=r:o=r}return e.clone().lerp(a,s)},yn=(e,t)=>({primary:vn(e.primary,t,4.6),accent:vn(e.accent,t,4.1),secondary:vn(e.secondary,t,4.6)}),bn=(e,t,n)=>({uTime:{value:0},uCorridor:{value:0},uAmplitude:{value:.34},uMaxSwell:{value:.29},uWaveNumberMax:{value:8},uDetail:{value:0},uRippleSource:{value:new Float32Array(nn*4)},uRippleShape:{value:new Float32Array(nn*4)},uOffsetGain:{value:0},uFlow:{value:1},uFormation:{value:1},uScatter:{value:4},uSizeBase:{value:.052},uSizeGain:{value:.3},uPulse:{value:1},uSpectralCentroid:{value:.5},uViewportHeight:{value:1},uGlow:{value:n},uGlowPass:{value:t},uPrimaryColor:{value:e.primary.clone()},uAccentColor:{value:e.accent.clone()},uSecondaryColor:{value:e.secondary.clone()}}),xn=e=>new _e({vertexShader:un,fragmentShader:dn,uniforms:bn(e,0,0),transparent:!0,depthWrite:!1,blending:1,toneMapped:!1}),Sn=(e,t)=>new _e({vertexShader:un,fragmentShader:dn,uniforms:bn(e,1,t),transparent:!0,depthWrite:!1,blending:2,toneMapped:!1}),Cn=(e,t,n)=>{e.uniforms.uPrimaryColor.value.lerp(t.primary,n),e.uniforms.uAccentColor.value.lerp(t.accent,n),e.uniforms.uSecondaryColor.value.lerp(t.secondary,n)},wn=.92,Tn=4.5,En=.4,Dn=(e,t)=>Math.abs(e.r-t.r)+Math.abs(e.g-t.g)+Math.abs(e.b-t.b),On=(e,t)=>{let n=e.clone().convertLinearToSRGB(),r=t.clone().convertLinearToSRGB(),i=(e,t)=>e*wn+t*.07999999999999996;return new J(i(n.r,r.r),i(n.g,r.g),i(n.b,r.b)).convertSRGBToLinear()},kn=(e,t)=>pn(On(e,t),t),An=(e,t,n,r)=>{if(r(e)>=n)return e.clone();let i=0,a=1;for(let o=0;o<10;o+=1){let o=(i+a)*.5;r(e.clone().lerp(t,o))>=n?a=o:i=o}return e.clone().lerp(t,a)},jn=(e,t,n,r)=>{let i=An(e,n,En,e=>Dn(e,t)),a=new J(16777215),o=new J(328965);return An(i,kn(a,r)>=kn(o,r)?a:o,Tn,e=>kn(e,r))},Mn=(e,t)=>ue(e,t),Nn=(e,t,n,r,i,a)=>{let o=new Map;if(!e||t.length===0||n.length===0)return o;let s=z(e,n);if(s.length===0)return o;let c=R(t.map((e,t)=>({key:String(t),timed:!0,startOffset:e.charStart,endOffset:e.charEnd})),s),l=new Map;return c.forEach((e,t)=>{let n=l.get(e);n||(n=jn(new J(e),r,i,a),l.set(e,n)),o.set(Number(t),n)}),o},Pn=700,Fn=1.4,In=.7,Ln=.2,Rn=4096,zn=.16,Bn=(e,t=Pn)=>`${t} 128px ${e}`,Vn=null,Hn=()=>{if(!Vn){let e=document.createElement(`canvas`);e.width=1,e.height=1,Vn=e.getContext(`2d`)}return Vn},Un=(e,t)=>{let n=Hn();return n.font=t,n.measureText(e).width},Wn=e=>{let t=new V(e);return t.anisotropy=4,t.colorSpace=ve,t},Gn=(e,t,n,r,i)=>{let a=1e4;e.save(),e.globalCompositeOperation=`lighter`,e.fillStyle=`#ffffff`;let o=(i,o)=>{e.shadowColor=`rgba(255,255,255,${o})`,e.shadowBlur=i,e.shadowOffsetX=a,e.shadowOffsetY=0,e.fillText(t,n-a,r)};o(i,.95),o(i,.85),o(i*2,.55),o(i*2.9,.3),e.restore()},Kn=(e,t)=>{let n=Math.ceil(128*In),r=Math.max(1,Math.ceil(Un(e,t))),i=r+180,a=Math.ceil(128*Fn)+180,o=n,s=a/2,c=e=>{let n=document.createElement(`canvas`);n.width=i,n.height=a;let r=n.getContext(`2d`);return r.font=t,r.textAlign=`left`,r.textBaseline=`middle`,e(r),Wn(n)};return{baseTexture:c(t=>{t.fillStyle=`#ffffff`,t.fillText(e,o,s)}),glowTexture:c(t=>{Gn(t,e,o,s,128*zn)}),canvasWidthPx:i,canvasHeightPx:a,advancePx:r}},qn=(e,t,n=Pn)=>{let r=128,i=Bn(t,n),a=Math.max(1,Math.ceil(Un(e,i))),o=Math.ceil(r*Ln);if(a+o*2>Rn){let s=(Rn-o*2)/a;r=Math.max(24,Math.floor(r*s)),i=`${n} ${r}px ${t}`,a=Math.max(1,Math.ceil(Un(e,i)))}let s=a+o*2,c=Math.ceil(r*Fn)+o*2,l=document.createElement(`canvas`);l.width=s,l.height=c;let u=l.getContext(`2d`);return u.font=i,u.textAlign=`left`,u.textBaseline=`middle`,u.fillStyle=`#ffffff`,u.fillText(e,o,c/2),{texture:Wn(l),canvasWidthPx:s,canvasHeightPx:c,advancePx:a,fontPx:r}},Jn=1.6,Yn=2.2,Xn=()=>({beats:0,downbeats:0,synced:!1}),Zn=(e,t)=>{let n=e.synced?t.beats-e.beats:0,r=e.synced?t.downbeats-e.downbeats:0;return e.beats=t.beats,e.downbeats=t.downbeats,e.synced=!0,{beat:n-r>0,downbeat:r>0}},Qn=(e,t)=>Math.min(i,1+Math.max(0,e)*.2+Math.max(0,t)*.28),$n=(e,t,n,r)=>{let i=k(t,n);return e===`downbeat`?{index:0,strength:Yn*r*i}:{index:t?.tone&&t.tone.low>.5?0:1,strength:Jn*r*i}},er=.25,tr=.4,nr=.8,rr=(e,t)=>Math.min(nr,Math.max(0,e)*er+Math.max(0,t)*tr),$=s(),ir=()=>({sources:new Float32Array(nn*4),shapes:new Float32Array(nn*4),cursor:tn.map(()=>0),spawned:0}),ar=8/ot,or=(e,t,n,r,i,a)=>{let o=b(`diorama-ripple:${e.spawned}`),s=tn[t],c=C(o+1),l=C(o+2),u=C(o+3),d=e.cursor[t],f=(t*3+d)*4;if(i)e.sources[f]=a+.4+C(o+4)*2.2,e.sources[f+1]=C(o+5)*Math.PI*2,e.sources[f+2]=0;else{let t=C(o+4)*2-1,n=C(o+5)*Math.PI*2,r=Math.sqrt(Math.max(0,1-t*t));e.sources[f]=r*Math.cos(n),e.sources[f+1]=t,e.sources[f+2]=r*Math.sin(n)}e.sources[f+3]=r,e.shapes[f]=s.strength*n*(.7+c*.6),e.shapes[f+1]=s.speed*(.8+u*.45),e.shapes[f+2]=s.width*(.78+l*.5),e.shapes[f+3]=s.wavenumber,e.cursor[t]=(d+1)%3,e.spawned+=1},sr=.4,cr=.34,lr=.45,ur=.1,dr=.85,fr=dr*cr,pr=dr*lr,mr=({mode:e,clusters:t,corridorSpans:n,density:r,particleGlowEnabled:i,particleGlowIntensity:a,currentTime:o,audioBands:s,audioLevel:c,primaryColor:l,accentColor:u,secondaryColor:d,backgroundColor:f,transitionActive:p,readHeadLine:m,resetKey:h})=>{let{geometry:g,waveNumberMax:_}=(0,X.useMemo)(()=>{let i=e===`corridor`?zt(n,r):It(t,r);return{geometry:Bt(i),waveNumberMax:Nt(i.spacing)}},[e,t,n,r]),v=(0,X.useMemo)(()=>yn({primary:new J(l),accent:new J(u),secondary:new J(d)},new J(f)),[l,u,d,f]),y=(0,X.useRef)(null);y.current===null&&(y.current=xn(v));let b=y.current,x=(0,X.useRef)(null);x.current===null&&(x.current=Sn(v,a));let S=x.current,ee=(0,X.useRef)(tn.map(()=>Ut())),C=(0,X.useRef)(Xn()),te=(0,X.useRef)(ir()),w=(0,X.useRef)(0),T=(0,X.useRef)(null),ne=(0,X.useRef)(new B),E=(0,X.useRef)(cn()),D=(0,X.useRef)(1),re=(0,X.useRef)(sr);return(0,X.useEffect)(()=>()=>{g.dispose()},[g]),(0,X.useEffect)(()=>()=>{b.dispose(),S.dispose()},[S,b]),(0,X.useEffect)(()=>{S.uniforms.uGlow.value=a},[S,a]),(0,X.useEffect)(()=>{T.current=null,E.current=cn(),te.current=ir(),ee.current=tn.map(()=>Ut()),C.current=Xn()},[h]),ye((t,n)=>{let r=Math.min(n,.1),i=Math.min(1,s.bass.get()/255),a=Math.min(1,(s.lowMid.get()*.5+s.mid.get()*.5)/255),l=Math.min(1,s.treble.get()/255),u=ee.current,d=en(u[0],i,r),f=en(u[1],a,r),h=en(u[2],l,r),g=[d,f,h],y=an(d,f),x=Zn(C.current,N()),k=ie(),j=Math.max(0,c),oe=Math.max(0,o.get()),P=T.current,F=P==null?0:oe-P;P==null||F<-.05||F>.5?(w.current=oe*.28,te.current=ir()):F>0&&(w.current+=F*y.flowSpeed),T.current=oe;let I=te.current,L=e===`corridor`,le=m*ar;if(j>.001&&(g.forEach((e,t)=>{e.onset&&(k&&t<2||or(I,t,e.transient,w.current,L,le))}),k)){let e=M(),t=O();if(x.downbeat&&e.downbeat>0){let n=$n(`downbeat`,ae(),t,e.downbeat);n.strength>0&&or(I,n.index,n.strength,w.current,L,le)}if(x.beat&&e.beat>0){let n=$n(`beat`,A(),t,e.beat);n.strength>0&&or(I,n.index,n.strength,w.current,L,le)}}let R=ln(E.current,sn(k?Qn(se.get(),ce.get()):y.clusterPulse,j,L),r);t.gl.getDrawingBufferSize(ne.current);let z=1-Math.exp(-1.2*r);re.current=p?0:Math.min(sr,re.current+r);let ue=+(!p&&re.current>=sr);D.current=Vt(D.current,ue,1.5,3.2,r);let de=j*(L?Math.min(lr,ur+d.sustained*.18+f.sustained*.08):cr),fe=+!!L,pe=L?6:1.4,me=L?.072:.05,he=L?.34:.3,B=Math.min(1,.2+h.sustained*.8),V=ne.current.y;for(let e of[b,S]){let t=e.uniforms;t.uTime.value=w.current,t.uCorridor.value=+!!L,t.uAmplitude.value=de,t.uMaxSwell.value=L?pr:fr,t.uWaveNumberMax.value=_,t.uDetail.value=Math.min(1,h.sustained*j),t.uRippleSource.value=I.sources,t.uRippleShape.value=I.shapes,t.uOffsetGain.value=f.sustained*j,t.uFlow.value=fe,t.uFormation.value=D.current,t.uScatter.value=pe,t.uSizeBase.value=me,t.uSizeGain.value=he,t.uPulse.value=R,t.uSpectralCentroid.value=B,t.uViewportHeight.value=V,Cn(e,v,z)}}),(0,$.jsxs)($.Fragment,{children:[i&&(0,$.jsx)(`points`,{geometry:g,material:S,frustumCulled:!1,renderOrder:3}),(0,$.jsx)(`points`,{geometry:g,material:b,frustumCulled:!1,renderOrder:4})]})},hr=e=>e===-1?.3:e===-2?.1:e===1?.34:e===2?.16:e===3?.06:0,gr=e=>e===0?.7:Math.abs(e)<=2?.45:.25,_r=.62,vr=.72,yr=.28,br=Math.PI/180,xr=.9,Sr=1.2,Cr=.92,wr=.5,Tr=.9,Er=.6,Dr=.06,Or=.5,kr=.1,Ar=.3,jr=.5,Mr=e=>Math.min(1,Math.max(0,e)),Nr=(e,t,n,r,i)=>e+(t-e)*(1-Math.exp(-(t>e?n:r)*i)),Pr=e=>e*e*(3-2*e),Fr=.35,Ir=1.8,Lr=(e,t)=>{if(e<=t.startTime)return 0;if(e<t.endTime){let n=Math.max(t.endTime-t.startTime,.001);return Pr(Mr((e-t.startTime)/n))}let n=e-t.endTime;return n<=.35?1:1-Pr(Mr((n-Fr)/Ir))},Rr=(e,t,n,r)=>e.copy(t).lerp(n,Mr(r)),zr=(e,t,n,r)=>e!==t||n!==r,Br=e=>{let t=Mr((40-e)/8),n=Mr((e-xr)/(2-xr));return t*t*(3-2*t)*(n*n*(3-2*n))},Vr=(e,t,n,r)=>{if(e<=0||t<=0)return 1;let i=2*t*Math.tan(n*br/2)*r*vr;return Math.min(1,Math.max(yr,i/e))},Hr=new K,Ur=new H,Wr=new H,Gr=new Y,Kr=new Y,qr=new Y,Jr=new Y(0,1,0),Yr=new Y(0,0,1),Xr=(e,t=0,n=0)=>(Gr.set(e.right.x,e.right.y,e.right.z),Kr.set(e.up.x,e.up.y,e.up.z),qr.set(-e.forward.x,-e.forward.y,-e.forward.z),Hr.makeBasis(Gr,Kr,qr),Ur.setFromRotationMatrix(Hr),n!==0&&Ur.multiply(Wr.setFromAxisAngle(Jr,n)),t!==0&&Ur.multiply(Wr.setFromAxisAngle(Yr,t)),[Ur.x,Ur.y,Ur.z,Ur.w]),Zr=(e,t)=>e===`box`?t.strands:e===`sphere`?t.blobs:e===`cone`?t.ribbons:t.rings,Qr=e=>{let t=e.kind===`box`?.5:e.kind===`sphere`?.74:e.kind===`cone`?.68:.9;return e.scale*Math.max(t,e.stretchY*.55)*i},$r=(e,t)=>Math.hypot(e.position.x-t.position.x,e.position.y-t.position.y,e.position.z-t.position.z),ei=(e,t)=>{if(!t.enabled||t.mode!==`clouds`)return[];let n=e.filter(e=>Zr(e.kind,t));return n.filter((e,t)=>{let r=Qr(e);for(let i=t-1;i>=0;--i){let t=n[i];if(e.sourceLine-t.sourceLine>2)break;if(t.sourceLine===e.sourceLine)continue;let a=Math.max(1.8,(Qr(t)+r)*1.18);if($r(t,e)<a)return!1}return!0})},ti=/[⺀-鿿぀-ヿ豈-﫿ｦ-ﾟ•·■-◿]/,ni=(e,t,n)=>{let r=new Set,i=(e,t,i)=>{let a=Math.max(e-t,0),o=Math.min(e+i,n-1);for(let e=a;e<=o;e+=1)r.add(e)};return i(e,2,3),t!=null&&i(t,2,1),Array.from(r).sort((e,t)=>e-t)},ri=(e,t,n,r,i)=>{let a=[];for(let o of t){let t=De(e,o);if(!t||!t.line)continue;let{frame:s}=t,c=l(t.localIndex,t.segment.seed,i),u={x:s.position.x+s.right.x*c.offsetR+s.up.x*c.offsetU,y:s.position.y+s.right.y*c.offsetR+s.up.y*c.offsetU,z:s.position.z+s.right.z*c.offsetR+s.up.z*c.offsetU};a.push({index:o,line:t.line,placement:c,position:[u.x,u.y,u.z],quaternion:Xr(s,c.roll,c.yaw),isOutgoing:r!=null&&Math.abs(o-r)<=Math.abs(o-n)})}return a},ii=(e,t,n,r,i)=>{if(!r.enabled||i!==`corridor`)return[];let a=ct(e,t,6,7);return n==null?a:[...ct(e,n,6,7),...a]},ai=(e,t,n,r,i,a)=>{if(n!==`clouds`)return[];let o=[],s=new Set(t),c=new Set;for(let e of t)for(let t=0;t<=2;t+=1)e-t>=0&&c.add(e-t);for(let t of Array.from(c).sort((e,t)=>e-t)){let n=De(e,t);if(!n)continue;let{frame:i,localIndex:s,segment:c}=n,u=l(s,c.seed,r.weaveScale),d=g(s,c.lines,c.seed,r.subMode);h(s,c.seed,d,i,u,a).forEach((e,n)=>{o.push({...e,key:`${t}-${n}`,sourceLine:t,particleSeed:`${c.seed??`seed`}:${s}:${n}:${e.kind}`,role:`formation`})})}return ei(o,i).filter(e=>s.has(e.sourceLine))},oi=(e,t)=>{if(!e||t.length===0)return[];let n=L(e.fullText),r=[],i=0;for(let e of n)r.push(i),i+=e.length;let a=[],o=(e,i)=>{let o=n.slice(e,i).join(``);o.trim().length!==0&&a.push({text:o,charStart:r[e]??0,charEnd:(r[i-1]??0)+(n[i-1]?.length??1),startTime:t[e].startTime,endTime:t[i-1].endTime})},s=0;for(;s<t.length;){let e=n[s]??``;if(e.trim().length===0){s+=1;continue}if(ti.test(e)){o(s,s+1),s+=1;continue}let r=t[s].wordIndex,i=s+1;for(;i<t.length&&t[i].wordIndex===r&&(n[i]??``).trim().length>0&&!ti.test(n[i]??``);)i+=1;o(s,i),s=i}return a},si=(e,t,n)=>{if(!e?.fullText||t.length===0)return null;let r=_r/128,i=e.fullText,a=Un(i,n);return{units:t.map(e=>{let t=Un(i.slice(0,e.charStart),n),o=Kn(i.slice(e.charStart,e.charEnd),n);return{raster:o,centerX:(-a/2+t+o.advancePx/2)*r,width:o.canvasWidthPx*r,height:o.canvasHeightPx*r}}),lineWidth:a*r}},ci=class{constructor(){this.rasters=new Map,this.font=``,this.epoch=-1}get(e){return this.rasters.get(e)}sync({visibleLines:e,globalIndex:t,fontSpec:n,fontStack:r,fontWeight:i,linesEpoch:a,onChange:o}){let s=this.rasters;(this.font!==n||this.epoch!==a)&&(s.forEach(e=>e.texture.dispose()),s.clear(),this.font=n,this.epoch=a);let c=new Set;e.forEach(({index:e,line:n})=>{n?.fullText&&e!==t&&c.add(e)});let l=!1;s.forEach((e,t)=>{c.has(t)||(e.texture.dispose(),s.delete(t),l=!0)});let u=[];if(c.forEach(e=>{s.has(e)||u.push(e)}),u.length===0){l&&o();return}let d=!1,f=0,p=0,m=()=>{if(!d){for(let t=0;t<2&&p<u.length;t+=1,p+=1){let t=e.find(e=>e.index===u[p]);t?.line?.fullText&&!s.has(u[p])&&s.set(u[p],qn(t.line.fullText,r,i))}o(),p<u.length&&(f=requestAnimationFrame(m))}};return f=requestAnimationFrame(m),()=>{d=!0,f&&cancelAnimationFrame(f)}}ensureOutgoing(e,t,n,r){if(!this.rasters.has(e)){let i=t.find(t=>t.index===e);i?.line?.fullText&&this.rasters.set(e,qn(i.line.fullText,n,r))}}disposeAll(){this.rasters.forEach(e=>e.texture.dispose()),this.rasters.clear()}},li=new J,ui=new J,di=new J,fi=({written:e,motePositions:t,sequencer:n,globalIndex:r,total:i,moteCircumference:o,moteRadial:s,seed:c})=>{let l=Math.max(0,i-1),d=!1;for(let i=r-2;i<=r+5;i+=1){let r=u(i);if(e[r]===i)continue;let f=Math.min(Math.max(i,0),l),p=De(n,f);p&&(a(t,D(p.frame,i-f),i,o,s,c),e[r]=i,d=!0)}return d},pi=({visibleLines:e,globalIndex:t,transitionOutgoingIndex:n,meshes:r,materials:i,rasters:a,camPos:o,fov:s,aspect:c,lyricsFontScale:l,damped:u})=>{e.forEach(({index:e,placement:d,isOutgoing:f})=>{if(e===t)return;let m=r.get(e),h=i.get(e),g=a.get(e);if(!m||!h||!g)return;let _=Vr(g.advancePx*(_r/g.fontPx),p,s,c)*d.scale*l;m.scale.setScalar(_);let v=Br(m.position.distanceTo(o));if(f)h.opacity=gr(e-(n??e))*v,h.color.copy(u.primary);else{let n=e-t;h.opacity=hr(n)*v,h.color.copy(n<0?u.primary:u.secondary)}})},mi=({activeLineUnits:e,planes:t,lightVals:n,soulVals:r,now:i,delta:a,life:o,breath:s,powerEnv:c,damped:l,keywordUnitColors:u,glowIntensity:d,soulIntensity:f,soulActiveEnabled:p,gradientIntensity:m})=>{let h=Math.min(1.5,m),g=Math.abs(l.accent.r-l.primary.r)+Math.abs(l.accent.g-l.primary.g)+Math.abs(l.accent.b-l.primary.b);if(li.copy(l.accent),g<.4){let e=1-g/.4,t=(l.primary.r+l.primary.g+l.primary.b)/3,n=(l.accent.r+l.accent.g+l.accent.b)/3,r=t>.5?n*(1-.5*e):n+(1-n)*.55*e;di.setRGB(r,r,r),li.lerp(di,e)}let _=Math.min(1,Math.max(0,(h-.1)/1.4));ui.copy(li).multiplyScalar(.8-.18*_),e.forEach((e,g)=>{let _=t.baseMats[g];if(!_||!n||!r)return;let v=i>=e.startTime&&i<e.endTime,y=i>=e.endTime,b=Math.max(e.endTime-e.startTime,.001),x=y?1:v?Mr((i-e.startTime)/b):0;n[g]=Nr(n[g],+!!v,14,4.5,a);let S=Lr(i,e)*h;_.opacity=Math.min(1,(wr+(Cr-wr)*x+.08*Math.min(1,S))*o);let ee=u.get(g)??(m>0?ui:li),C=m>0?S:n[g]*1.15;Rr(_.color,l.primary,ee,C);let te=Math.min(1.5,d),w=n[g]*o*s*(.6+.4*c)*te,T=t.glowMats[g],ne=t.glowMeshes[g];T&&(T.opacity=Math.min(1,Tr*w),T.color.copy(_.color)),ne&&(ne.visible=w>.012),r[g]=Nr(r[g],+!!v,12,2.2,a);let E=t.soulMats[g],D=t.soulMeshes[g];if(E&&D){let t=Math.min(1.5,f),n=y?Pr(Mr((i-e.endTime)/jr)):0,a=p?t:0,s=(1-n)*a,c=n*t;E.color.copy(_.color),E.opacity=Math.min(1,Er*o*r[g]*(s+c)),D.position.y=_r*(Dr*s+Or*c);let l=1+kr*s+Ar*c;D.scale.set(l,l,1),D.visible=E.opacity>.015}})},hi=({units:e,planes:t,primaryColor:n,accentColor:r})=>(0,$.jsx)($.Fragment,{children:e.map((e,i)=>(0,$.jsxs)(`group`,{ref:e=>{t.unitGroups[i]=e},children:[(0,$.jsxs)(`mesh`,{ref:e=>{t.glowMeshes[i]=e},visible:!1,position:[e.centerX,0,-.01],renderOrder:17,children:[(0,$.jsx)(`planeGeometry`,{args:[e.width,e.height]}),(0,$.jsx)(`meshBasicMaterial`,{ref:e=>{t.glowMats[i]=e},map:e.raster.glowTexture,transparent:!0,opacity:0,depthTest:!1,depthWrite:!1,blending:2,color:r})]}),(0,$.jsxs)(`mesh`,{ref:e=>{t.soulMeshes[i]=e},visible:!1,position:[e.centerX,0,-.005],renderOrder:18,children:[(0,$.jsx)(`planeGeometry`,{args:[e.width,e.height]}),(0,$.jsx)(`meshBasicMaterial`,{ref:e=>{t.soulMats[i]=e},map:e.raster.baseTexture,transparent:!0,opacity:0,depthTest:!1,depthWrite:!1,blending:2,color:r})]}),(0,$.jsxs)(`mesh`,{position:[e.centerX,0,0],renderOrder:19,children:[(0,$.jsx)(`planeGeometry`,{args:[e.width,e.height]}),(0,$.jsx)(`meshBasicMaterial`,{ref:e=>{t.baseMats[i]=e},map:e.raster.baseTexture,transparent:!0,opacity:wr,depthTest:!1,depthWrite:!1,color:n})]})]},i))}),gi=({theme:e,sequencer:t,globalIndex:n,transitionOutgoingIndex:i,currentTime:a,activeLineWidthRef:o,audioPower:s,audioBands:c,motion:l,showLyrics:u,showParticles:d,backgroundParticleCircumference:m,backgroundParticleRadial:h,geometryVisibility:g,particleDensity:_,particleScale:v,particleGlowEnabled:y,particleGlowIntensity:b,lyricsFontScale:x,glowIntensity:S,soulIntensity:ee,soulActiveEnabled:C,gradientIntensity:te,keywordColoringEnabled:w})=>{let T=(0,X.useRef)(new Map),ne=(0,X.useRef)(new Map),E=(0,X.useRef)(null),D=(0,X.useRef)(-1),re=(0,X.useRef)(null),O=(0,X.useRef)({baseMats:[],glowMats:[],glowMeshes:[],soulMats:[],soulMeshes:[],unitGroups:[]}),k=(0,X.useRef)(null),A=(0,X.useRef)(null),ae=(0,X.useRef)(-1),M=(0,X.useRef)(0),P=(0,X.useRef)(0),F=(0,X.useRef)(null),I=(0,X.useRef)(null),L=(0,X.useMemo)(()=>({primary:e.primaryColor,accent:e.accentColor||e.primaryColor,secondary:e.secondaryColor}),[e.primaryColor,e.accentColor,e.secondaryColor]),R=(0,X.useMemo)(()=>({primary:new J(L.primary),accent:new J(L.accent),secondary:new J(L.secondary),bg:new J(e.backgroundColor)}),[L,e.backgroundColor]),z=(0,X.useRef)(null),[ue,de]=(0,X.useState)(0);(0,X.useEffect)(()=>{let e=!0;return typeof document<`u`&&document.fonts?.ready&&document.fonts.ready.then(()=>{e&&de(e=>e+1)}),()=>{e=!1}},[]);let fe=(0,X.useMemo)(()=>oe(e),[e.fontStyle,e.fontFamily,ue]),pe=j(e,700),me=(0,X.useMemo)(()=>Bn(fe,pe),[fe,pe]),he=t.segments[t.segments.length-1]??null,B=Ee(t),V=he?.linesEpoch??0,ge=(0,X.useMemo)(()=>ni(n,i,B),[n,i,B]),H=(0,X.useMemo)(()=>ri(t,ge,n,i,l.weaveScale),[ge,t,V,i,n,l.weaveScale]),W=g.mode??`clouds`,K=(0,X.useMemo)(()=>ii(t,n,i,g,W),[g.enabled,W,n,i,t,V]),q=(0,X.useMemo)(()=>ai(t,ge,W,l,g,v),[W,ge,t,l.weaveScale,l.subMode,g,v]),Y=he?.key??`x`,_e=r(m),ve=f(h),xe=_e*ve,Se=(0,X.useMemo)(()=>new Float32Array(8*xe*3),[xe]),Ce=(0,X.useRef)(null),we=(0,X.useRef)([]);(0,X.useEffect)(()=>{we.current=[]},[_e,ve,Y]);let Te=`dust-${Y}-${_e}x${ve}`,Z=De(t,n)?.line??null,Oe=(0,X.useMemo)(()=>H.find(e=>e.index===n)??null,[H,n]),ke=(0,X.useMemo)(()=>Z?le(Z):[],[Z]),Q=(0,X.useMemo)(()=>oi(Z,ke),[Z,ke]),Ae=(0,X.useMemo)(()=>Mn(e.wordColors,w),[e.wordColors,w]),je=(0,X.useMemo)(()=>Nn(Z?.fullText??``,Q,Ae,R.primary,R.accent,R.bg),[Z,Q,Ae,R]),Me=(0,X.useMemo)(()=>si(Z,Q,me),[Z,Q,me]);(0,X.useEffect)(()=>{let e=Me;return()=>{e?.units.forEach(e=>{e.raster.baseTexture.dispose(),e.raster.glowTexture.dispose()})}},[Me]);let Ne=(0,X.useRef)(null);Ne.current||=new ci;let Pe=Ne.current,[,Fe]=(0,X.useState)(0);(0,X.useEffect)(()=>Pe.sync({visibleLines:H,globalIndex:n,fontSpec:me,fontStack:fe,fontWeight:pe,linesEpoch:V,onChange:()=>Fe(e=>e+1)}),[H,n,me,fe,pe,V,Pe]),(0,X.useEffect)(()=>()=>{Pe.disposeAll()},[Pe]),i!=null&&Pe.ensureOutgoing(i,H,fe,pe);let Ie=be(e=>e.scene);return(0,X.useEffect)(()=>{let e=Ie.fog;return Ie.fog=new G(R.bg.getHex(),12,30),()=>{Ie.fog=e}},[Ie]),ye((e,r)=>{z.current||={primary:R.primary.clone(),accent:R.accent.clone(),secondary:R.secondary.clone(),bg:R.bg.clone()};let u=z.current,f=1-Math.exp(-Sr*r);u.primary.lerp(R.primary,f),u.accent.lerp(R.accent,f),u.secondary.lerp(R.secondary,f),u.bg.lerp(R.bg,f);let m=e.scene.fog;m&&m.color.copy(u.bg);let h=l.audioLevel,g=Math.min(1,c.treble.get()/255)*h,_=Math.min(1,s.get()/255)*h,v=Nr(P.current,g,14,3.2,r);P.current=v;let y=Nr(M.current,_,18,3.5,r);M.current=y;let b=e.camera.position;if(d&&fi({written:we.current,motePositions:Se,sequencer:t,globalIndex:n,total:B,moteCircumference:_e,moteRadial:ve,seed:he?.seed})&&Ce.current&&(Ce.current.needsUpdate=!0),F.current){let t=e.clock.elapsedTime;F.current.position.set(Math.sin(t*.17)*.12,Math.sin(t*.11+1.7)*.09,Math.cos(t*.13)*.12)}I.current&&(I.current.size=.03*(1+.42*v),I.current.opacity=.16+.18*y,I.current.color.copy(u.secondary).lerp(u.accent,.3));let{camera:w}=e,j=w instanceof U?w.aspect:1,oe=w instanceof U?w.fov:55;pi({visibleLines:H,globalIndex:n,transitionOutgoingIndex:i,meshes:T.current,materials:ne.current,rasters:Pe.rasters,camPos:b,fov:oe,aspect:j,lyricsFontScale:x,damped:u});let L=E.current;if(zr(ae.current,n,k.current?.length,Q.length)){ae.current=n,k.current=new Float32Array(Q.length),A.current=new Float32Array(Q.length);let e=O.current;e.baseMats.length=Q.length,e.glowMats.length=Q.length,e.glowMeshes.length=Q.length,e.soulMats.length=Q.length,e.soulMeshes.length=Q.length,e.unitGroups.length=Q.length,D.current=-1}if(L&&Me&&Oe&&Z){let t=Vr(Me.lineWidth,p,oe,j)*Oe.placement.scale*x;L.scale.setScalar(t),o.current=Me.lineWidth*t;let n=Br(L.position.distanceTo(b)),i=a.get(),s=N().beats,c=ie();if(c&&re.current!==null&&s>re.current){let e=-1;Q.forEach((t,n)=>{t.startTime<=i&&(e=n)}),D.current=e}re.current=s;let l=c?rr(se.get(),ce.get()):0;O.current.unitGroups.forEach((e,t)=>{if(!e)return;let n=Me.units[t],r=t===D.current&&n?l*n.height:0;e.position.y!==r&&(e.position.y=r)});let d=.9+.1*Math.sin(e.clock.elapsedTime*1.9);mi({activeLineUnits:Q,planes:O.current,lightVals:k.current,soulVals:A.current,now:i,delta:r,life:n,breath:d,powerEnv:y,damped:u,keywordUnitColors:je,glowIntensity:S,soulIntensity:ee,soulActiveEnabled:C,gradientIntensity:te})}else o.current=0}),(0,$.jsxs)(`group`,{children:[d&&(0,$.jsxs)(`points`,{ref:F,frustumCulled:!1,children:[(0,$.jsx)(`bufferGeometry`,{children:(0,$.jsx)(`bufferAttribute`,{ref:Ce,attach:`attributes-position`,args:[Se,3]})}),(0,$.jsx)(`pointsMaterial`,{ref:I,size:.03,sizeAttenuation:!0,transparent:!0,opacity:.2,depthWrite:!1,color:L.secondary,blending:1})]},Te),(W===`corridor`?K.length>0:q.length>0)&&(0,$.jsx)(mr,{mode:W,clusters:q,corridorSpans:K,density:_,particleGlowEnabled:y,particleGlowIntensity:b,currentTime:a,audioPower:s,audioBands:c,audioLevel:l.audioLevel,primaryColor:L.primary,accentColor:L.accent,secondaryColor:L.secondary,backgroundColor:e.backgroundColor,transitionActive:i!=null,readHeadLine:n,resetKey:Y}),u&&H.map(({index:e,line:t,position:r,quaternion:a,isOutgoing:o})=>{if(!t?.fullText||e===n)return null;let s=e-n,c=o?gr(e-(i??e)):hr(s);if(c<=0)return null;let l=Pe.get(e);if(!l)return null;let u=.62/l.fontPx,d=o||s<0?L.primary:L.secondary;return(0,$.jsxs)(`mesh`,{ref:t=>{t?T.current.set(e,t):T.current.delete(e)},position:r,quaternion:a,renderOrder:0,children:[(0,$.jsx)(`planeGeometry`,{args:[l.canvasWidthPx*u,l.canvasHeightPx*u]}),(0,$.jsx)(`meshBasicMaterial`,{ref:t=>{t?ne.current.set(e,t):ne.current.delete(e)},map:l.texture,transparent:!0,opacity:c,depthWrite:!1,color:d})]},e)}),u&&Z?.fullText&&Oe&&Me&&(0,$.jsx)(`group`,{ref:E,position:Oe.position,quaternion:Oe.quaternion,children:(0,$.jsx)(hi,{units:Me.units,planes:O.current,primaryColor:L.primary,accentColor:L.accent})},n)]})},_i=4,vi=1,yi=96,bi=5,xi=()=>{let e=[];for(let t=0;t<yi;t+=1){let n=Math.floor(t/4),r=n%3==2;e.push({words:[],startTime:t*bi,endTime:(t+1)*bi,fullText:``,blockIndex:n,songPart:r?`chorus`:`verse`,isChorus:r})}return e},Si=2,Ci=8e3,wi=({onDrawn:e})=>{let t=(0,X.useRef)(`not yet`),n=(0,X.useRef)(0),r=(0,X.useRef)(!0);return(0,X.useEffect)(()=>()=>{r.current=!1},[]),ye(({gl:i,scene:a,camera:o})=>{if(t.current===`not yet`){t.current=`started`;let e=i.compile(a,o),n=()=>{if(!r.current)return;let a=performance.now();for(let t of e){let{currentProgram:n}=i.properties.get(t);if(n&&!n.isReady()||(n?.getUniforms(),e.delete(t),performance.now()-a>4))break}e.size===0?t.current=`done`:window.setTimeout(n,10)};n()}t.current===`done`&&(i.render(a,o),n.current+=1,n.current===2&&e())},1),null},Ti=e=>{let{currentTime:t,currentLineIndex:r,lines:i,theme:a,subtitleTheme:o,audioPower:s,audioBands:c,showText:l=!0,lyricsFontScale:u=1,subtitleFontScale:d=1,subtitleOverlayOpacity:f,subtitleOverlayBackground:p,subtitleUpcomingLyricsBlur:m,isPlayerChromeHidden:h=!1,hideTranslationSubtitle:g=!1,subtitleContentMode:_,seed:v,dioramaTuning:y}=e,{t:b}=I(),S=P(),{activeLine:C,recentCompletedLine:te,nextLines:w}=fe({currentTime:t,currentLineIndex:r,lines:i}),T=(0,X.useRef)(0),ne=(0,X.useMemo)(()=>ee(y,a.animationIntensity),[y,a.animationIntensity]),[E,D]=(0,X.useState)(()=>({seed:v,lines:i})),O=(0,X.useRef)(i);O.current=i;let k=i.length===0?``:`${i.length}|${i[0]?.fullText??``}`,ie=E.lines.length===0?``:`${E.lines.length}|${E.lines[0]?.fullText??``}`;(0,X.useEffect)(()=>{if(v===E.seed){k!==ie&&D({seed:v,lines:O.current});return}if(k!==``){D({seed:v,lines:O.current});return}let e=0,n=!1,r=performance.now(),i=()=>{let a=t.get(),o=performance.now()-r>=Ci;if(!n&&a<1&&(n=!0),n&&a>=Si||o){D({seed:v,lines:O.current});return}e=requestAnimationFrame(i)};return e=requestAnimationFrame(i),()=>cancelAnimationFrame(e)},[v,k,E.seed,ie,t]);let A=E.seed,ae=E.lines,j=ae.length===0,oe=(0,X.useMemo)(()=>xi(),[A]),M=j?oe:ae,N=(0,X.useRef)(0),[se,ce]=(0,X.useState)(0),L=(0,X.useRef)(void 0);(0,X.useEffect)(()=>{if(!j)return;N.current=0,ce(0),L.current=A;let e=0,n=()=>{let r=t.get(),i=Math.min(Math.max(Math.floor(r/bi),0),95);i!==N.current&&(N.current=i,ce(i)),e=requestAnimationFrame(n)};return e=requestAnimationFrame(n),()=>cancelAnimationFrame(e)},[j,A,t]);let le=L.current===A?se:0,R=!j&&r>=0&&!!ae[r]&&de(ae[r]),z=j?le:R?-1:r,ue=(0,X.useRef)(Se()),B=(0,X.useRef)(0),V=(0,X.useRef)(!1),ge=(0,X.useRef)(null),H=(0,X.useRef)(0),[U,W]=(0,X.useState)(null),G=ue.current,K=Ce(G),q=K?Math.min(Math.max(B.current,0),K.span-1):0,J=K?K.globalStart+q:0,Y=!K||K.seed!==A,_e=!Y&&!!K&&K.lines!==M,ve=!!K&&!Y&&z>=0&&z<=vi&&B.current>z;if(Y){let e={x:0,y:0,z:0};if(K){let t=n(K.frames,q).position,r=Pe(A??`diorama`,H.current+1);e={x:t.x+r.x,y:t.y+r.y,z:t.z+r.z}}we(G,{seed:A??`diorama`,lines:M,round:0,placementOrigin:e})}else _e&&Te(G,M);let ye=Ce(G),be=ye.key!==ge.current,Ee=ge.current!==null;be&&(ge.current=ye.key,B.current=0,V.current=!1),ve&&(B.current=0,V.current=!1);let De=be&&Ee||ve;De&&(H.current+=1,console.log(`[Diorama] camera flight #${H.current}: ${Y?`new song`:`loop restart`}, seed ${String(A??`none`)}, leaving line ${J}`),W({epoch:H.current,outgoingIndex:J})),z>=0&&(B.current=z,V.current=!0);let ke=z>=0?z:B.current,Q=Math.min(Math.max(ke,0),Math.max(ye.span-1,0)),Ae=ye.globalStart+Q,je=De?J:U?U.outgoingIndex:null;Z(G,(je==null?Ae:Math.min(Ae,je))-_i),(0,X.useEffect)(()=>{if(!U)return;let e=window.setTimeout(()=>W(null),Oe*1e3);return()=>window.clearTimeout(e)},[U]);let Me=l&&!C&&!V.current,Ne=`clamp(${(1.5*u).toFixed(3)}rem, ${(3.5*u).toFixed(3)}vw, ${(2.25*u).toFixed(3)}rem)`,{translationFontSize:Fe,upcomingFontSize:Ie}=he(u);return(0,$.jsxs)(pe,{theme:a,audioPower:s,audioBands:c,sharedProps:e,children:[(0,$.jsx)(`div`,{className:`absolute inset-0 z-0`,children:(0,$.jsxs)(xe,{camera:{position:[0,.6,9],fov:55},dpr:[1,2],gl:{alpha:!0,antialias:!0},resize:{offsetSize:!0},style:{background:`transparent`},children:[(0,$.jsx)(wi,{onDrawn:S}),(0,$.jsx)(at,{currentTime:t,sequencer:G,globalIndex:Ae,activeLineWidthRef:T,motion:ne,transitionEpoch:H.current}),(0,$.jsx)(gi,{theme:a,sequencer:G,globalIndex:Ae,transitionOutgoingIndex:U?.outgoingIndex??null,currentTime:t,activeLineWidthRef:T,audioPower:s,audioBands:c,motion:ne,showLyrics:l,geometryVisibility:y?.geometryVisibility??x.geometryVisibility,particleDensity:y?.particleDensity??x.particleDensity,particleScale:y?.particleScale??x.particleScale,particleGlowEnabled:y?.particleGlowEnabled??x.particleGlowEnabled,particleGlowIntensity:y?.particleGlowIntensity??x.particleGlowIntensity,showParticles:y?.showParticles??!0,backgroundParticleCircumference:y?.backgroundParticleCircumference??x.backgroundParticleCircumference,backgroundParticleRadial:y?.backgroundParticleRadial??x.backgroundParticleRadial,lyricsFontScale:u,glowIntensity:y?.glowEnabled??x.glowEnabled?y?.glowIntensity??x.glowIntensity:0,soulIntensity:y?.soulEnabled??x.soulEnabled?y?.soulIntensity??x.soulIntensity:0,soulActiveEnabled:(y?.soulEnabled??x.soulEnabled)&&(y?.soulActiveEnabled??x.soulActiveEnabled),gradientIntensity:y?.gradientEnabled??x.gradientEnabled?y?.gradientIntensity??x.gradientIntensity:0,keywordColoringEnabled:y?.keywordColoringEnabled??x.keywordColoringEnabled})]})}),(0,$.jsx)(`div`,{className:`relative z-10 w-full h-[70vh] flex items-end justify-center p-8 pointer-events-none`,children:(0,$.jsx)(F,{mode:`wait`,children:Me?(0,$.jsx)(re.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:`text-2xl opacity-50 absolute`,style:{color:a.secondaryColor,fontSize:Ne},children:b(`ui.waitingForMusic`)},`diorama-empty`):null})}),(0,$.jsx)(me,{showText:l,activeLine:C,recentCompletedLine:te,nextLines:w,theme:a,subtitleTheme:o,translationFontSize:Fe,upcomingFontSize:Ie,subtitleOverlayOpacity:f,subtitleOverlayBackground:p,subtitleUpcomingLyricsBlur:m,subtitleFontScale:d,isPlayerChromeHidden:h,hideTranslationSubtitle:g,subtitleContentMode:_})]})};export{Ti as default};