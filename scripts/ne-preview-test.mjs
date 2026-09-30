// 前台渲染验证：临时存草稿 → 截图 post.html → 删除草稿
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const md = [
  '## 编辑器升级功能演示',
  '',
  '<div class="toc-block" contenteditable="false"><div class="toc-b-title">📑 目录</div></div>',
  '',
  '### 提示框 Callout',
  '',
  '<div class="callout co-tip" data-type="tip"><span class="co-icon">💡</span><div class="co-text">这是<b>提示框</b>，用于小贴士</div></div>',
  '',
  '<div class="callout co-warning" data-type="warning"><span class="co-icon">⚠️</span><div class="co-text">这是警告框，注意风险</div></div>',
  '',
  '<div class="callout co-danger" data-type="danger"><span class="co-icon">❌</span><div class="co-text">这是危险框，不要这样做</div></div>',
  '',
  '<div class="callout co-info" data-type="info"><span class="co-icon">ℹ️</span><div class="co-text">这是信息框</div></div>',
  '',
  '### 折叠块',
  '',
  '<details>',
  '<summary>点击展开：常见问题</summary>',
  '',
  '折叠起来的答案内容，支持**粗体**与列表：',
  '',
  '- 第一条',
  '- 第二条',
  '',
  '</details>',
  '',
  '### 代码块',
  '',
  '```js',
  'function hello(name) {',
  '  console.log(`你好 ${name}`);',
  '  return true;',
  '}',
  '```',
  '',
  '### 表格',
  '',
  '| 功能 | 状态 | 说明 |',
  '| --- | :---: | ---: |',
  '| 斜杠菜单 | ✅ | 打 / 唤出 |',
  '| 折叠块 | ✅ | 任意嵌套 |',
  '| 可视化表格 | ✅ | 右键增删行列 |',
  '',
  '### 图片图注与书签',
  '',
  '<figure><img src="https://picsum.photos/seed/jerryne/640/300" alt="示例图片"><figcaption>图 1：这是图片说明文字（图注）</figcaption></figure>',
  '',
  '<a class="bookmark-card" href="https://example.com"><span class="bm-ic">🔖</span><span><span class="bm-tx">example.com</span><br><span class="bm-url">https://example.com</span></span></a>'
].join('\n');

const saveRes = await fetch('http://127.0.0.1:5858/api/post/save', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'NE预览临时文章-请删除', category: '测试', tags: [], excerpt: '临时', markdown: md, status: 'draft' })
});
const saved = await saveRes.json();
console.log('saved:', saved.ok, saved.id);
if (!saved.ok) process.exit(1);

const PORT = 9700 + Math.floor(Math.random() * 150);
const ud = path.join(os.tmpdir(), 'chrome-cdp-nep-' + Date.now());
const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${ud}`, '--window-size=1400,2400', 'about:blank'],
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
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5858/post.html?id=' + encodeURIComponent(saved.id) });
await new Promise(r => setTimeout(r, 6000));
const s = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(SHOT + 'ne-post-preview.png', Buffer.from(s.data, 'base64'));
console.log('screenshot saved');
chrome.kill();

// 清理临时草稿
const delRes = await fetch('http://127.0.0.1:5858/api/post/delete', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.id })
});
console.log('deleted:', (await delRes.json()).ok);
process.exit(0);
