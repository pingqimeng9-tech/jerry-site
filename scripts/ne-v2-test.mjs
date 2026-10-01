// 第四批功能实测：字号斜杠 / Ctrl+Alt 标题 / 右键菜单 / 图片圈画标注
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const LOG = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/ne-v2-log.txt';
fs.writeFileSync(LOG, 'start\n');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const PORT = 9847;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(os.tmpdir(), 'chrome-v2-' + Date.now())}`, '--window-size=1500,1100', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'ignore'] });

async function getWS() {
  for (let i = 0; i < 40; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const t = list.find(x => x.type === 'page'); if (t?.webSocketDebuggerUrl) return t.webSocketDebuggerUrl; } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('CDP not ready');
}
const ws = new WebSocket(await getWS());
let mid = 0; const pending = new Map();
ws.onmessage = async (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Page.javascriptDialogOpening') { log('DIALOG:', m.params.message); await send('Page.handleJavaScriptDialog', { accept: true, promptText: '测试标注文字' }); return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => { const i = ++mid; ws.send(JSON.stringify({ id: i, method, params })); return new Promise(r => pending.set(i, r)); };
const js = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) log('JS ERROR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 500)); return r.result?.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const press = async (key, mods) => {
  mods = mods || {};
  const kc = { Control: 17, Alt: 18, Shift: 16, Enter: 13 }[key] || 0;
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code: key.length === 1 ? 'Digit' + key : key, windowsVirtualKeyCode: kc, modifiers: (mods.ctrl ? 2 : 0) | (mods.alt ? 1 : 0) | (mods.shift ? 8 : 0) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key.length === 1 ? 'Digit' + key : key, windowsVirtualKeyCode: kc, modifiers: 0 });
};
const typeText = async t => { await send('Input.insertText', { text: t }); };
const shot = async n => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(SHOT + n, Buffer.from(s.data, 'base64')); log('shot ' + n); };
const mouse = async (type, x, y, button) => {
  await send('Input.dispatchMouseEvent', { type, x, y, button: button || 'left', buttons: type === 'mouseReleased' ? 0 : (button === 'right' ? 2 : 1), clickCount: 1 });
};

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' :: ' + extra : '')); cond ? pass++ : fail++; };

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html?id=new' });
await sleep(3500);

// 聚焦首个空段落
await js(`(function(){var b=document.getElementById('body'); b.innerHTML='<p>\\u200B</p>'; var r=document.createRange(); r.setStart(b.firstChild.firstChild,0); r.collapse(true); var s=getSelection(); s.removeAllRanges(); s.addRange(r); b.focus();})()`);

// ===== 1. 空行斜杠选"大字"，后续输入应为 24px =====
await typeText('/');
await sleep(400);
await typeText('大字');
await sleep(400);
const menuTxt = await js(`document.querySelector('.ne-menu.open')?document.querySelector('.ne-menu.open').innerText:''`);
log('slash menu: ' + String(menuTxt).replace(/\n/g, '|').slice(0, 120));
await press('Enter');
await sleep(300);
await typeText('这是大号文字');
await sleep(300);
const fontCheck = await js(`(function(){var s=document.querySelector('#body span[style*="font-size"]'); return s?JSON.stringify({size:s.style.fontSize,text:s.textContent}):'NO-SPAN';})()`);
ok('空行斜杠字号→后续输入24px', /24px/.test(String(fontCheck)) && /大号文字/.test(String(fontCheck)), String(fontCheck));
await shot('ne-v2-1-font.png');

// ===== 2. Ctrl+Alt+2 转 h2 =====
await js(`(function(){var b=document.getElementById('body'); var p=document.createElement('p'); p.textContent='\\u200B这是快捷键标题'; b.appendChild(p); var r=document.createRange(); r.selectNodeContents(p); r.collapse(true); var s=getSelection(); s.removeAllRanges(); s.addRange(r); b.focus();})()`);
await press('2', { ctrl: true, alt: true });
await sleep(300);
const h2check = await js(`(function(){var hs=[...document.querySelectorAll('#body h2')]; return hs.length?hs[hs.length-1].tagName:'NO-H2';})()`);
ok('Ctrl+Alt+2 转二级标题', h2check === 'H2', String(h2check));

// ===== 3. 右键菜单接管（块上右键，出现自定义菜单且含"转成"）=====
const rect = await js(`(function(){var p=document.querySelector('#body h2')||document.querySelector('#body p'); var r=p.getBoundingClientRect(); return JSON.stringify({x:r.x+30,y:r.y+8});})()`);
const rp = JSON.parse(rect);
await mouse('mousePressed', rp.x, rp.y, 'right');
await mouse('mouseReleased', rp.x, rp.y, 'right');
await sleep(400);
const ctxCheck = await js(`(function(){var m=document.querySelector('.ne-menu.open'); return m?m.innerText.replace(/\\n/g,'|'):'NO-MENU';})()`);
ok('右键出现自定义菜单（含转成/字号）', /转成/.test(ctxCheck), String(ctxCheck).slice(0, 150));
await shot('ne-v2-2-ctx.png');
await js(`document.querySelectorAll('.ne-menu').forEach(m=>m.classList.remove('open'))`);

// ===== 4. 图片圈画标注 =====
await js(`(function(){var b=document.getElementById('body'); var p=document.createElement('p'); var im=document.createElement('img'); im.id='annoTarget'; im.style.width='70%'; im.src='/images/posts/1787910185816.jpg?cb='+Date.now(); p.appendChild(im); b.appendChild(p); return 'added';})()`);
await sleep(2500); // 等图片加载
await js(`window.openImageAnnotator(document.getElementById('annoTarget'))`);
await sleep(1500);
const cvRect = await js(`(function(){var c=document.querySelector('.ne-anno-overlay.open canvas'); if(!c) return 'NO-CANVAS'; var r=c.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height});})()`);
ok('标注器打开且 canvas 就绪', /^{/.test(String(cvRect)), String(cvRect));
if (/^{/.test(String(cvRect))) {
  const c = JSON.parse(cvRect);
  // 箭头：从 (20%,20%) 拖到 (65%,65%)
  const P = (fx, fy) => [c.x + c.w * fx, c.y + c.h * fy];
  let [x1, y1] = P(0.2, 0.2); let [x2, y2] = P(0.65, 0.65);
  await mouse('mousePressed', x1, y1);
  for (let i = 1; i <= 6; i++) { await mouse('mouseMoved', x1 + (x2 - x1) * i / 6, y1 + (y2 - y1) * i / 6); }
  await mouse('mouseReleased', x2, y2);
  await sleep(200);
  // 切到椭圆工具
  await js(`[...document.querySelectorAll('.ne-anno-overlay [data-tool]')].find(b=>b.dataset.tool==='ellipse').click()`);
  [x1, y1] = P(0.1, 0.55); [x2, y2] = P(0.5, 0.9);
  await mouse('mousePressed', x1, y1);
  for (let i = 1; i <= 6; i++) { await mouse('mouseMoved', x1 + (x2 - x1) * i / 6, y1 + (y2 - y1) * i / 6); }
  await mouse('mouseReleased', x2, y2);
  await sleep(200);
  // 文字工具：点击 canvas（prompt 自动应答）
  await js(`[...document.querySelectorAll('.ne-anno-overlay [data-tool]')].find(b=>b.dataset.tool==='text').click()`);
  [x1, y1] = P(0.12, 0.12);
  await mouse('mousePressed', x1, y1); await mouse('mouseReleased', x1, y1);
  await sleep(500);
  const strokeN = await js(`(function(){var d=Object.keys(window).filter(k=>/anno/i.test(k)); return 'overlay-open:'+!!document.querySelector('.ne-anno-overlay.open');})()`);
  await shot('ne-v2-3-annotate.png');
  // 完成（触发上传）
  await js(`document.querySelector('#abDone').click()`);
  await sleep(4000);
  const newSrc = await js(`document.getElementById('annoTarget').src`);
  ok('圈画完成→图片替换为上传的标注图', /annotated-|data:image\/png/.test(String(newSrc)), String(newSrc).slice(0, 120));
  log('new img src: ' + String(newSrc).slice(0, 160));
  await shot('ne-v2-4-annotated.png');
}

// ===== 5. 保存草稿并重开，字号 span 往返 =====
await js(`document.getElementById('title').value='v2功能测试（字号快捷键圈画）';`);
const saveR = await js(`(async function(){ try{ const r=await save('draft', true); return JSON.stringify({ok:!!doc.id,id:doc.id}); }catch(e){ return 'SAVE-ERR '+e.message; } })()`);
log('SAVE ' + saveR);
const saveId = JSON.parse(saveR).id;
await js(`(function(){var b=document.getElementById('body'); return JSON.stringify({span:!!b.querySelector('span[style*="font-size"]'), emptySpan:[...b.querySelectorAll('span[style*="font-size"]')].filter(s=>!s.textContent.replace(/\\u200b/g,'').trim()).length});})()`).then(v => log('before-save ' + v));
// 重新加载文章
await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html?id=' + encodeURIComponent(saveId) });
await sleep(3000);
const reloadCheck = await js(`(function(){var s=document.querySelector('#body span[style*="font-size"]'); return s?JSON.stringify({size:s.style.fontSize,text:s.textContent}):'NO-SPAN';})()`);
ok('保存重开后字号保留', /24px/.test(String(reloadCheck)) && /大号文字/.test(String(reloadCheck)), String(reloadCheck));

log('STATS pass=' + pass + ' fail=' + fail);
log(saveId);
fs.writeFileSync('C:/Users/Administrator/AppData/Local/Temp/cms-shot/ne-v2-id.txt', saveId);
log('ALL DONE');
chrome.kill();
setTimeout(() => process.exit(fail ? 1 : 0), 500);
