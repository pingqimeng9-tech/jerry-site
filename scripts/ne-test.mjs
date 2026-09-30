// Notion 编辑器增强交互验证：node scripts/ne-test.mjs
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const LOG = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/ne-test-log.txt';
fs.writeFileSync(LOG, 'start ' + new Date().toISOString() + '\n');
const log = (...a) => { fs.appendFileSync(LOG, a.join(' ') + '\n'); };
const killAll = () => { try { chrome.kill(); } catch (e) {} setTimeout(() => process.exit(0), 300); };
setTimeout(() => { log('GLOBAL TIMEOUT'); killAll(); }, 45000);

const PORT = 9500 + Math.floor(Math.random() * 200);
const ud = path.join(os.tmpdir(), 'chrome-cdp-ne-' + Date.now());
const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`, '--window-size=1500,1000', 'about:blank'],
  { stdio: 'ignore' });

async function getWS() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const t = list.find(x => x.type === 'page');
      if (t?.webSocketDebuggerUrl) return t.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('CDP not ready');
}
const ws = new WebSocket(await getWS());
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
ws.onerror = e => log('WS ERROR', e.message || '');
await new Promise(r => ws.onopen = r);
log('ws open');
const send = (method, params = {}) => { const mid = ++id; ws.send(JSON.stringify({ id: mid, method, params })); return new Promise(r => pending.set(mid, r)); };
const js = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) log('JS ERROR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 500));
  return r.result?.value;
};
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(SHOT + name, Buffer.from(s.data, 'base64')); log('saved', name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  await send('Page.enable'); log('page enabled');
  await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html' });
  log('navigated');
  await sleep(3500);
  log('wordbar: ' + await js(`!!document.querySelector('.ne-wordbar')`));
  log('grip: ' + await js(`!!document.querySelector('.ne-grip')`));

  await js(`document.getElementById('body').focus(); document.execCommand('insertHTML', false, '<p>测试段落一</p><p><br></p>'); var ps=document.querySelectorAll('#body p'); var r=document.createRange(); r.setStart(ps[1],0); r.collapse(true); var s=getSelection(); s.removeAllRanges(); s.addRange(r);`);
  log('caret set');
  await send('Input.insertText', { text: '/' });
  await sleep(400);
  log('slash menu open: ' + await js(`document.querySelector('.ne-menu').classList.contains('open')`));
  await shot('ne-1-slash.png');

  await send('Input.insertText', { text: '代码' });
  await sleep(300);
  log('slash items: ' + await js(`document.querySelectorAll('.ne-menu .ne-item').length`));
  await shot('ne-2-slash-filter.png');
  await js(`document.getElementById('body').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));`);

  await js(`var b=document.getElementById('body'); b.innerHTML=''; window.__ne.insertCallout('tip');`);
  await sleep(150);
  await js(`window.__ne.insertCallout('warning');`);
  await sleep(100);
  await js(`window.__ne.insertToggle();`);
  await sleep(100);
  await js(`window.__ne.insertCodeBlock('python');`);
  await sleep(100);
  await js(`window.__ne.insertToc();`);
  await sleep(200);
  await js(`var b=document.getElementById('body'); var p=document.createElement('p'); p.textContent='正文段落，测试字数统计与块手柄。'; b.appendChild(p); var h=document.createElement('h2'); h.textContent='一个二级标题'; b.appendChild(h); var h3=document.createElement('h3'); h3.textContent='三级小节'; b.appendChild(h3); window.__ne.refreshToc();`);
  log('wordbar: ' + await js(`document.querySelector('.ne-wordbar').textContent`));
  log('callout: ' + await js(`document.querySelectorAll('#body .callout').length`));
  log('details: ' + await js(`document.querySelectorAll('#body details').length`));
  log('toc items: ' + await js(`document.querySelectorAll('#body .toc-block li').length`));
  await shot('ne-3-blocks.png');

  const md = await js(`htmlToMd(document.getElementById('body'))`);
  fs.writeFileSync(SHOT + 'ne-md-output.txt', md, 'utf8');
  log('md head: ' + md.slice(0, 200).replace(/\n/g, ' | '));
  const rt = await js(`(function(){ var m=htmlToMd(document.getElementById('body')); var h=mdToHtml(m); var d=document.createElement('div'); d.innerHTML=h; return JSON.stringify({callout:d.querySelectorAll('.callout').length, details:d.querySelectorAll('details').length, toc:/toc-block/.test(h), code:/language-python/.test(h)}); })()`);
  log('roundtrip: ' + rt);

  await js(`var p=document.createElement('p'); p.textContent='选中这一段文字测试浮动工具条'; document.getElementById('body').appendChild(p); p.scrollIntoView(); var r=document.createRange(); r.setStart(p.firstChild,0); r.setEnd(p.firstChild,5); var s=getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange'));`);
  await sleep(300);
  log('inline bar: ' + await js(`document.querySelector('.ne-inline').classList.contains('open')`));
  await shot('ne-4-inline-bar.png');
  log('DONE');
} catch (e) {
  log('FATAL', e.message, e.stack);
}
killAll();
