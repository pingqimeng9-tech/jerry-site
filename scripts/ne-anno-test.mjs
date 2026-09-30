// 划词批注端到端验证：编辑器创建/编辑/序列化 + 前台展示
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const LOG = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/ne-anno-log.txt';
fs.writeFileSync(LOG, 'start\n');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const PORT = 9876;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(os.tmpdir(), 'chrome-anno-' + Date.now())}`, '--window-size=1500,1000', 'about:blank'],
  { stdio: 'ignore' });
async function getWS() {
  for (let i = 0; i < 40; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const t = list.find(x => x.type === 'page'); if (t?.webSocketDebuggerUrl) return t.webSocketDebuggerUrl; } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('CDP not ready');
}
const ws = new WebSocket(await getWS());
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => { const mid = ++id; ws.send(JSON.stringify({ id: mid, method, params })); return new Promise(r => pending.set(mid, r)); };
const js = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) log('JS ERROR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 400)); return r.result?.value; };
const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(SHOT + n, Buffer.from(s.data, 'base64')); log('shot ' + n); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html' });
  await sleep(3000);

  // 准备两段文字
  await js(`var b=document.getElementById('body'); b.innerHTML='<p>这是第一段需要划词批注的文字内容。</p><p>第二段文字，用于测试第二个批注。</p>';`);
  await sleep(200);

  // 选中第一段中的"划词批注"四个字
  await js(`var p=document.querySelectorAll('#body p')[0]; var t=p.firstChild; var s=p.textContent.indexOf('划词批注'); var r=document.createRange(); r.setStart(t,s); r.setEnd(t,s+4); var sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange'));`);
  await sleep(200);
  log('inline bar: ' + await js(`document.querySelector('.ne-inline').classList.contains('open')`));
  log('anno btn: ' + await js(`!!document.querySelector('.ne-inline button[data-c="anno"]')`));

  // 点批注按钮
  await js(`document.querySelector('.ne-inline button[data-c="anno"]').click();`);
  await sleep(300);
  log('card open: ' + await js(`document.querySelector('.ne-anno-card').classList.contains('open')`));
  log('marks after create: ' + await js(`document.querySelectorAll('#body mark.notion-highlight').length`));

  // 输入批注内容 + 换红色
  await js(`var ta=document.querySelector('.ne-anno-card .ac-input'); ta.value='这是作者补充的注释内容'; ta.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.ne-anno-card .ac-colors button[data-color="red_background"]').click();`);
  await sleep(150);
  await shot('ne-anno-1-card.png');

  // 完成，再建第二个批注（黄色默认）
  await js(`document.querySelector('.ne-anno-card .ac-done').click();`);
  await js(`var p=document.querySelectorAll('#body p')[1]; var t=p.firstChild; var s=p.textContent.indexOf('第二个'); var r=document.createRange(); r.setStart(t,s); r.setEnd(t,s+3); var sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange'));`);
  await sleep(150);
  await js(`document.querySelector('.ne-inline button[data-c="anno"]').click();`);
  await sleep(200);
  await js(`var ta=document.querySelector('.ne-anno-card .ac-input'); ta.value='另一条注释'; ta.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.ne-anno-card .ac-done').click();`);
  await sleep(150);

  const annos = await js(`JSON.stringify(window.__ne.getAnnotations())`);
  log('annotations: ' + annos);
  const md = await js(`htmlToMd(document.getElementById('body'))`);
  fs.writeFileSync(SHOT + 'ne-anno-md.txt', md, 'utf8');
  log('md has mark: ' + /<mark[^>]*data-anno-id/.test(md));
  log('md has red color: ' + /data-color="red_background"/.test(md));

  // 往返
  const rt = await js(`(function(){ var m=htmlToMd(document.getElementById('body')); var h=mdToHtml(m); var d=document.createElement('div'); d.innerHTML=h; window.__rtAnnos=window.__ne.getAnnotations(); window.__ne.setAnnotations(JSON.parse(JSON.stringify(window.__rtAnnos))); return JSON.stringify({marks:d.querySelectorAll('mark.notion-highlight').length, colors:[].map.call(d.querySelectorAll('mark'),x=>x.dataset.color)}); })()`);
  log('roundtrip: ' + rt);
  await sleep(200);
  log('after reload marks in body: ' + await js(`document.querySelectorAll('#body mark.notion-highlight').length`));
  await shot('ne-anno-2-editor.png');

  // 存草稿（带 annotations）→ 前台验证 → 删除
  const saveBody = JSON.stringify({
    title: 'NE批注临时文章-请删除', category: '测试', tags: [], excerpt: '临时',
    markdown: md, status: 'draft',
    annotations: JSON.parse(annos)
  });
  const saved = await (await fetch('http://127.0.0.1:5858/api/post/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: saveBody })).json();
  log('saved: ' + saved.ok + ' ' + saved.id);
  fs.writeFileSync(SHOT + 'ne-anno-postid.txt', saved.id);

  // ===== 前台读者侧 =====
  await send('Page.navigate', { url: 'http://127.0.0.1:5858/post.html?id=' + encodeURIComponent(saved.id) });
  await sleep(5000);
  log('front marks: ' + await js(`document.querySelectorAll('#a-body mark.notion-highlight').length`));
  log('front mark colors: ' + await js(`JSON.stringify([].map.call(document.querySelectorAll('#a-body mark.notion-highlight'),m=>m.style.background||m.dataset.color))`));
  await shot('ne-anno-3-front.png');
  // 点开第一个批注抽屉
  await js(`document.querySelector('#a-body mark.notion-highlight').click();`);
  await sleep(500);
  log('drawer open: ' + await js(`document.getElementById('annoDrawer').classList.contains('open')`));
  log('drawer comment: ' + await js(`document.getElementById('annoDrawerComment').textContent`));
  await shot('ne-anno-4-drawer.png');

  // 清理草稿
  const del = await (await fetch('http://127.0.0.1:5858/api/post/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.id }) })).json();
  log('deleted: ' + del.ok);
} catch (e) {
  log('FATAL ' + e.message + ' ' + e.stack);
}
chrome.kill();
log('ALL DONE');
setTimeout(() => process.exit(0), 200);
