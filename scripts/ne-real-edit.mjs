// 全功能实战 v3：每步焦点断言，块内全选占位符，真实键盘+鼠标
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const LOG = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/ne-real-log.txt';
fs.writeFileSync(LOG, 'start\n');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
const SHOT = 'C:/Users/Administrator/AppData/Local/Temp/cms-shot/';
const PORT = 9845;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(os.tmpdir(), 'chrome-real3-' + Date.now())}`, '--window-size=1500,1100', 'about:blank'],
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
  if (m.method === 'Page.javascriptDialogOpening') { log('DIALOG:', m.params.message); await send('Page.handleJavaScriptDialog', { accept: true, promptText: m.params.defaultPrompt || '' }); return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => { const i = ++mid; ws.send(JSON.stringify({ id: i, method, params })); return new Promise(r => pending.set(i, r)); };
const js = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) log('JS ERROR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 400)); return r.result?.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// needChar=true：普通段落换行，依赖浏览器默认行为，需补发 char；其余 Enter 由产品 keydown 接管，不发 char
const press = async (k, needChar) => {
  const map = { ' ': ['Space', 32], 'Enter': ['Enter', 13], 'ArrowDown': ['ArrowDown', 40], 'Escape': ['Escape', 27] };
  const [code, kc] = map[k] || [k, 0];
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: kc, nativeVirtualKeyCode: kc });
  if (k === ' ') await send('Input.dispatchKeyEvent', { type: 'char', text: ' ' });
  if (k === 'Enter' && needChar) await send('Input.dispatchKeyEvent', { type: 'char', text: '\r' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: kc, nativeVirtualKeyCode: kc });
};
const typeText = async t => { await send('Input.insertText', { text: t }); };
const shot = async n => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(SHOT + n, Buffer.from(s.data, 'base64')); log('shot ' + n); };
const clickSelector = async sel => {
  const r = await js(`(function(){var e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;var r=e.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()`);
  if (!r) return false;
  const p = JSON.parse(r);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
  return true;
};
// 焦点放到 body 直接子级的末尾段落（无则新建；若末尾是块级元素则新建）
async function focusTopP() {
  return js(`(function(){
    var b=document.getElementById('body');
    var last=b.lastElementChild;
    if(!last || last.tagName!=='P' || last.querySelector('img,hr,table,figure,pre,details,.callout,.toc-block,.bookmark-card,ul,ol,iframe,video')){
      var p=document.createElement('p'); p.innerHTML='\u200B'; b.appendChild(p); last=p;
    }
    if(last.textContent.replace(/​/g,'').trim()==='' && !last.querySelector('br')){ last.innerHTML='​'; }
    var r=document.createRange();
    if(last.textContent.replace(/​/g,'').trim()===''){ r.setStart(last.firstChild||last,0); r.collapse(true); } else { r.selectNodeContents(last); r.collapse(false); }
    var s=getSelection(); s.removeAllRanges(); s.addRange(r);
    return 'P';
  })()`);
}
// 块后新建空段落并聚焦，返回断言
async function newParaAfter(sel) {
  const r = await js(`(function(){
    var n=document.querySelector(${JSON.stringify(sel)}); if(!n) return 'miss';
    var p=document.createElement('p'); p.innerHTML='\u200B'; n.after(p);
    var r=document.createRange(); r.setStart(p.firstChild,0); r.collapse(true);
    var s=getSelection(); s.removeAllRanges(); s.addRange(r);
    var a=s.anchorNode; var pp=a.nodeType===3?a.parentNode:a;
    return pp.tagName==='P' && pp.parentNode.id==='body' ? 'ok' : 'badfocus:'+pp.tagName;
  })()`);
  if (r !== 'ok') log('WARN newParaAfter ' + sel + ' -> ' + r);
  return r;
}
// 全选某元素内容（替换占位符）并聚焦
async function selectAllFocus(sel, which) {
  return js(`(function(){
    var list=document.querySelectorAll(${JSON.stringify(sel)}); var t=list[list.length-1];
    if(!t) return 'miss';
    var r=document.createRange(); r.selectNodeContents(t);
    var s=getSelection(); s.removeAllRanges(); s.addRange(r);
    return 'ok';
  })()`);
}
async function slashPick(filter, validatorSel, fallbackJs) {
  await press('Escape'); await sleep(60);
  await focusTopP();
  await typeText('/'); await sleep(300);
  await typeText(filter); await sleep(300);
  const n = await js(`document.querySelectorAll('.ne-menu .ne-item').length`);
  await press('Enter'); await sleep(500);
  let ok = validatorSel ? await js(`document.querySelectorAll(${JSON.stringify(validatorSel)}).length`) > 0 : true;
  log(`slash /${filter} items=${n} inserted=${ok}`);
  if (!ok) {
    log('FALLBACK /' + filter);
    await press('Escape');
    // 清掉残留的 /触发词
    await js(`(function(){var b=getSelection().anchorNode; if(b && b.nodeType===3){ var m=b.textContent.match(/\\/[\\w\\u4e00-\\u9fa5]+$/); if(m){ var r=document.createRange(); r.setStart(b,b.textContent.length-m[0].length); r.setEnd(b,b.textContent.length); r.deleteContents(); } } })()`);
    await focusTopP();
    await js(fallbackJs); await sleep(400);
    ok = validatorSel ? await js(`document.querySelectorAll(${JSON.stringify(validatorSel)}).length`) > 0 : true;
    log('fallback result ' + ok);
  }
  return ok;
}
async function selectTextIn(containerSel, text) {
  return js(`(function(){
    var root=document.querySelector(${JSON.stringify(containerSel)}); if(!root) return 'no container';
    var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT); var n, found=null, idx=-1;
    while(n=walker.nextNode()){ var i=n.textContent.indexOf(${JSON.stringify(text)}); if(i>=0){ found=n; idx=i; break; } }
    if(!found) return 'not found';
    var r=document.createRange(); r.setStart(found, idx); r.setEnd(found, idx+${JSON.stringify(text)}.length);
    var s=getSelection(); s.removeAllRanges(); s.addRange(r);
    document.dispatchEvent(new Event('selectionchange')); return 'selected';
  })()`);
}
// 输入一个 ### 小标题（保证独立段落）
async function h3(text) {
  await focusTopP();
  await typeText('###'); await press(' '); await sleep(200);
  await typeText(text);
  await press('Enter'); await sleep(200);
  await focusTopP();
}

try {
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html' });
  await sleep(3000);
  await clickSelector('#title'); await typeText('写作体验升级：Jerry.dev 编辑器现在长这样');
  await clickSelector('#category'); await typeText('建站笔记');
  await focusTopP();

  // 开场段
  await typeText('最近把博客编辑器按 Notion 的写作习惯重做了一遍。这篇文章本身就是用新编辑器写的，所有功能都用了一遍。');
  await press('Enter', true); await sleep(150);
  // h2
  await typeText('##'); await press(' '); await sleep(200);
  await typeText('为什么要重做'); await press('Enter'); await sleep(150);
  await typeText('旧编辑器只能点工具栏，写作思路总被打断。现在大部分操作都能在键盘上完成：打个斜杠就能插入任何块。');
  await press('Enter', true); await sleep(150);

  // Callout 提示
  await slashPick('提示', '#body .callout.co-tip', `window.__ne.insertCallout('tip')`);
  await selectAllFocus('#body .callout.co-tip .co-text');
  await typeText('这是一个提示框：写作时不用离开键盘，斜杠菜单支持中文搜索。');
  await newParaAfter('#body .callout.co-tip');
  // Callout 警告
  await slashPick('警告', '#body .callout.co-warning', `window.__ne.insertCallout('warning')`);
  await selectAllFocus('#body .callout.co-warning .co-text');
  await typeText('这是警告框：线上后台传文件有 4.5MB 限制，大文件方案还在路上。');
  await newParaAfter('#body .callout.co-warning');

  // 折叠块
  await h3('折叠块：常见问题');
  await slashPick('折叠', '#body details', `window.__ne.insertToggle()`);
  await sleep(200);
  await selectAllFocus('#body details summary');
  await typeText('问：斜杠菜单怎么打开？');
  await selectAllFocus('#body details p');
  await typeText('答：空行打 / 就能唤出，支持中文过滤；Esc 关闭，↑↓ 选择，Enter 插入。');
  await newParaAfter('#body details');

  // 代码块
  await h3('代码块');
  await slashPick('代码', '#body pre', `window.__ne.insertCodeBlock('javascript')`);
  await sleep(250);
  // insertCodeBlock 已把光标放进空 code（零宽空格承接），直接输入即可；
  // 不要全选 code 内容后 insertText——Chrome 会用带内联样式的 span 替换并吞掉 code 标签
  await typeText("function greet(name) {");
  await sleep(150);
  await press('Enter'); await sleep(120);
  await typeText("  return `Hello, ${name}!`;");
  await press('Enter'); await sleep(100);
  await typeText('}');
  log('code dump: ' + await js(`(function(){var ps=document.querySelectorAll('#body pre'); var out=[]; ps.forEach(function(p){out.push('<pre code="'+(p.querySelector('code')?'Y':'N')+'">'+p.textContent.replace(/\\n/g,'\\\\n').slice(0,100)+'</pre>');}); var a=getSelection().anchorNode; out.push('sel='+(a?(a.nodeType===3?JSON.stringify(a.textContent.slice(0,20))+' in '+(a.parentNode.nodeName+(a.parentNode.parentNode.nodeName||'')):a.nodeName):'none')); return out.join(' || ');})()`));
  await newParaAfter('#body pre');

  // 表格
  await h3('可视化表格');
  await slashPick('表格', '#body table', `window.__ne.openTableGrid()`);
  await sleep(300);
  await js(`(function(){var cells=document.querySelectorAll('.ne-tablegrid .cells i'); if(cells.length>=19){ cells[18].dispatchEvent(new MouseEvent('mouseover',{bubbles:true})); cells[18].click(); return 'grid ok'; } return 'grid missing '+cells.length;})()`);
  await sleep(500);
  await js(`(function(){var t=document.querySelector('#body table'); if(!t)return 'no table'; var cells=t.querySelectorAll('th,td'); var data=${JSON.stringify(['功能','入口','状态','斜杠菜单','打 /','已上线','划词批注','选中文字点💬','已上线','折叠块','斜杠→折叠','已上线'])}; for(var i=0;i<cells.length&&i<data.length;i++) cells[i].textContent=data[i]; return 'filled';})()`);
  await newParaAfter('#body table');

  // 目录
  await h3('文内目录');
  await slashPick('目录', '#body .toc-block', `window.__ne.insertToc()`);
  await sleep(700);
  await newParaAfter('#body .toc-block');

  // 书签
  await h3('书签卡片');
  await js(`window.__origPrompt=window.prompt; window.prompt=function(){return 'https://github.com/pingqimeng9-tech/jerry-site';};`);
  await slashPick('书签', '#body .bookmark-card', `window.__ne.insertBookmark()`);
  await js(`window.prompt=window.__origPrompt;`);
  await newParaAfter('#body .bookmark-card');

  // 图片 + 图注（替换当前空 p）
  await h3('图片与图注');
  await js(`(function(){
    var s=getSelection(); var p=s.anchorNode; while(p && p.nodeName!=='P'){ p=p.parentNode; }
    if(!p || p.parentNode.id!=='body') return 'no p';
    var fig=document.createElement('figure');
    var img=document.createElement('img'); img.src='https://picsum.photos/seed/jerryeditor/720/320'; img.alt='编辑器示意图';
    var cap=document.createElement('figcaption'); cap.textContent='图 1：新编辑器斜杠菜单实拍';
    fig.appendChild(img); fig.appendChild(cap);
    var np=document.createElement('p'); np.innerHTML='\u200B';
    p.replaceWith(fig, np);
    var r=document.createRange(); r.setStart(np.firstChild,0); r.collapse(true);
    var ss=getSelection(); ss.removeAllRanges(); ss.addRange(r);
    return 'fig ok';
  })()`);

  // 任务列表
  await h3('待办清单');
  await typeText('[]'); await press(' '); await sleep(250);
  await typeText('斜杠菜单、块手柄、浮动工具条');
  await press('Enter'); await sleep(250);
  await typeText('折叠、Callout、代码块、表格、目录');
  await press('Enter'); await sleep(250);
  await typeText('划词批注、图片灯箱、粘贴增强');
  await press('Enter'); await sleep(250);
  await press('Enter'); await sleep(300);
  log('after tasks focus: ' + await focusTopP());

  // 分割线 + 结尾
  await typeText('---'); await press(' '); await sleep(250);
  await focusTopP();
  await typeText('以上就是全部新块。后续还会做大文件直传和 AI 辅助，慢慢来。');
  await sleep(200);

  // 批注 1
  log('anno1: ' + await selectTextIn('#body', 'Notion 的写作习惯'));
  await sleep(250);
  await clickSelector('.ne-inline button[data-c="anno"]');
  await sleep(400);
  await js(`var ta=document.querySelector('.ne-anno-card .ac-input'); ta.value='设计目标：让写作思路不被工具栏打断。'; ta.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.ne-anno-card .ac-done').click();`);
  await sleep(250);
  // 批注 2 蓝色
  log('anno2: ' + await selectTextIn('#body .callout.co-warning', '4.5MB 限制'));
  await sleep(250);
  await clickSelector('.ne-inline button[data-c="anno"]');
  await sleep(400);
  await js(`var ta=document.querySelector('.ne-anno-card .ac-input'); ta.value='Vercel Hobby 计划的请求体上限，后续改 Supabase Storage 直传解决。'; ta.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.ne-anno-card .ac-colors button[data-color="blue_background"]').click(); document.querySelector('.ne-anno-card .ac-done').click();`);
  await sleep(250);

  await shot('ne-real-1-editor.png');
  const stats = await js(`JSON.stringify({
    h2:document.querySelectorAll('#body h2').length,h3:document.querySelectorAll('#body h3').length,
    callout:document.querySelectorAll('#body .callout').length,details:document.querySelectorAll('#body details').length,
    pre:document.querySelectorAll('#body pre').length,codeLang:(document.querySelector('#body pre code')||{}).className||'',
    table:document.querySelectorAll('#body table').length,toc:document.querySelectorAll('#body .toc-block').length,
    tocItems:document.querySelectorAll('#body .toc-block li').length,bookmark:document.querySelectorAll('#body .bookmark-card').length,
    figure:document.querySelectorAll('#body figure').length,figcap:document.querySelectorAll('#body figcaption').length,
    tasks:document.querySelectorAll('#body li input[type=checkbox]').length,hr:document.querySelectorAll('#body hr').length,
    marks:document.querySelectorAll('#body mark.notion-highlight').length,annos:window.__ne.getAnnotations().length
  })`);
  log('STATS ' + stats);

  const saveRes = await js(`(async function(){ try{ await save('draft', true); return JSON.stringify({ok:true,id:doc.id}); }catch(e){ return 'SAVE ERR '+e.message; } })()`);
  log('SAVE ' + saveRes);
  const saveId = JSON.parse(saveRes).id;
  fs.writeFileSync(SHOT + 'ne-real-id.txt', saveId);
  await sleep(800);

  await send('Page.navigate', { url: 'http://127.0.0.1:5858/admin/editor.html?id=' + encodeURIComponent(saveId) });
  await sleep(3500);
  log('ROUNDTRIP ' + await js(`JSON.stringify({
    h2:document.querySelectorAll('#body h2').length,h3:document.querySelectorAll('#body h3').length,
    callout:document.querySelectorAll('#body .callout').length,details:document.querySelectorAll('#body details').length,
    pre:document.querySelectorAll('#body pre').length,codeLang:(document.querySelector('#body pre code')||{}).className||'',
    codeLines:(document.querySelector('#body pre code')||{textContent:''}).textContent.split('\\n').length,
    codeHasGreet:(document.querySelector('#body pre code')||{textContent:''}).textContent.indexOf('greet')>=0,
    table:document.querySelectorAll('#body table').length,tds:document.querySelectorAll('#body table td').length,
    toc:document.querySelectorAll('#body .toc-block').length,bookmark:document.querySelectorAll('#body .bookmark-card').length,
    figure:document.querySelectorAll('#body figure').length,figcap:document.querySelectorAll('#body figcaption').length,
    tasks:document.querySelectorAll('#body li input[type=checkbox]').length,hr:document.querySelectorAll('#body hr').length,
    marks:document.querySelectorAll('#body mark.notion-highlight').length,annos:window.__ne.getAnnotations().length
  })`));
  await shot('ne-real-2-reopened.png');

  await send('Page.navigate', { url: 'http://127.0.0.1:5858/post.html?id=' + encodeURIComponent(saveId) });
  await sleep(5500);
  log('FRONT ' + await js(`JSON.stringify({
    h2:document.querySelectorAll('#a-body h2').length,h3:document.querySelectorAll('#a-body h3').length,
    callout:document.querySelectorAll('#a-body .callout').length,details:document.querySelectorAll('#a-body details').length,
    pre:document.querySelectorAll('#a-body pre').length,hljs:document.querySelectorAll('#a-body pre code.hljs').length,
    copyBtn:document.querySelectorAll('#a-body pre .code-copy').length,table:document.querySelectorAll('#a-body table').length,
    tocBlock:document.querySelectorAll('#a-body .toc-block').length,tocLinks:document.querySelectorAll('#a-body .toc-block a').length,
    bookmark:document.querySelectorAll('#a-body .bookmark-card').length,figure:document.querySelectorAll('#a-body figure').length,
    tasks:document.querySelectorAll('#a-body li input[type=checkbox]').length,hr:document.querySelectorAll('#a-body hr').length,
    marks:document.querySelectorAll('#a-body mark.notion-highlight').length
  })`));
  await shot('ne-real-3-front.png');
  await js(`document.querySelector('#a-body mark.notion-highlight').click();`);
  await sleep(500);
  log('DRAWER ' + await js(`document.getElementById('annoDrawer').classList.contains('open')`));
  await shot('ne-real-4-drawer.png');
  log('DONE id=' + saveId);
} catch (e) {
  log('FATAL ' + e.message + ' ' + e.stack);
}
chrome.kill();
setTimeout(() => process.exit(0), 300);
