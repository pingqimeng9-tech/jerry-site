// 多视口截图：手机/平板 横竖屏 × 后台编辑器/控制台
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const LOG = SHOT + 'ne-mobile-log.txt';
fs.writeFileSync(LOG, 'start\n');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
const PORT = 9860 + Math.floor(Math.random() * 100);
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', '--disable-features=BackdropFilter', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(os.tmpdir(), 'chrome-mob-' + Date.now())}`, '--window-size=414,900', 'about:blank'],
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
  if (m.method === 'Page.javascriptDialogOpening') { log('DIALOG:', m.params.message); await send('Page.handleJavaScriptDialog', { accept: true }); return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
ws.onclose = (e) => { log('WS CLOSE', e.reason || ''); try { chrome.kill(); } catch (_) {} setTimeout(() => process.exit(2), 200); };
ws.onerror = (e) => log('WS ERROR', (e && e.message) || 'err');
process.on('uncaughtException', (e) => log('UNCAUGHT', e.message));
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => { const i = ++mid; ws.send(JSON.stringify({ id: i, method, params })); return new Promise(r => pending.set(i, r)); };
const js = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) log('JS ERR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 300)); return r.result?.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
const killAnim = async () => js(`(function(){try{var s=document.getElementById('__killAnim');if(!s){s=document.createElement('style');s.id='__killAnim';s.textContent='*{animation:none!important;transition:none!important;scroll-behavior:auto!important}';document.head.appendChild(s);}return 'ok';}catch(e){return e.message;}})()`);
const shot = async n => {
  await withTimeout(send('Page.stopLoading'), 3000);
  await killAnim();
  await sleep(350);
  let s = await withTimeout(send('Page.captureScreenshot', { format: 'jpeg', quality: 82, fromSurface: true }), 7000);
  if (!s || !s.data) { await killAnim(); await sleep(500); s = await withTimeout(send('Page.captureScreenshot', { format: 'jpeg', quality: 82, fromSurface: true }), 7000); }
  if (s && s.data) { fs.writeFileSync(SHOT + n.replace(/\.png$/, '.jpg'), Buffer.from(s.data, 'base64')); log('shot ' + n); } else log('SKIP ' + n);
};

await send('Page.enable'); await send('Runtime.enable');

async function viewport(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: !!mobile });
}
async function nav(url, wait) {
  // 不等 load 事件（部分页面有长连接会拖住），导航后固定等待
  send('Page.navigate', { url });
  await sleep(wait || 3000);
}

// 找一篇真实文章 id
const post = await (await fetch('http://127.0.0.1:5858/api/post?slug=muoibq2l')).json().catch(() => null);
const pid = post && post.ok ? encodeURIComponent(post.post.id) : 'new';
log('edit id:', pid);

// ===== iPhone 竖屏 390x844 =====
await viewport(390, 844, true);
await nav('http://127.0.0.1:5858/admin/editor.html?id=' + pid, 4000);
await shot('mob-1-editor-390.png');
// 打开属性抽屉
await js(`document.getElementById('asideToggle').click()`);
await sleep(700);
await shot('mob-2-editor-aside-390.png');
await js(`document.body.classList.remove('aside-open')`);
// 斜杠菜单 bottom sheet
// 斜杠菜单要求 / 前为行首/空白：新建空段并聚焦其开头
await js(`(function(){var b=document.getElementById('body');var p=document.createElement('p');p.textContent='\\u200B';b.appendChild(p);var r=document.createRange();r.setStart(p.firstChild,0);r.collapse(true);var s=getSelection();s.removeAllRanges();s.addRange(r);b.focus();window.__slashP=p;})()`);
// 真实按 '/' 键
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: '/', code: 'Slash', windowsVirtualKeyCode: 191, nativeVirtualKeyCode: 191 });
await send('Input.dispatchKeyEvent', { type: 'char', text: '/' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: '/', code: 'Slash', windowsVirtualKeyCode: 191, nativeVirtualKeyCode: 191 });
await sleep(800);
await shot('mob-3-editor-slash-390.png');
await js(`document.querySelectorAll('.ne-menu').forEach(m=>m.classList.remove('open')); if(window.__slashP) window.__slashP.remove();`);
// 控制台
await nav('http://127.0.0.1:5858/admin/index.html', 3500);
await shot('mob-4-admin-390.png');

// ===== 安卓竖屏 360x800 =====
await viewport(360, 800, true);
await nav('http://127.0.0.1:5858/admin/editor.html?id=' + pid, 3500);
await shot('mob-5-editor-360.png');

// ===== iPhone 横屏 844x390 =====
await viewport(844, 390, true);
await nav('http://127.0.0.1:5858/admin/editor.html?id=' + pid, 3000);
await shot('mob-6-editor-land-844.png');
await js(`var t=document.getElementById('asideToggle'); if(t) t.click()`);
await sleep(700);
await shot('mob-6b-editor-land-aside.png');
await js(`document.body.classList.remove('aside-open')`);

// ===== iPad 竖屏 768x1024 =====
await viewport(768, 1024, true);
await nav('http://127.0.0.1:5858/admin/editor.html?id=' + pid, 3500);
await shot('mob-7-editor-ipad-768.png');
await nav('http://127.0.0.1:5858/admin/index.html', 3000);
await shot('mob-8-admin-ipad-768.png');

// ===== iPad 横屏 1024x768 =====
await viewport(1024, 768, true);
await nav('http://127.0.0.1:5858/admin/editor.html?id=' + pid, 3500);
await shot('mob-9-editor-ipad-land-1024.png');

// ===== 前台 iPhone 竖屏 =====
await viewport(390, 844, true);
await nav('http://127.0.0.1:5858/', 3500); await shot('mob-10-home-390.png');
await nav('http://127.0.0.1:5858/blog.html', 3500); await shot('mob-11-blog-390.png');
await nav('http://127.0.0.1:5858/p/muoibq2l', 4000); await shot('mob-12-post-390.png');
await nav('http://127.0.0.1:5858/timeline.html', 3000); await shot('mob-13-timeline-390.png');
await js(`var b=document.querySelector('.mn-toggle'); if(b) b.click()`);
await sleep(600);
await shot('mob-13b-timeline-menu.png');

log('ALL DONE');
chrome.kill();
setTimeout(() => process.exit(0), 400);
