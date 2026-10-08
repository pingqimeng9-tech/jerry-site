/* ─── 9 Vocal Orb ─── */
window.__JERRY_REGISTER_TEMPLATE({id:'orb',name:'Vocal Orb',cat:'3D',mat:'着色器',
spell:'一个会听的黑洞：点麦克风，它随你的声音起伏；不说话时几乎熄灭。',core:'画面里没有图片，只有一个着色器',tags:['3D','WebGL','Audio','Shader'],
credit:{n:'Vocal Orb',u:'https://carterogunsola.com/lab/vocal-orb'},
notes:['没有贴图也没有模型，只有一个片元着色器：每个像素让光线被引力“弯”一下。上方的亮弧、下方的暗环、中间一圈细亮的边都是这个弯曲算出来的。原作是更完整的光线追踪；这里是我写的简化近似，视觉相似，但不是物理精确。','熄灭时轨道只剩四分之一的速度、光变成暖灰、球体变钝；开麦克风时用一个会过冲约 12% 的弹簧唤醒，停下后约 1.5 秒无回弹地回到熄灭。','麦克风的音量与低、中、高频每帧被测量，并跟最近的响度比较，所以安静的笔记本麦克风和嘈杂的房间都有反应。音频只在浏览器内处理，没有上传。','没有麦克风权限或在预览里时，会用模拟的说话节奏演示。原作的字幕、情绪着色、变声回放我没有实现。'],
knobs:[{k:'REST',label:'REST 熄灭程度',v:.8,min:0,max:1,step:.05},{k:'SENS',label:'SENS 灵敏度',v:1,min:.3,max:3,step:.1}],
css:`.ob2{background:#050505;color:#eee}.ob2 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ob2-mic{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:2;font:11px var(--mono);padding:8px 16px;border:1px solid #ffffff55;border-radius:99px;color:#eee;background:#0008}
.ob2-mic[aria-pressed=true]{background:#eee;color:#050505}
.ob2-msg{position:absolute;left:0;right:0;top:14px;text-align:center;font:10px var(--mono);opacity:.5;pointer-events:none}`,
mount(h,ctx){
  const P=ctx.P;
  h.innerHTML=`<div class="stg ob2"><canvas></canvas><div class="ob2-msg">SLEEPING</div><button class="ob2-mic" aria-pressed="false">● 开启麦克风</button></div>`;
  const root=$('.ob2',h),cv=$('canvas',h),btn=$('.ob2-mic',h),msg=$('.ob2-msg',h);
  const dpr=Math.min(devicePixelRatio||1,1.5);cv.width=Math.max(2,root.clientWidth*dpr);cv.height=Math.max(2,root.clientHeight*dpr);
  const gl=cv.getContext('webgl2',{antialias:false});
  if(!gl){msg.textContent='此浏览器不支持 WebGL2';btn.hidden=true;return}
  const vs=`#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const fs=`#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;uniform float uT,uAw,uLvl,uLow,uMid,uHigh,uRest;uniform vec2 uCam;
float ring(float r,float r0,float w){float x=(r-r0)/w;return exp(-x*x);}
vec3 spec(float x){return clamp(vec3(abs(x*6.-3.)-1.,2.-abs(x*6.-2.),2.-abs(x*6.-4.)),0.,1.);}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  p+=uCam*vec2(-.012,.008);
  float r=length(p);
  float rs=.115;
  float k=rs*rs/(r*r+.0008);
  vec2 q=p*(1.+1.6*k);
  float tilt=.04+uCam.y*.018;
  float dr=abs(q.x);
  float band=exp(-pow(q.y/(tilt*(1.+.7*smoothstep(0.,.5,dr))),2.));
  float diskR=smoothstep(rs*1.2,rs*1.8,dr)*exp(-(dr-rs*1.2)*3.2);
  float dop=.62+.55*smoothstep(-.4,.4,-q.x);
  float disk=band*diskR*dop*(1.+uLvl*1.2+uLow*.6);
  float wob=1.+.1*uLow*uAw;
  float arc=ring(r,rs*1.72*wob,.012+.012*k);
  arc*=mix(.3,1.,smoothstep(-.1,.45,p.y/max(r,1e-3)));
  float halo=ring(r,rs*1.03,.0055);
  float glow=exp(-pow((r-rs)/.085,2.))*.32;
  float I=disk*1.25+arc*.95+halo*2.1+glow;
  float ember=mix(1.,1.-uRest,1.-uAw);
  I*=ember*(.85+.4*uAw);
  vec3 warm=mix(vec3(.82,.72,.62),vec3(1.,.97,.93),uAw);
  vec3 col=warm*I+vec3(.05,.04,.1)*uHigh*arc;
  col*=smoothstep(rs*.97,rs*1.0,r);
  float ro=.04;
  if(r<ro*1.4){
    vec2 n=p/ro;float z=sqrt(max(0.,1.-dot(n,n)));vec3 nn=vec3(n,z);
    float dif=clamp(dot(nn,normalize(vec3(-.4,.6,.7))),0.,1.);
    vec3 silver=vec3(.42)*(.35+.65*dif);
    float fres=pow(1.-z,2.4);
    vec3 glass=vec3(.05)+vec3(1.)*dif*.4+spec(fract(r/ro*1.3+uT*.05))*fres*1.3;
    float w=sin(r*220.-uT*6.+uLvl*10.)*uLvl*.25*smoothstep(ro,0.,r);
    vec3 orb=mix(silver,glass,uAw)+w;
    col=mix(col,orb,smoothstep(ro*1.02,ro*.96,r));
  }
  col=col/(1.+col*.5);
  o=vec4(pow(col,vec3(.9)),1.);
}`;
  const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(x));return null}return x};
  const pr=gl.createProgram();const a=sh(gl.VERTEX_SHADER,vs),b=sh(gl.FRAGMENT_SHADER,fs);
  if(!a||!b){msg.textContent='着色器编译失败';return}
  gl.attachShader(pr,a);gl.attachShader(pr,b);gl.linkProgram(pr);gl.useProgram(pr);
  const U=n=>gl.getUniformLocation(pr,n);const u={res:U('uRes'),t:U('uT'),aw:U('uAw'),lvl:U('uLvl'),low:U('uLow'),mid:U('uMid'),high:U('uHigh'),rest:U('uRest'),cam:U('uCam')};
  gl.viewport(0,0,cv.width,cv.height);
  let awake=false,aw=0,av=0,lvl=0,low=0,mid=0,high=0,avg=.02,cam=[0,0],camT=[0,0],t=0,an=null,data=null,fdata=null,stream=null,ac=null,sim=0;
  root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();camT=[(e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1]});
  async function mic(){
    if(awake&&stream){stream.getTracks().forEach(t=>t.stop());stream=null;awake=false;btn.setAttribute('aria-pressed','false');btn.textContent='● 开启麦克风';msg.textContent='SLEEPING';return}
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});ac=ac||new(window.AudioContext||window.webkitAudioContext)();an=ac.createAnalyser();an.fftSize=1024;ac.createMediaStreamSource(stream).connect(an);data=new Uint8Array(an.fftSize);fdata=new Uint8Array(an.frequencyBinCount);awake=true;btn.setAttribute('aria-pressed','true');btn.textContent='■ 停止';msg.textContent='LISTENING'}
    catch(e){msg.textContent='无法使用麦克风 · 改用模拟';awake=!awake;sim=awake?1:0;btn.setAttribute('aria-pressed',String(awake));btn.textContent=awake?'■ 停止':'● 开启麦克风'}
  }
  btn.addEventListener('click',mic);
  const stop=ticker((dt)=>{
    t+=dt;
    let tl=0,tlow=0,tmid=0,thigh=0;
    if(an&&awake){an.getByteTimeDomainData(data);let s=0;for(let i=0;i<data.length;i++){const v=(data[i]-128)/128;s+=v*v}const rms=Math.sqrt(s/data.length);avg=damp(avg,rms,.5,dt);tl=clamp((rms/(avg*2+.01)-.35)*.9,0,1)*clamp(rms*40,0,1)*P.SENS;
      an.getByteFrequencyData(fdata);const m=fdata.length,sm=(a0,b0)=>{let x=0;for(let i=a0;i<b0;i++)x+=fdata[i];return x/((b0-a0)*255)};tlow=sm(1,m*.06|0);tmid=sm(m*.06|0,m*.3|0);thigh=sm(m*.3|0,m*.7|0)}
    else if((ctx.auto||sim)&&awake){const e=Math.max(0,Math.sin(t*2.1)*Math.sin(t*.7+1));tl=e*(.5+.5*Math.sin(t*9));tlow=e*.6;tmid=e*.4;thigh=e*.3}
    if(ctx.auto&&Math.floor(t/5)!==Math.floor((t-dt)/5)){awake=!awake;msg.textContent=awake?'LISTENING':'SLEEPING'}
    lvl=damp(lvl,tl,14,dt);low=damp(low,tlow*P.SENS,10,dt);mid=damp(mid,tmid,10,dt);high=damp(high,thigh,10,dt);
    const tg=awake?1:0,kk=awake?120:20,cc=awake?2*.55*Math.sqrt(120):2*Math.sqrt(20);
    av+=(kk*(tg-aw)-cc*av)*dt;aw+=av*dt;
    cam[0]=damp(cam[0],camT[0],4,dt);cam[1]=damp(cam[1],camT[1],4,dt);
    gl.uniform2f(u.res,cv.width,cv.height);gl.uniform1f(u.t,t*(awake?1:.25+.75*Math.max(0,aw)));gl.uniform1f(u.aw,clamp(aw,0,1.2));gl.uniform1f(u.lvl,lvl);gl.uniform1f(u.low,low);gl.uniform1f(u.mid,mid);gl.uniform1f(u.high,high);gl.uniform1f(u.rest,P.REST);gl.uniform2f(u.cam,cam[0],cam[1]);
    gl.drawArrays(gl.TRIANGLES,0,3);
  });
  ctx.status('SLEEP');
  return()=>{stop();if(stream)stream.getTracks().forEach(t=>t.stop());if(ac)try{ac.close()}catch(e){}};
}});
