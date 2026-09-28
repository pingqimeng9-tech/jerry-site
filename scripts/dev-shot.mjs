// 开发用 CDP 延时截图：node scripts/dev-shot.mjs <url> <out.png> [waitMs=5000] [w=1500] [h=1000]
const [,, url, out, waitMs='5000', W='1500', H='1000'] = process.argv;
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const PORT = 9300 + Math.floor(Math.random()*200);
const ud = path.join(os.tmpdir(), 'chrome-cdp-'+Date.now());
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new','--disable-gpu',`--remote-debugging-port=${PORT}`,`--user-data-dir=${ud}`,`--window-size=${W},${H}`,'about:blank'],
  { stdio:'ignore' });

async function getWS(){
  for(let i=0;i<40;i++){
    try{
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const t = list.find(x=>x.type==='page');
      if(t?.webSocketDebuggerUrl) return t.webSocketDebuggerUrl;
    }catch(e){}
    await new Promise(r=>setTimeout(r,300));
  }
  throw new Error('CDP not ready');
}
const ws = new WebSocket(await getWS());
let id=0; const pending=new Map();
ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
const send=(method,params={})=>{const mid=++id;ws.send(JSON.stringify({id:mid,method,params}));return new Promise(r=>pending.set(mid,r));};
await send('Page.enable');
await send('Page.navigate',{url});
await new Promise(r=>setTimeout(r,Number(waitMs)));
const shot=await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync(out,Buffer.from(shot.data,'base64'));
console.log('saved',out);
chrome.kill(); process.exit(0);
