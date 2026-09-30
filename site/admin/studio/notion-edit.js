/* ============================================================
   Jerry CMS · Notion 式编辑增强层（notion-edit.js）
   ------------------------------------------------------------
   依赖 editor.html 内联脚本中的全局：body / markDirty / refreshToolbar /
   mdToHtml / htmlToMd / toast / openPic / picTab / doUpload /
   doUploadVideo / doUploadPkg / doUploadAttach / insertTask /
   attachBlockHtml / previewBlockHtml / postJSON
   功能：斜杠菜单 / 块手柄(+ ⠿) / 划词浮动工具条 / 右键菜单 /
   Markdown 快捷输入 / Tab·Enter·Backspace 结构化 / 快捷键 /
   折叠块 / Callout / 代码块工具条 / 目录块 / 可视化表格 /
   图片图注·alt·链接·灯箱 / 粘贴与拖放增强 / 字数统计
   ============================================================ */
(function () {
  var body = document.getElementById('body');
  if (!body) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var mark = function () { try { markDirty(); } catch (e) {} try { refreshToolbar && refreshToolbar(); } catch (e) {} };
  var escHtml = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var exec = function (c, v) { document.execCommand(c, false, v == null ? null : v); body.focus(); mark(); };

  // ---------- 注入样式 ----------
  var CSS = ''
    + '.ne-menu{position:fixed;z-index:10000;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:6px;min-width:268px;max-height:340px;overflow-y:auto;backdrop-filter:blur(14px);display:none;font-size:13px}'
    + '.ne-menu.open{display:block}'
    + '.ne-group{font-size:10px;letter-spacing:.14em;color:rgba(255,255,255,.4);padding:6px 10px 3px;text-transform:uppercase}'
    + '.ne-item{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;cursor:pointer;color:#eee}'
    + '.ne-item.active,.ne-item:hover{background:rgba(92,225,230,.16)}'
    + '.ne-item .ic{width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border-radius:7px;font-size:13px;flex:none}'
    + '.ne-item .tx{flex:1;min-width:0}.ne-item .tx b{display:block;font-weight:600;font-size:12.5px}.ne-item .tx span{display:block;font-size:10.5px;color:rgba(255,255,255,.45)}'
    + '.ne-item .keys{font-size:10px;color:rgba(255,255,255,.35);font-family:monospace}'
    + '.ne-grip{position:fixed;z-index:9990;display:none;align-items:center;gap:1px;padding-left:2px}'
    + '.ne-grip.show{display:flex}'
    + '.ne-grip button{width:17px;height:22px;border:none;background:transparent;color:rgba(255,255,255,.38);cursor:pointer;border-radius:5px;font-size:13px;line-height:1;padding:0}'
    + '.ne-grip button:hover{background:rgba(255,255,255,.12);color:#fff}'
    + '.ne-grip .g-drag{cursor:grab;font-size:15px}'
    + '.ne-inline{position:fixed;z-index:10001;display:none;gap:2px;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:4px;box-shadow:0 12px 34px rgba(0,0,0,.5)}'
    + '.ne-inline.open{display:flex}'
    + '.ne-inline button{border:none;background:transparent;color:#eee;width:30px;height:28px;border-radius:7px;cursor:pointer;font-size:13px;padding:0}'
    + '.ne-inline button:hover{background:rgba(92,225,230,.18)}'
    + '.ne-palette{position:fixed;z-index:10002;display:none;grid-template-columns:repeat(8,1fr);gap:4px;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:7px}'
    + '.ne-palette.open{display:grid}'
    + '.ne-palette button{width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,.25);cursor:pointer}'
    + '.ne-drop-line{height:3px;border-radius:2px;background:linear-gradient(90deg,#5CE1E6,#B18CFF);box-shadow:0 0 10px rgba(92,225,230,.7);margin:2px 0;pointer-events:none}'
    + '.ne-wordbar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9000;background:rgba(20,16,40,.92);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 16px;font-size:11px;color:rgba(255,255,255,.65);display:flex;gap:14px;backdrop-filter:blur(10px)}'
    + '.ne-wordbar b{color:#5CE1E6;font-weight:700}'
    + '#body mark.notion-highlight{border-radius:3px;padding:0 2px;color:inherit;cursor:pointer}'
    + '.ne-anno-card{position:fixed;z-index:10002;display:none;width:300px;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:12px 14px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:13px;color:#eee}'
    + '.ne-anno-card.open{display:block}'
    + '.ne-anno-card .ac-quote{font-size:12px;color:#b8b5d6;border-left:3px solid #ffd166;padding-left:8px;margin-bottom:8px;max-height:54px;overflow:auto;line-height:1.6}'
    + '.ne-anno-card .ac-colors{display:flex;gap:6px;margin-bottom:8px}'
    + '.ne-anno-card .ac-colors button{width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,.25);cursor:pointer;padding:0}'
    + '.ne-anno-card .ac-colors button.sel{outline:2px solid #5ce1e6;outline-offset:1px}'
    + '.ne-anno-card .ac-input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#eee;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit;line-height:1.6}'
    + '.ne-anno-card .ac-foot{display:flex;justify-content:space-between;margin-top:8px}'
    + '.ne-anno-card .ac-foot button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#ddd;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer}'
    + '.ne-anno-card .ac-del{color:#ff9c8a!important;border-color:rgba(255,122,92,.4)!important}'
    + '.ne-anno-card .ac-done{background:rgba(92,225,230,.18)!important;color:#fff!important}'
    + '.ne-tablegrid{position:fixed;z-index:10003;display:none;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px}'
    + '.ne-tablegrid.open{display:block}'
    + '.ne-tablegrid .cells{display:grid;grid-template-columns:repeat(8,22px);grid-auto-rows:22px;gap:3px}'
    + '.ne-tablegrid .cells i{background:rgba(255,255,255,.08);border-radius:4px}'
    + '.ne-tablegrid .cells i.on{background:#5CE1E6}'
    + '.ne-tablegrid .tg-tip{font-size:11px;color:#bbb;margin-top:7px;text-align:center}'
    + '.ne-tblbar{position:fixed;z-index:9995;display:none;gap:2px;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:3px;flex-wrap:wrap;max-width:420px}'
    + '.ne-tblbar.open{display:flex}'
    + '.ne-tblbar button{border:none;background:transparent;color:#ddd;font-size:12px;min-width:26px;height:26px;border-radius:6px;cursor:pointer;padding:0 6px}'
    + '.ne-tblbar button:hover{background:rgba(92,225,230,.18)}'
    + '.ne-codebar{position:fixed;z-index:9995;display:none;gap:4px;align-items:center;background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:3px 8px}'
    + '.ne-codebar.open{display:flex}'
    + '.ne-codebar select,.ne-codebar button{background:rgba(255,255,255,.08);color:#eee;border:1px solid rgba(255,255,255,.15);border-radius:6px;font-size:11px;padding:3px 7px;cursor:pointer}'
    + '.ne-lightbox{position:fixed;inset:0;z-index:10005;background:rgba(0,0,0,.86);display:none;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(6px)}'
    + '.ne-lightbox.open{display:flex}'
    + '.ne-lightbox img{max-width:92vw;max-height:92vh;border-radius:8px;box-shadow:0 20px 80px rgba(0,0,0,.7)}'
    // ===== 内容块样式（编辑器内） =====
    + '.editor-body .callout{display:flex;gap:10px;align-items:flex-start;border-radius:12px;padding:12px 14px;margin:12px 0;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05)}'
    + '.editor-body .callout .co-icon{font-size:17px;line-height:1.5;cursor:pointer;user-select:none;flex:none}'
    + '.editor-body .callout .co-text{flex:1;min-width:0;outline:none}'
    + '.editor-body .callout.co-tip{border-color:rgba(124,255,178,.4);background:rgba(124,255,178,.09)}'
    + '.editor-body .callout.co-warning{border-color:rgba(255,209,102,.45);background:rgba(255,209,102,.1)}'
    + '.editor-body .callout.co-danger{border-color:rgba(255,122,92,.5);background:rgba(255,122,92,.1)}'
    + '.editor-body .callout.co-info{border-color:rgba(92,225,230,.45);background:rgba(92,225,230,.09)}'
    + '.editor-body details{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.045);border-radius:12px;padding:10px 14px;margin:12px 0}'
    + '.editor-body details>summary{cursor:pointer;font-weight:700;list-style:none;position:relative;padding-left:18px;outline:none}'
    + '.editor-body details>summary::-webkit-details-marker{display:none}'
    + '.editor-body details>summary::before{content:"▸";position:absolute;left:0;transition:.15s;color:#5CE1E6}'
    + '.editor-body details[open]>summary::before{transform:rotate(90deg)}'
    + '.editor-body details[open]>summary{margin-bottom:8px}'
    + '.editor-body .toc-block{border:1px dashed rgba(92,225,230,.4);background:rgba(92,225,230,.06);border-radius:12px;padding:12px 16px;margin:14px 0;user-select:none}'
    + '.editor-body .toc-block .toc-b-title{font-weight:700;color:#5CE1E6;font-size:13px;margin-bottom:7px}'
    + '.editor-body .toc-block ul{margin:0;padding-left:18px}.editor-body .toc-block li{font-size:12.5px;margin:3px 0;color:#cfcde8}'
    + '.editor-body .toc-block li.h3{list-style:none;margin-left:16px}'
    + '.editor-body .bookmark-card{display:flex;gap:12px;align-items:center;border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:12px 14px;margin:12px 0;text-decoration:none;color:inherit;background:rgba(255,255,255,.04);overflow:hidden}'
    + '.editor-body .bookmark-card:hover{border-color:#5CE1E6;background:rgba(92,225,230,.07)}'
    + '.editor-body .bookmark-card .bm-ic{font-size:22px;flex:none}'
    + '.editor-body .bookmark-card .bm-url{font-size:12px;color:#8fdfe4;word-break:break-all}'
    + '.editor-body .bookmark-card .bm-tx{font-size:13px;font-weight:600}'
    + '.editor-body figure{margin:14px 0;text-align:center}'
    + '.editor-body figure figcaption{font-size:12px;color:rgba(255,255,255,.55);margin-top:6px;outline:none;border:none}'
    + '.editor-body pre{position:relative}'
    + '.editor-body pre.hl-wrap{white-space:pre-wrap;word-break:break-word}'
    + '.editor-body table{border-collapse:collapse;margin:14px 0;width:100%}'
    + '.editor-body table th,.editor-body table td{border:1px solid rgba(255,255,255,.25);padding:7px 11px;min-width:46px;vertical-align:top}'
    + '.editor-body table th{background:rgba(92,225,230,.12);font-weight:700}'
    + '.editor-body table td.cell-cursor{box-shadow:inset 0 0 0 2px #5CE1E6}'
    + '.editor-body .ne-block-dragging{opacity:.35}';
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ---------- 通用 DOM 工厂 ----------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------- 块工具 ----------
  function blockOf(node) {
    while (node && node !== body) { if (node.parentNode === body) return node; node = node.parentNode; }
    return null;
  }
  function caretInfo() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    var block = blockOf(r.startContainer);
    if (!block) return null;
    var rr = r.cloneRange();
    rr.selectNodeContents(block);
    rr.setEnd(r.startContainer, r.startOffset);
    return { sel: sel, range: r, block: block, prefix: rr.toString(), full: block.textContent };
  }
  function placeCaret(node, atEnd) {
    node = node.nodeType === 1 ? node : node.parentNode;
    var r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(atEnd === false ? false : true);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function insertBlock(html, afterBlock, focusEl) {
    var tmp = el('div'); tmp.innerHTML = html;
    var nodes = $$(':scope > *', tmp);
    var ref = afterBlock ? afterBlock.nextSibling : null;
    nodes.forEach(function (n) { body.insertBefore(n, ref); ref = n.nextSibling; });
    var target = nodes[focusEl != null ? focusEl : 0];
    // 外层 contenteditable=false 的结构块（callout/toc 等），光标要落到内部可编辑元素
    if (target && target.contentEditable === 'false') {
      target = target.querySelector('[contenteditable="true"]') || target.querySelector('.co-text,summary,figcaption');
    }
    if (target) { try { placeCaret(target, true); } catch (e) {} }
    mark(); return nodes;
  }
  // 结构块装饰：不可编辑外壳 + 内部可编辑区（加载历史文章与新插入都要保证）
  function decorateBlocks() {
    $$('.callout', body).forEach(function (c) {
      c.setAttribute('contenteditable', 'false');
      var ic = $('.co-icon', c); if (ic) ic.setAttribute('contenteditable', 'false');
      var tx = $('.co-text', c); if (tx && tx.contentEditable !== 'true') tx.setAttribute('contenteditable', 'true');
    });
    $$('.toc-block,.bookmark-card', body).forEach(function (n) { n.setAttribute('contenteditable', 'false'); });
  }
  function currentBlock() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    return blockOf(sel.getRangeAt(0).startContainer);
  }
  function transformBlock(tag) {
    var map = { p: 'p', h1: 'h1', h2: 'h2', h3: 'h3', quote: 'blockquote', code: 'pre' };
    var t = map[tag] || 'p';
    exec('formatBlock', t);
  }

  // ============================================================
  // 1. 斜杠命令菜单 + emoji 菜单 + [[ 文章链接菜单（共用）
  // ============================================================
  var SLASH_ITEMS = [
    { g: '基础' },
    { ic: '📄', t: '正文', d: '普通段落', k: 'text p', run: function () { transformBlock('p'); } },
    { ic: 'H1', t: '一级标题', d: '大章节标题', run: function () { transformBlock('h1'); } },
    { ic: 'H2', t: '二级标题', d: '章节标题', run: function () { transformBlock('h2'); } },
    { ic: 'H3', t: '三级标题', d: '小节标题', run: function () { transformBlock('h3'); } },
    { ic: '❝', t: '引用', d: '引用块', run: function () { transformBlock('quote'); } },
    { ic: '➖', t: '分割线', d: '水平分割线', run: function () { exec('insertHorizontalRule'); } },
    { g: '列表' },
    { ic: '•', t: '无序列表', d: '圆点列表', run: function () { exec('insertUnorderedList'); } },
    { ic: '1.', t: '有序列表', d: '编号列表', run: function () { exec('insertOrderedList'); } },
    { ic: '☑', t: '待办清单', d: '可勾选任务', run: function () { insertTask(); } },
    { ic: '▾', t: '折叠块', d: 'Toggle，点击展开收起', run: function () { insertToggle(); } },
    { g: '内容块' },
    { ic: '</>', t: '代码块', d: '带语言高亮', run: function () { insertCodeBlock(); } },
    { ic: '💡', t: '提示框 Callout', d: '醒目标注块', run: function () { insertCallout('tip'); } },
    { ic: '▦', t: '表格', d: '可视化插入表格', run: function () { openTableGrid(); } },
    { ic: '📑', t: '目录', d: '自动收集标题生成目录', run: function () { insertToc(); } },
    { ic: '🔖', t: '书签卡片', d: '网址链接卡片', run: function () { insertBookmark(); } },
    { ic: '🌐', t: '网页嵌入', d: 'iframe 嵌入任意网页', run: function () { insertEmbed(); } },
    { g: '媒体' },
    { ic: '🖼', t: '图片', d: '上传 / 外链图片', run: function () { openPic('editor'); } },
    { ic: '🎬', t: '视频', d: '上传视频文件', run: function () { openPic('editor'); setTimeout(function(){ try{picTab('video');}catch(e){} }, 30); } },
    { ic: '📎', t: '附件', d: 'zip/exe/PDF 等可下载文件', run: function () { openPic('editor'); setTimeout(function(){ try{picTab('attach');}catch(e){} }, 30); } },
    { ic: '📦', t: '网站包', d: 'zip/html 实时预览', run: function () { openPic('editor'); setTimeout(function(){ try{picTab('pkg');}catch(e){} }, 30); } }
  ];
  var EMOJIS = ['😀','😂','😍','🤔','😭','😎','🥳','😴','🤯','👍','👏','🙏','💪','🔥','✨','🎉','❤️','💡','⚠️','❌','✅','⭐','🚀','🎯','📌','☕','🍀','🌙','☀️','⚡'];
  var menu = el('div', 'ne-menu'); document.body.appendChild(menu);
  var menuState = { open: false, mode: 'slash', active: 0, items: [], query: '', anchor: null };

  function showMenu(mode, rect, items, query) {
    menuState.mode = mode; menuState.items = items; menuState.query = query || ''; menuState.active = 0;
    renderMenu();
    menu.classList.add('open');
    var x = Math.min(rect.left, window.innerWidth - 290), y = Math.min(rect.bottom + 6, window.innerHeight - 360);
    menu.style.left = Math.max(8, x) + 'px'; menu.style.top = Math.max(8, y) + 'px';
    menuState.open = true;
  }
  function hideMenu() { menu.classList.remove('open'); menuState.open = false; }
  function renderMenu() {
    var q = menuState.query.toLowerCase();
    var list = menuState.items.filter(function (it) {
      if (it.g) return false;
      if (menuState.mode === 'slash') return !q || (it.t + ' ' + it.d).toLowerCase().indexOf(q) >= 0;
      if (menuState.mode === 'emoji') return !q || it.t.indexOf(q) >= 0;
      return !q || it.t.toLowerCase().indexOf(q) >= 0;
    });
    menuState.list = list;
    if (!list.length) { menu.innerHTML = '<div class="ne-group">无匹配项</div>'; return; }
    if (menuState.active >= list.length) menuState.active = 0;
    var html = '', lastG = null;
    SLASH_ITEMS.forEach(function (it) {
      if (menuState.mode === 'slash') {
        if (it.g) { if (list.length && it.g !== lastG) { html += '<div class="ne-group">' + it.g + '</div>'; lastG = it.g; } return; }
        if (list.indexOf(it) < 0) return;
      } else { if (it === list[0] || list.indexOf(it) === 0) {} if (list.indexOf(it) < 0) return; }
      var act = list[menuState.active] === it ? ' active' : '';
      html += '<div class="ne-item' + act + '" data-i="' + list.indexOf(it) + '"><span class="ic">' + it.ic + '</span><span class="tx"><b>' + it.t + '</b><span>' + (it.d || '') + '</span></span></div>';
    });
    if (menuState.mode !== 'slash') {
      html = list.map(function (it, i) {
        return '<div class="ne-item' + (i === menuState.active ? ' active' : '') + '" data-i="' + i + '"><span class="ic">' + it.ic + '</span><span class="tx"><b>' + it.t + '</b><span>' + (it.d || '') + '</span></span></div>';
      }).join('');
    }
    menu.innerHTML = html;
    $$('.ne-item', menu).forEach(function (node) {
      node.onmouseenter = function () { menuState.active = +node.dataset.i; $$('.ne-item', menu).forEach(function (n) { n.classList.remove('active'); }); node.classList.add('active'); };
      node.onclick = function () { menuState.active = +node.dataset.i; confirmMenu(); };
    });
  }
  function confirmMenu() {
    var it = menuState.list[menuState.active];
    var mode = menuState.mode;
    if (mode === 'slash') {
      eraseTrigger(/(^|[\s>])\/[\w\u4e00-\u9fa5]*$/);
    } else if (mode === 'emoji') {
      eraseTrigger(/:[\w\u4e00-\u9fa5]*$/);
    } else if (mode === 'link') {
      eraseTrigger(/\[\[[^\[\]]*$/);
    }
    hideMenu();
    if (it && it.run) setTimeout(it.run, 0);
  }
  // 从光标处向左删除触发文本（正则匹配前缀）
  function eraseTrigger(re) {
    var info = caretInfo(); if (!info) return;
    var m = info.prefix.match(re); if (!m) return;
    var len = m[0].replace(/^[\s>]/, '').length; // 保留前导空白/>
    var sel = info.sel, node = sel.anchorNode, off = sel.anchorOffset;
    if (node.nodeType !== 3 || off < len) return;
    var r = document.createRange(); r.setStart(node, off - len); r.setEnd(node, off); r.deleteContents();
    r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
  }

  body.addEventListener('input', function () {
    var info = caretInfo(); if (!info) { hideMenu(); return; }
    // 斜杠
    var mSlash = info.prefix.match(/(^|[\s>])\/([\w\u4e00-\u9fa5]*)$/);
    if (mSlash) {
      var rect = info.range.getBoundingClientRect();
      showMenu('slash', rect, SLASH_ITEMS, mSlash[2]); return;
    }
    // emoji
    var mEmo = info.prefix.match(/:([\w\u4e00-\u9fa5]{0,8})$/);
    if (mEmo && /(^|[\s]):/.test(info.prefix)) {
      var items = EMOJIS.map(function (e) { return { ic: e, t: e, run: function () { document.execCommand('insertText', false, e); } }; });
      showMenu('emoji', info.range.getBoundingClientRect(), items, mEmo[1]); return;
    }
    // [[ 文章链接
    var mLink = info.prefix.match(/\[\[([^\[\]]{0,20})$/);
    if (mLink) { openLinkMenu(info.range.getBoundingClientRect(), mLink[1]); return; }
    if (menuState.open && menuState.mode === 'slash') hideMenu();
    if (menuState.open && menuState.mode === 'emoji') hideMenu();
    inlineAutoFormat(info);
    updateWordCount();
  });

  function openLinkMenu(rect, q) {
    fetch('/api/admin/posts', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (d) {
      var posts = (d.posts || []).filter(function (p) { return p.status === 'published' || p.status == null; });
      var items = posts.filter(function (p) { return !q || (p.title || '').toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 8).map(function (p) {
        return { ic: '📝', t: p.title, d: p.category || '', run: function () { insertPostLink(p); } };
      });
      if (!items.length) items = [{ ic: '🔗', t: '无匹配文章', d: '仍插入：手动输入网址', run: function () { var u = prompt('输入链接 URL：', 'https://'); if (u) document.execCommand('createLink', false, /^https?:/.test(u) ? u : 'https://' + u); } }];
      showMenu('link', rect, items, q);
    }).catch(function () { hideMenu(); });
  }
  function insertPostLink(p) {
    var url = '/post.html?id=' + encodeURIComponent(p.id);
    document.execCommand('insertHTML', false, '<a href="' + url + '">' + escHtml(p.title) + '</a>');
    mark();
  }

  // 行内自动格式化：闭合 **粗体** ~~删除~~ `代码`
  function inlineAutoFormat(info) {
    var tests = [
      { re: /\*\*([^*]+?)\*\*$/, tag: 'strong' },
      { re: /~~([^~]+?)~~$/, tag: 's' },
      { re: /`([^`\n]+?)`$/, tag: 'code' }
    ];
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i], m = info.prefix.match(t.re);
      if (!m) continue;
      var node = info.sel.anchorNode, off = info.sel.anchorOffset;
      if (node.nodeType !== 3) return;
      var start = off - m[0].length; if (start < 0) continue;
      var r = document.createRange(); r.setStart(node, start); r.setEnd(node, off);
      var txt = m[1];
      var nn = document.createElement(t.tag); nn.textContent = txt;
      r.deleteContents(); r.insertNode(nn);
      r.setStartAfter(nn); r.collapse(true);
      info.sel.removeAllRanges(); info.sel.addRange(r);
      mark(); return;
    }
  }

  // 菜单键盘导航
  body.addEventListener('keydown', function (e) {
    if (!menuState.open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); menuState.active = (menuState.active + 1) % menuState.list.length; renderMenu(); scrollActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); menuState.active = (menuState.active - 1 + menuState.list.length) % menuState.list.length; renderMenu(); scrollActive(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); confirmMenu(); }
    else if (e.key === 'Escape') { hideMenu(); }
  });
  function scrollActive() { var a = $('.ne-item.active', menu); if (a) a.scrollIntoView({ block: 'nearest' }); }
  document.addEventListener('click', function (e) { if (menuState.open && !menu.contains(e.target)) hideMenu(); });

  // ============================================================
  // 2. Markdown 块级快捷输入（空格触发）
  // ============================================================
  body.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || menuState.open) return;
    var info = caretInfo(); if (!info) return;
    var x = info.prefix;
    var rules = [
      { re: /^(#{1,3})$/, fn: function (m) { delPrefix(m[0].length); transformBlock('h' + m[1].length); } },
      { re: /^(-|\*|\+)$/, fn: function (m) { delPrefix(m[0].length); exec('insertUnorderedList'); } },
      { re: /^\d+\.$/, fn: function (m) { delPrefix(m[0].length); exec('insertOrderedList'); } },
      { re: /^\[\s?\]$/, fn: function (m) { delPrefix(m[0].length); insertTaskAtCaret(); } },
      { re: /^\[x\]$/i, fn: function (m) { delPrefix(m[0].length); insertTaskAtCaret(true); } },
      { re: /^>$/, fn: function (m) { delPrefix(1); transformBlock('quote'); } },
      { re: /^```$/, fn: function (m) { delPrefix(3); transformBlock('code'); } },
      { re: /^(-{3,}|\*{3,}|_{3,})$/, fn: function (m) { delPrefix(m[0].length); exec('insertHorizontalRule'); } }
    ];
    for (var i = 0; i < rules.length; i++) {
      var m = x.match(rules[i].re);
      if (m) { e.preventDefault(); rules[i].fn(m); return; }
    }
  });
  function delPrefix(len) {
    var info = caretInfo(), sel = info.sel, node = sel.anchorNode, off = sel.anchorOffset;
    if (node.nodeType !== 3 || off < len) return;
    var r = document.createRange(); r.setStart(node, off - len); r.setEnd(node, off); r.deleteContents();
    r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
  }
  function insertTaskAtCaret(checked) {
    var info = caretInfo();
    exec('insertUnorderedList');
    var li = info.block.tagName === 'LI' ? info.block : (currentBlock() && currentBlock().tagName === 'LI' ? currentBlock() : ($$('li', body).slice(-1)[0]));
    // 在当前 li 开头插入 checkbox
    var host = currentBlock();
    if (host && host.tagName === 'LI' && !host.querySelector('input[type=checkbox]')) {
      var cb = document.createElement('input'); cb.type = 'checkbox'; if (checked) cb.checked = true; cb.disabled = false;
      cb.contentEditable = 'false';
      host.insertBefore(cb, host.firstChild);
      mark();
    } else { insertTask(); }
  }

  // ============================================================
  // 3. 块手柄（+ / ⠿）
  // ============================================================
  var grip = el('div', 'ne-grip');
  grip.innerHTML = '<button class="g-add" title="在下方插入块（打开 / 菜单）">＋</button><button class="g-drag" title="拖拽移动 · 点击打开块菜单">⠿</button>';
  document.body.appendChild(grip);
  var gripBlock = null, drag = null;
  var myDropLine = el('div', 'ne-drop-line');

  body.addEventListener('mousemove', function (e) {
    if (drag) return;
    var b = blockOf(e.target);
    if (!b || isUnwanted(b)) { grip.classList.remove('show'); gripBlock = null; return; }
    gripBlock = b;
    var r = b.getBoundingClientRect();
    grip.classList.add('show');
    grip.style.top = (r.top + 4) + 'px';
    grip.style.left = Math.max(4, r.left - 34) + 'px';
  });
  body.addEventListener('mouseleave', function () { grip.classList.remove('show'); });
  function isUnwanted(b) { return /(ne-drop-line)/.test(b.className || ''); }

  $('.g-add', grip).addEventListener('mousedown', function (e) { e.preventDefault(); });
  $('.g-add', grip).addEventListener('click', function () {
    if (!gripBlock) return;
    var p = el('p'); p.innerHTML = '<br>';
    body.insertBefore(p, gripBlock.nextSibling);
    placeCaret(p, true);
    document.execCommand('insertText', false, '/');
    var info = caretInfo();
    if (info) { var ev = new Event('input', { bubbles: true }); info.block.dispatchEvent(ev); }
  });
  $('.g-drag', grip).addEventListener('mousedown', function (e) {
    if (!gripBlock) return;
    e.preventDefault();
    var startX = e.clientX, startY = e.clientY, moved = false, b = gripBlock;
    function mm(ev) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
        moved = true; drag = b; b.classList.add('ne-block-dragging');
      }
      if (!moved) return;
      var over = blockOf(document.elementFromPoint(ev.clientX, ev.clientY));
      myDropLine.remove();
      if (over && over !== b && over !== myDropLine) {
        var rr = over.getBoundingClientRect();
        var before = (ev.clientY - rr.top) < rr.height / 2;
        over.parentNode.insertBefore(myDropLine, before ? over : over.nextSibling);
      }
    }
    function mu(ev) {
      document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu);
      b.classList.remove('ne-block-dragging');
      if (moved) {
        if (myDropLine.parentNode) { body.insertBefore(b, myDropLine); myDropLine.remove(); mark(); }
        drag = null;
      } else {
        openBlockMenu(b, ev.clientX, ev.clientY);
      }
    }
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  });

  // ============================================================
  // 4. 块右键菜单（含表格操作）
  // ============================================================
  var ctxMenu = el('div', 'ne-menu'); ctxMenu.style.minWidth = '230px'; document.body.appendChild(ctxMenu);
  function closeCtx() { ctxMenu.classList.remove('open'); }
  document.addEventListener('click', closeCtx);
  body.addEventListener('contextmenu', function (e) {
    var sel = window.getSelection();
    var hasSel = sel && !sel.isCollapsed && body.contains(sel.getRangeAt(0).commonAncestorContainer);
    var b = blockOf(e.target);
    var items = [];
    if (e.target.closest && e.target.closest('td,th')) {
      items = tableMenuItems(e.target.closest('td,th'));
    } else if (hasSel) {
      items = [
        { ic: '✂️', t: '剪切', fn: function () { document.execCommand('cut'); } },
        { ic: '📋', t: '复制', fn: function () { document.execCommand('copy'); } },
        { ic: '📝', t: '粘贴为纯文本', d: 'Ctrl+Shift+V', fn: function () { toast('请按 Ctrl+Shift+V 粘贴纯文本'); } },
        { g: '样式' },
        { ic: 'B', t: '粗体', fn: function () { exec('bold'); } },
        { ic: 'I', t: '斜体', fn: function () { exec('italic'); } },
        { ic: 'U', t: '下划线', fn: function () { exec('underline'); } },
        { ic: 'S', t: '删除线', fn: function () { exec('strikeThrough'); } },
        { ic: '</>', t: '行内代码', fn: function () { wrapInlineCode(); } },
        { ic: '🔗', t: '插入链接', fn: function () { doLink(); } },
        { g: '其他' },
        { ic: '📄', t: '复制为 Markdown', fn: function () { copySelectionMd(); } },
        { ic: '🧹', t: '清除格式', fn: function () { exec('removeFormat'); } }
      ];
    } else if (b) {
      items = [
        { ic: '🔁', t: '转成 …', sub: [
          { t: '正文', fn: function () { transformBlock('p'); } },
          { t: '一级标题', fn: function () { transformBlock('h1'); } },
          { t: '二级标题', fn: function () { transformBlock('h2'); } },
          { t: '三级标题', fn: function () { transformBlock('h3'); } },
          { t: '引用', fn: function () { transformBlock('quote'); } },
          { t: '代码块', fn: function () { transformBlock('code'); } }
        ] },
        { ic: '⬆️', t: '上移块', fn: function () { moveBlock(b, -1); } },
        { ic: '⬇️', t: '下移块', fn: function () { moveBlock(b, 1); } },
        { ic: '📋', t: '复制块', fn: function () { copyBlock(b); } },
        { ic: '📄', t: '复制为 Markdown', fn: function () { copyBlockMd(b); } },
        { ic: '➕', t: '在下方插入段落', fn: function () { var p = el('p'); p.innerHTML = '<br>'; body.insertBefore(p, b.nextSibling); placeCaret(p); mark(); } },
        { ic: '🗑️', t: '删除块', fn: function () { b.remove(); mark(); } }
      ];
    }
    if (!items.length) return;
    e.preventDefault();
    renderCtx(items, e.clientX, e.clientY);
  });
  function renderCtx(items, x, y) {
    var html = '';
    items.forEach(function (it) {
      if (it.g) { html += '<div class="ne-group">' + it.g + '</div>'; return; }
      var sub = it.sub ? ' ▸' : '';
      html += '<div class="ne-item"><span class="ic">' + it.ic + '</span><span class="tx"><b>' + it.t + sub + '</b></span></div>';
    });
    ctxMenu.innerHTML = html;
    $$('.ne-item', ctxMenu).forEach(function (node, i) {
      var it = items.filter(function (x) { return !x.g; })[i];
      node.onclick = function (e) {
        e.stopPropagation();
        if (it.sub) { renderCtx(it.sub.concat([{ g: '返回' }, { ic: '↩️', t: '返回', back: true }]), x, y); return; }
        closeCtx(); if (it.fn) it.fn();
      };
    });
    ctxMenu.classList.add('open');
    ctxMenu.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    ctxMenu.style.top = Math.min(y, window.innerHeight - 340) + 'px';
  }
  function moveBlock(b, dir) {
    var sib = dir < 0 ? b.previousElementSibling : b.nextElementSibling;
    if (!sib) return;
    if (dir < 0) body.insertBefore(b, sib); else body.insertBefore(b, sib.nextSibling);
    mark();
  }
  function copyBlock(b) {
    var html = b.outerHTML;
    function fallback() { try { window.clipboardData && window.clipboardData.setData('Text', b.innerText); } catch (e) {} }
    if (navigator.clipboard && navigator.clipboard.write) {
      new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([b.innerText], { type: 'text/plain' }) })]).catch(fallback);
    } else fallback();
    toast('已复制块');
  }
  function copyBlockMd(b) {
    try {
      var tmp = el('div'); tmp.appendChild(b.cloneNode(true));
      var md = htmlToMd(tmp);
      navigator.clipboard.writeText(md).then(function () { toast('已复制 Markdown'); }, function () { toast('复制失败'); });
    } catch (e) { toast('复制失败：' + e.message); }
  }
  function copySelectionMd() {
    var sel = window.getSelection(), r = sel.getRangeAt(0), tmp = el('div');
    tmp.appendChild(r.cloneContents());
    try { navigator.clipboard.writeText(htmlToMd(tmp)); toast('已复制 Markdown'); } catch (e) {}
  }
  function wrapInlineCode() {
    var sel = window.getSelection(); if (sel.isCollapsed) return;
    var r = sel.getRangeAt(0), txt = r.toString();
    var c = el('code'); c.textContent = txt;
    r.deleteContents(); r.insertNode(c);
    mark();
  }


  // ============================================================
  // 5. 划词浮动工具条 + 颜色板
  // ============================================================
  var inlineBar = el('div', 'ne-inline');
  inlineBar.innerHTML = ['B','I','U','S'].map(function (x, i) {
    var a = ['bold','italic','underline','strikeThrough'][i];
    return '<button data-c="' + a + '" title="' + a + '">' + x + '</button>';
  }).join('')
    + '<button data-c="code" title="行内代码">&lt;/&gt;</button>'
    + '<button data-c="link" title="链接 (Ctrl+K)">🔗</button>'
    + '<button data-c="fg" title="文字颜色">A</button>'
    + '<button data-c="bg" title="高亮颜色">🖍</button>'
    + '<button data-c="anno" title="划词批注 / 注释">💬</button>'
    + '<button data-c="md" title="复制为 Markdown">MD</button>';
  document.body.appendChild(inlineBar);
  var palette = el('div', 'ne-palette');
  var PALETTE = ['#000000', '#FFFFFF', '#5CE1E6', '#B18CFF', '#FF8CD9', '#FF7A5C', '#FFD166', '#7CFFB2', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
  palette.innerHTML = PALETTE.map(function (c) { return '<button data-c="' + c + '" style="background:' + c + '"></button>'; }).join('');
  document.body.appendChild(palette);
  var paletteMode = 'fg';

  $$('button', inlineBar).forEach(function (btn) {
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      var c = btn.dataset.c;
      if (c === 'link') { doLink(); hideInline(); return; }
      if (c === 'anno') { createAnnotationFromSelection(); hideInline(); return; }
      if (c === 'md') { copySelectionMd(); hideInline(); return; }
      if (c === 'fg' || c === 'bg') {
        paletteMode = c;
        var r = inlineBar.getBoundingClientRect();
        palette.classList.add('open');
        palette.style.left = r.left + 'px'; palette.style.top = (r.bottom + 6) + 'px';
        return;
      }
      if (c === 'code') { wrapInlineCode(); hideInline(); return; }
      exec(c);
      setTimeout(showInlineBar, 10);
    });
  });
  $$('button', palette).forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      exec(paletteMode === 'fg' ? 'foreColor' : 'hiliteColor', b.dataset.c);
      palette.classList.remove('open'); hideInline();
    });
  });
  function hideInline() { inlineBar.classList.remove('open'); palette.classList.remove('open'); }
  function showInlineBar() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !body.contains(sel.getRangeAt(0).commonAncestorContainer)) { hideInline(); return; }
    var rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) { hideInline(); return; }
    inlineBar.classList.add('open');
    var w = inlineBar.offsetWidth;
    inlineBar.style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - w / 2, window.innerWidth - w - 8)) + 'px';
    inlineBar.style.top = Math.max(8, rect.top - 40) + 'px';
  }
  document.addEventListener('selectionchange', function () {
    var sel0 = window.getSelection();
    var hasSel0 = sel0 && !sel0.isCollapsed && body.contains(sel0.getRangeAt(0).commonAncestorContainer);
    if (menuState.open && hasSel0) hideMenu();   // 用户开始划词时自动收起斜杠菜单
    if (menuState.open) return;
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) { hideInline(); return; }
      if (body.contains(sel.getRangeAt(0).commonAncestorContainer)) showInlineBar(); else hideInline();
    }, 10);
  });

  // ============================================================
  // 5.5 划词批注（作者注释；与前台 post.annotations 数据结构互通）
  // ============================================================
  var ANNO_COLORS = {
    yellow_background: 'rgba(245,224,163,.35)', red_background: 'rgba(245,169,163,.32)',
    blue_background: 'rgba(163,201,245,.32)', green_background: 'rgba(169,224,186,.32)',
    gray_background: 'rgba(212,212,212,.26)', purple_background: 'rgba(211,184,240,.34)',
    pink_background: 'rgba(245,184,222,.34)', orange_background: 'rgba(245,199,158,.34)'
  };
  var ANNO_ORDER = ['yellow_background', 'red_background', 'blue_background', 'green_background', 'gray_background', 'purple_background', 'pink_background', 'orange_background'];
  var annotations = [];
  function findAnno(id) { for (var i = 0; i < annotations.length; i++) if (String(annotations[i].id) === String(id)) return annotations[i]; return null; }
  function genAnnoId() { return 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var annoCard = el('div', 'ne-anno-card');
  annoCard.innerHTML =
      '<div class="ac-quote"></div>'
    + '<div class="ac-colors">' + ANNO_ORDER.map(function (c) { return '<button type="button" data-color="' + c + '" style="background:' + ANNO_COLORS[c] + '" title="' + c + '"></button>'; }).join('') + '</div>'
    + '<textarea class="ac-input" rows="3" placeholder="写批注 / 注释（读者点击高亮即可看到）"></textarea>'
    + '<div class="ac-foot"><button type="button" class="ac-del">删除批注</button><button type="button" class="ac-done">完成</button></div>';
  document.body.appendChild(annoCard);
  var currentAnnoId = null;
  function closeAnnoCard() { annoCard.classList.remove('open'); currentAnnoId = null; }
  function paintColorDots() {
    var a = findAnno(currentAnnoId);
    $$('.ac-colors button', annoCard).forEach(function (b) { b.classList.toggle('sel', !!a && b.dataset.color === a.color); });
  }
  function openAnnoCard(id, rect) {
    var a = findAnno(id); if (!a) return;
    currentAnnoId = id;
    $('.ac-quote', annoCard).textContent = a.text;
    $('.ac-input', annoCard).value = (a.comment && a.comment.text) || '';
    paintColorDots();
    annoCard.classList.add('open');
    var w = 300, h = annoCard.offsetHeight || 190;
    var cx = rect ? rect.left : (window.innerWidth / 2 - w / 2);
    var x = Math.max(8, Math.min(cx, window.innerWidth - w - 8));
    var y = rect ? rect.bottom + 10 : (window.innerHeight / 2 - 100);
    if (rect && y + h > window.innerHeight - 8) y = rect.top - h - 10;
    annoCard.style.left = x + 'px'; annoCard.style.top = Math.max(8, y) + 'px';
  }
  $('.ac-done', annoCard).addEventListener('click', closeAnnoCard);
  $('.ac-input', annoCard).addEventListener('input', function () {
    var a = findAnno(currentAnnoId); if (a) { a.comment = a.comment || {}; a.comment.text = this.value; mark(); }
  });
  $$('.ac-colors button', annoCard).forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var a = findAnno(currentAnnoId); if (!a) return;
      a.color = b.dataset.color;
      $$('mark.notion-highlight', body).forEach(function (mk) {
        if (mk.dataset.annoId === a.id) { mk.dataset.color = a.color; mk.style.background = ANNO_COLORS[a.color] || ''; }
      });
      paintColorDots(); mark();
    });
  });
  $('.ac-del', annoCard).addEventListener('click', function () {
    var a = findAnno(currentAnnoId); if (!a) { closeAnnoCard(); return; }
    $$('mark.notion-highlight', body).forEach(function (mk) {
      if (mk.dataset.annoId !== a.id) return;
      var p = mk.parentNode;
      while (mk.firstChild) p.insertBefore(mk.firstChild, mk);
      p.removeChild(mk); if (p.normalize) p.normalize();
    });
    annotations = annotations.filter(function (x) { return x.id !== a.id; });
    closeAnnoCard(); mark();
  });
  document.addEventListener('mousedown', function (e) {
    if (!annoCard.classList.contains('open')) return;
    if (annoCard.contains(e.target)) return;
    if (e.target.closest && e.target.closest('mark.notion-highlight')) return;
    closeAnnoCard();
  }, true);

  function createAnnotationFromSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    if (!body.contains(range.commonAncestorContainer)) return;
    var startEl = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    var inMark = startEl && startEl.closest ? startEl.closest('mark.notion-highlight') : null;
    if (inMark && range.collapsed) { openAnnoCard(inMark.dataset.annoId, inMark.getBoundingClientRect()); return; }
    var text = sel.toString();
    if (!text.trim()) { toast('请先选中要批注的文字'); return; }
    if (inMark) { openAnnoCard(inMark.dataset.annoId, inMark.getBoundingClientRect()); return; }
    var id = genAnnoId();
    var mk = document.createElement('mark');
    mk.className = 'notion-highlight';
    mk.dataset.annoId = id; mk.dataset.color = 'yellow_background';
    mk.style.background = ANNO_COLORS.yellow_background;
    try { range.surroundContents(mk); }
    catch (e) { toast('选区跨了多种格式，请选连续的纯文本再加批注'); return; }
    annotations.push({ id: id, text: text, color: 'yellow_background', comment: { text: '' } });
    mark();
    var r = mk.getBoundingClientRect();
    sel.removeAllRanges();
    openAnnoCard(id, r);
    setTimeout(function () { var ta = $('.ac-input', annoCard); ta.focus(); }, 30);
  }

  // 单击已有高亮（非拖选）打开批注卡片
  body.addEventListener('click', function (e) {
    var mk = e.target.closest && e.target.closest('mark.notion-highlight');
    if (!mk || !mk.dataset.annoId) return;
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) openAnnoCard(mk.dataset.annoId, mk.getBoundingClientRect());
    }, 0);
  });

  function wrapAnnoText(a) {
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentNode && node.parentNode.closest && node.parentNode.closest('mark.notion-highlight,script,style')) continue;
      var idx = node.nodeValue.indexOf(a.text);
      if (idx === -1) continue;
      var range = document.createRange();
      range.setStart(node, idx); range.setEnd(node, idx + a.text.length);
      var mk = document.createElement('mark');
      mk.className = 'notion-highlight'; mk.dataset.annoId = a.id;
      mk.dataset.color = a.color || 'yellow_background';
      mk.style.background = ANNO_COLORS[mk.dataset.color] || ANNO_COLORS.yellow_background;
      try { range.surroundContents(mk); } catch (e) {}
      return true;
    }
    return false;
  }
  function decorateAnnos() {
    $$('mark.notion-highlight[data-anno-id]', body).forEach(function (mk) {
      var a = findAnno(mk.dataset.annoId);
      var colorKey = mk.dataset.color || (a && a.color) || 'yellow_background';
      mk.dataset.color = colorKey;
      mk.style.background = ANNO_COLORS[colorKey] || '';
      if (a) { a.text = mk.textContent; a.color = colorKey; }
    });
    annotations.forEach(function (a) {
      if ($$('mark.notion-highlight[data-anno-id="' + a.id + '"]', body).length) return;
      wrapAnnoText(a);
    });
  }

  window.__ne = window.__ne || {};
  window.__ne.setAnnotations = function (arr) {
    annotations = Array.isArray(arr) ? arr.slice() : [];
    decorateAnnos();
  };
  window.__ne.getAnnotations = function () {
    // 文字被删空的批注：移除空壳 mark
    $$('mark.notion-highlight[data-anno-id]', body).forEach(function (mk) {
      if (mk.textContent.trim()) return;
      var p = mk.parentNode; if (p) { p.removeChild(mk); if (p.normalize) p.normalize(); }
    });
    $$('mark.notion-highlight[data-anno-id]', body).forEach(function (mk) {
      var a = findAnno(mk.dataset.annoId);
      if (!a) annotations.push({ id: mk.dataset.annoId, text: mk.textContent, color: mk.dataset.color || 'yellow_background', comment: { text: '' } });
      else { a.text = mk.textContent; a.color = mk.dataset.color || a.color; }
    });
    var liveIds = $$('mark.notion-highlight[data-anno-id]', body).map(function (m) { return m.dataset.annoId; });
    return annotations.filter(function (a) { return liveIds.indexOf(a.id) !== -1; });
  };

  // ============================================================
  // 6. 结构化键盘：Tab / Enter / Backspace / 快捷键
  // ============================================================
  body.addEventListener('keydown', function (e) {
    var sel = window.getSelection();
    var node = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
    var block = node ? blockOf(node) : null;
    var inPre = node && (function () { var n = node; while (n && n !== body) { if (n.nodeName === 'PRE') return true; n = n.parentNode; } return false; })();
    var li = node && (function () { var n = node; while (n && n !== body) { if (n.nodeName === 'LI') return n; n = n.parentNode; } return null; })();

    // Tab：代码块插空格；列表缩进
    if (e.key === 'Tab' && block) {
      if (inPre) { e.preventDefault(); document.execCommand('insertText', false, '  '); return; }
      if (li) { e.preventDefault(); document.execCommand(e.shiftKey ? 'outdent' : 'indent'); mark(); return; }
    }
    // 空列表项回车退出列表
    if (e.key === 'Enter' && li && !e.shiftKey) {
      var txt = li.textContent.replace(/^\s*/, '');
      var hasCheck = li.querySelector('input[type=checkbox]');
      if (hasCheck) txt = txt.replace(/^\s*/, '');
      if (txt.trim() === '') {
        e.preventDefault();
        if (li.parentElement && li.parentElement.children.length === 1) {
          var list = li.parentElement;
          var p = el('p'); p.innerHTML = '<br>';
          list.parentNode.insertBefore(p, list.nextSibling); list.remove();
          placeCaret(p); mark();
        } else {
          li.remove(); exec('insertParagraph');
        }
        return;
      }
    }
    // 空引用回车退出
    if (e.key === 'Enter' && block && block.nodeName === 'BLOCKQUOTE' && block.textContent.trim() === '') {
      e.preventDefault(); transformBlock('p'); return;
    }
    // Backspace：空块回退正文
    if (e.key === 'Backspace' && block && !inPre) {
      if (/^H[1-6]$/.test(block.nodeName) && block.textContent === '') { e.preventDefault(); transformBlock('p'); return; }
      if (block.nodeName === 'BLOCKQUOTE' && block.textContent.trim() === '') { e.preventDefault(); transformBlock('p'); return; }
    }
    // 快捷键
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      var k = e.key.toLowerCase();
      if (k === 'k') { e.preventDefault(); doLink(); return; }
      if (e.shiftKey && k === 's') { e.preventDefault(); exec('strikeThrough'); return; }
      if (!e.shiftKey && k === 'e') { e.preventDefault(); wrapInlineCode(); return; }
      if (e.shiftKey && k === '7') { e.preventDefault(); exec('insertOrderedList'); return; }
      if (e.shiftKey && k === '8') { e.preventDefault(); exec('insertUnorderedList'); return; }
      if (e.shiftKey && k === '9') { e.preventDefault(); insertTask(); return; }
      if (e.shiftKey && (k === 'arrowup' || k === 'arrowdown')) {
        e.preventDefault(); var b = currentBlock(); if (b) moveBlock(b, k === 'arrowup' ? -1 : 1); return;
      }
      if (e.shiftKey && k === 'd') { e.preventDefault(); var cb = currentBlock(); if (cb) { var clone = cb.cloneNode(true); cb.parentNode.insertBefore(clone, cb.nextSibling); mark(); } return; }
    }
  });

  // ============================================================
  // 7. 新块：折叠 / Callout / 代码块 / 目录 / 书签 / Embed
  // ============================================================
  function insertToggle() {
    var d = el('details'); d.open = true;
    d.innerHTML = '<summary>折叠标题（点击 ▸ 可收起）</summary><p>折叠的内容写在这里…</p>';
    var nodes = insertBlock(d.outerHTML);
    setTimeout(function () { var sm = $$('summary', body).slice(-1)[0]; if (sm) { placeCaret(sm, true); document.execCommand('selectAllChildren', false, sm); } }, 0);
  }
  var CALLOUTS = { tip: ['💡', 'co-tip'], warning: ['⚠️', 'co-warning'], danger: ['❌', 'co-danger'], info: ['ℹ️', 'co-info'] };
  function insertCallout(type) {
    var c = CALLOUTS[type] || CALLOUTS.tip;
    var html = '<div class="callout ' + c[1] + '" data-type="' + type + '" contenteditable="false"><span class="co-icon" contenteditable="false">' + c[0] + '</span><div class="co-text" contenteditable="true">在这里写提示内容…</div></div>';
    var nodes = insertBlock(html);
    setTimeout(function () { var t = $$('.co-text', body).slice(-1)[0]; if (t) { placeCaret(t, true); document.execCommand('selectAllChildren', false, t); } }, 0);
  }
  // 点图标切换 callout 类型
  body.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('co-icon')) {
      var order = ['tip', 'warning', 'danger', 'info'];
      var box = e.target.closest('.callout');
      var cur = box.dataset.type || 'tip';
      var next = order[(order.indexOf(cur) + 1) % order.length];
      box.dataset.type = next;
      box.className = box.className.replace(/co-\w+/g, CALLOUTS[next][1]);
      e.target.textContent = CALLOUTS[next][0];
      mark();
    }
  });

  var CODE_LANGS = [['javascript','JS'],['typescript','TS'],['html','HTML'],['css','CSS'],['python','Python'],['java','Java'],['go','Go'],['rust','Rust'],['c','C'],['cpp','C++'],['csharp','C#'],['sql','SQL'],['bash','Bash'],['json','JSON'],['yaml','YAML'],['markdown','Markdown'],['xml','XML'],['plaintext','Text']];
  function insertCodeBlock(lang) {
    var l = lang || 'javascript';
    var html = '<pre><code class="language-' + l + '" data-lang="' + l + '"></code></pre>';
    var nodes = insertBlock(html);
    setTimeout(function () { var c = $$('pre code', body).slice(-1)[0]; if (c) placeCaret(c, true); }, 0);
  }
  // 代码块悬浮工具条
  var codeBar = el('div', 'ne-codebar');
  var selLang = el('select');
  CODE_LANGS.forEach(function (p) { var o = el('option'); o.value = p[0]; o.textContent = p[1]; selLang.appendChild(o); });
  var btnWrap = el('button', null, '自动换行'); btnWrap.type = 'button';
  var btnCopy = el('button', null, '复制'); btnCopy.type = 'button';
  codeBar.appendChild(selLang); codeBar.appendChild(btnWrap); codeBar.appendChild(btnCopy);
  document.body.appendChild(codeBar);
  var activePre = null;
  function showCodeBar(pre) {
    activePre = pre;
    var code = pre.querySelector('code');
    selLang.value = (code && (code.dataset.lang || (code.className.match(/language-([\w-]+)/) || [])[1])) || 'plaintext';
    codeBar.classList.add('open');
    var r = pre.getBoundingClientRect();
    codeBar.style.left = Math.max(8, r.right - 240) + 'px';
    codeBar.style.top = Math.max(8, r.top - 34) + 'px';
  }
  function hideCodeBar() { codeBar.classList.remove('open'); activePre = null; }
  selLang.onchange = function () {
    if (!activePre) return;
    var code = activePre.querySelector('code');
    if (code) { code.className = 'language-' + selLang.value; code.dataset.lang = selLang.value; mark(); }
  };
  btnWrap.onclick = function () { if (activePre) { activePre.classList.toggle('hl-wrap'); mark(); } };
  btnCopy.onclick = function () { if (activePre) { navigator.clipboard.writeText(activePre.innerText).then(function () { toast('代码已复制'); }); } };
  body.addEventListener('click', function (e) {
    var pre = e.target.closest ? e.target.closest('pre') : null;
    if (pre && body.contains(pre)) { showCodeBar(pre); } else if (!codeBar.contains(e.target)) hideCodeBar();
  });

  function insertToc() {
    var html = '<div class="toc-block" contenteditable="false"><div class="toc-b-title">📑 目录</div><ul class="toc-b-list"></ul></div>';
    insertBlock(html);
    refreshTocBlocks();
  }
  window.__neRefreshToc = refreshTocBlocks;
  function refreshTocBlocks() {
    $$('.toc-block', body).forEach(function (tb) {
      var ul = $('.toc-b-list', tb); if (!ul) return;
      var hs = $$('h1,h2,h3', body).filter(function (h) { return !tb.contains(h); });
      ul.innerHTML = hs.slice(0, 30).map(function (h) {
        return '<li class="' + (h.tagName === 'H3' ? 'h3' : '') + '">' + escHtml(h.textContent || '（空标题）') + '</li>';
      }).join('') || '<li style="list-style:none;color:#999">暂无标题</li>';
    });
  }
  var neDebounce = null;
  new MutationObserver(function () {
    clearTimeout(neDebounce);
    neDebounce = setTimeout(function () { refreshTocBlocks(); decorateBlocks(); decorateAnnos(); updateWordCount(); }, 120);
  }).observe(body, { childList: true, subtree: true, characterData: true });

  function insertBookmark() {
    var u = prompt('输入要收藏的网址：', 'https://');
    if (!u) return;
    if (!/^https?:\/\//.test(u)) u = 'https://' + u;
    var host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) {}
    var html = '<a class="bookmark-card" contenteditable="false" href="' + escHtml(u) + '" target="_blank" rel="noopener"><span class="bm-ic">🔖</span><span><span class="bm-tx">' + escHtml(host || u) + '</span><br><span class="bm-url">' + escHtml(u) + '</span></span></a>';
    insertBlock(html);
  }
  function insertEmbed() {
    var u = prompt('输入要嵌入的网页地址（支持 YouTube/B站/CodePen 等允许被嵌入的站点）：', 'https://');
    if (!u) return;
    if (!/^https?:\/\//.test(u)) u = 'https://' + u;
    insertBlock('<iframe src="' + escHtml(u) + '" allowfullscreen style="width:100%;height:420px;border:0;border-radius:12px"></iframe>');
  }

  // ============================================================
  // 8. 可视化表格
  // ============================================================
  var tg = el('div', 'ne-tablegrid');
  tg.innerHTML = '<div class="cells"></div><div class="tg-tip">移动鼠标选择表格大小</div>';
  document.body.appendChild(tg);
  var tgCells = $('.cells', tg), tgTip = $('.tg-tip', tg);
  for (var i = 0; i < 48; i++) { var ci = el('i'); tgCells.appendChild(ci); }
  function openTableGrid() {
    tg.classList.add('open');
    var br = gripBlock ? gripBlock.getBoundingClientRect() : { left: 200, bottom: 200 };
    tg.style.left = Math.min(window.innerWidth - 240, br.left) + 'px';
    tg.style.top = Math.min(window.innerHeight - 260, br.bottom + 6) + 'px';
  }
  function tgPaint(cols, rows) {
    $$('i', tgCells).forEach(function (c, idx) {
      var r = Math.floor(idx / 8), col = idx % 8;
      c.classList.toggle('on', r < rows && col < cols);
    });
    tgTip.textContent = cols + ' 列 × ' + rows + ' 行';
  }
  tgCells.addEventListener('mouseover', function (e) {
    if (e.target.tagName !== 'I') return;
    var idx = $$('i', tgCells).indexOf(e.target);
    tgPaint((idx % 8) + 1, Math.floor(idx / 8) + 1);
  });
  tgCells.addEventListener('click', function (e) {
    if (e.target.tagName !== 'I') return;
    var idx = $$('i', tgCells).indexOf(e.target);
    var cols = (idx % 8) + 1, rows = Math.floor(idx / 8) + 1 + 1; // 含表头
    tg.classList.remove('open');
    var html = '<table><thead><tr>' + '<th></th>'.repeat(cols) + '</tr></thead><tbody>'
      + new Array(rows - 1).fill('<tr>' + '<td></td>'.repeat(cols) + '</tr>').join('') + '</tbody></table>';
    insertBlock(html + '<p><br></p>');
  });
  document.addEventListener('click', function (e) { if (tg.classList.contains('open') && !tg.contains(e.target)) tg.classList.remove('open'); });

  var tblBar = el('div', 'ne-tblbar');
  tblBar.innerHTML = '<button data-a="rowBelow" title="下方加行">＋行</button><button data-a="rowAbove" title="上方加行">行＋</button>'
    + '<button data-a="colRight" title="右侧加列">＋列</button><button data-a="colLeft" title="左侧加列">列＋</button>'
    + '<button data-a="delRow" title="删除行">−行</button><button data-a="delCol" title="删除列">−列</button>'
    + '<button data-a="head" title="表头开关">表头</button><button data-a="alL">左</button><button data-a="alC">中</button><button data-a="alR">右</button>'
    + '<button data-a="bg">底色</button><button data-a="bgNone">无底色</button><button data-a="del" title="删除表格">🗑️</button>';
  document.body.appendChild(tblBar);
  var curCell = null;
  function showTblBar(cell) {
    curCell = cell;
    $$('td', cell.closest('table')).forEach(function (c) { c.classList.remove('cell-cursor'); });
    cell.classList.add('cell-cursor');
    tblBar.classList.add('open');
    var r = cell.closest('table').getBoundingClientRect();
    tblBar.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 430)) + 'px';
    tblBar.style.top = Math.max(8, r.top - 36) + 'px';
  }
  function hideTblBar() { tblBar.classList.remove('open'); curCell = null; }
  $$('button', tblBar).forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { tableAction(b.dataset.a); });
  });
  body.addEventListener('click', function (e) {
    var cell = e.target.closest && e.target.closest('td,th');
    if (cell && body.contains(cell)) showTblBar(cell);
    else if (!tblBar.contains(e.target)) hideTblBar();
  });
  function tableAction(a) {
    if (!curCell) return;
    var tbl = curCell.closest('table');
    var row = curCell.parentElement, rows = $$('tr', tbl);
    var ri = rows.indexOf(row), ci = $$(row.tagName === 'TR' ? ':scope > *' : '*', row).indexOf(curCell);
    if (a === 'rowBelow' || a === 'rowAbove') {
      var tr = el('tr'); var cols = $$(':scope > *', rows[0]).length;
      for (var j = 0; j < cols; j++) tr.appendChild(el('td'));
      row.parentNode.insertBefore(tr, a === 'rowBelow' ? row.nextSibling : row);
    } else if (a === 'delRow') { if (rows.length > 1) row.remove(); }
    else if (a === 'colRight' || a === 'colLeft') {
      rows.forEach(function (r2) {
        var cells = $$(':scope > th, :scope > td', r2);
        var tag = cells[0] && cells[0].tagName === 'TH' ? 'th' : 'td';
        var n = el(tag.toLowerCase());
        var ref = cells[Math.min(ci, cells.length - 1)];
        r2.insertBefore(n, a === 'colRight' ? ref.nextSibling : ref);
      });
    } else if (a === 'delCol') {
      rows.forEach(function (r2) { var cells = $$(':scope > th, :scope > td', r2); if (cells.length > 1 && cells[ci]) cells[ci].remove(); });
    } else if (a === 'head') {
      var thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody');
      if (thead) { var hr = thead.querySelector('tr'); $$('th', hr).forEach(function (th) { var td = el('td'); td.innerHTML = th.innerHTML; hr.replaceChild(td, th); }); tbody.insertBefore(hr, tbody.firstChild); thead.remove(); }
      else { var first = tbody.querySelector('tr'); var th = el('thead'); $$(':scope > td', first).forEach(function (td) { var h = el('th'); h.innerHTML = td.innerHTML; th.appendChild(h); td.remove(); }); th.appendChild(first); tbl.insertBefore(th, tbody); }
    } else if (a === 'alL' || a === 'alC' || a === 'alR') {
      curCell.style.textAlign = a === 'alL' ? 'left' : a === 'alC' ? 'center' : 'right';
    } else if (a === 'bg') {
      var colors = ['#5CE1E6', '#B18CFF', '#FF8CD9', '#FFD166', '#7CFFB2', '#FF7A5C'];
      var pick = colors[Math.floor(Math.random() * colors.length)];
      curCell.style.background = 'rgba(255,255,255,.12)';
      curCell.style.borderColor = pick;
    } else if (a === 'bgNone') { curCell.style.background = ''; curCell.style.borderColor = ''; }
    else if (a === 'del') { tbl.remove(); mark(); hideTblBar(); return; }
    mark();
    var nc = $$('td,th', tbl)[0]; if (nc) showTblBar(nc);
  }
  // 右键菜单里的表格项
  function tableMenuItems(cell) {
    return [
      { g: '表格' },
      { ic: '＋', t: '下方加行', fn: function () { curCell = cell; tableAction('rowBelow'); } },
      { ic: '＋', t: '右侧加列', fn: function () { curCell = cell; tableAction('colRight'); } },
      { ic: '−', t: '删除此行', fn: function () { curCell = cell; tableAction('delRow'); } },
      { ic: '−', t: '删除此列', fn: function () { curCell = cell; tableAction('delCol'); } },
      { ic: '🎨', t: '单元格底色', fn: function () { curCell = cell; tableAction('bg'); } },
      { ic: '🧊', t: '清除底色', fn: function () { curCell = cell; tableAction('bgNone'); } },
      { ic: '🗑️', t: '删除整个表格', fn: function () { curCell = cell; tableAction('del'); } }
    ];
  }

  // ============================================================
  // 9. 图片增强：图注 / alt / 链接 / 灯箱
  // ============================================================
  var lightbox = el('div', 'ne-lightbox');
  var lbImg = el('img'); lightbox.appendChild(lbImg);
  document.body.appendChild(lightbox);
  lightbox.addEventListener('click', function () { lightbox.classList.remove('open'); });
  body.addEventListener('dblclick', function (e) {
    if (e.target.tagName === 'IMG' && !e.target.closest('.site-preview,.bookmark-card')) {
      lbImg.src = e.target.src; lightbox.classList.add('open');
    }
  });
  // 扩展图片点选工具条（等待 editor.html 的 imgCtx 就绪）
  function enhanceImgCtx() {
    var imgCtx = document.getElementById('imgCtx');
    if (!imgCtx || imgCtx.dataset.neDone) return;
    imgCtx.dataset.neDone = '1';
    var btns = '<button data-ne="caption" title="添加/编辑图注">图注</button>'
      + '<button data-ne="alt" title="alt 替代文本">ALT</button>'
      + '<button data-ne="link" title="给图片加链接">🔗</button>'
      + '<button data-ne="zoom" title="放大查看">⛶</button>';
    imgCtx.insertAdjacentHTML('beforeend', btns);
    imgCtx.addEventListener('click', function (e) {
      var act = e.target.dataset && e.target.dataset.ne; if (!act || !window.activeImg && !window.__neActiveImg) return;
      var img = window.activeImg;
      if (!img) { // editor.html 的 activeImg 是闭包内变量，兜底从选中样式取
        img = $('.jerry-media-sel') || $('figure.jerry-media-sel img');
      }
      if (!img) return;
      if (act === 'zoom') { lbImg.src = img.src || img.querySelector('img').src; lightbox.classList.add('open'); return; }
      if (act === 'alt') { var a = prompt('图片 alt 替代文本（无障碍/加载失败时显示）：', img.alt || ''); if (a !== null) { img.alt = a; mark(); } return; }
      if (act === 'link') {
        var u = prompt('图片点击跳转的链接（留空取消链接）：', img.closest('a') ? img.closest('a').href : 'https://');
        if (u === null) return;
        if (!u) { var a0 = img.closest('a'); if (a0) a0.replaceWith(img); mark(); return; }
        if (!/^https?:\/\//.test(u)) u = 'https://' + u;
        var anc = document.createElement('a'); anc.href = u; anc.target = '_blank';
        img.parentNode.insertBefore(anc, img); anc.appendChild(img); mark(); return;
      }
      if (act === 'caption') { wrapFigure(img); return; }
    });
  }
  function wrapFigure(img) {
    var fig = img.closest('figure');
    if (!fig) {
      fig = el('figure');
      img.parentNode.insertBefore(fig, img);
      fig.appendChild(img);
      var cap = el('figcaption'); cap.textContent = '图片说明…'; fig.appendChild(cap);
      mark();
      setTimeout(function () { placeCaret(cap, true); document.execCommand('selectAllChildren', false, cap); }, 0);
    } else {
      var cap0 = fig.querySelector('figcaption');
      if (cap0) { var t = prompt('编辑图注（留空删除图注）：', cap0.textContent); if (t === null) return; if (t === '') cap0.remove(); else cap0.textContent = t; }
      else { var c = el('figcaption'); c.textContent = '图片说明…'; fig.appendChild(c); setTimeout(function () { placeCaret(c, true); }, 0); }
      mark();
    }
  }
  setTimeout(enhanceImgCtx, 300);

  // ============================================================
  // 10. 粘贴增强
  // ============================================================
  var ALLOWED_TAGS = { H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,P:1,BR:1,STRONG:1,B:1,EM:1,I:1,U:1,S:1,STRIKE:1,DEL:1,CODE:1,PRE:1,BLOCKQUOTE:1,UL:1,OL:1,LI:1,A:1,IMG:1,HR:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TH:1,TD:1,MARK:1,SUP:1,SUB:1,FIGURE:1,FIGCAPTION:1,VIDEO:1,SOURCE:1,IFRAME:1,DETAILS:1,SUMMARY:1,DIV:1,SPAN:1,INPUT:1 };
  function sanitizeHtml(node) {
    $$(':scope *', node).forEach(function (n) {
      if (!ALLOWED_TAGS[n.tagName]) { n.replaceWith(document.createTextNode(n.textContent)); return; }
      // 移除危险属性，仅保留白名单
      var keep = {};
      ['href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan', 'controls', 'preload', 'allowfullscreen', 'contenteditable', 'data-src', 'data-zip', 'data-name', 'data-w', 'data-ratio', 'data-href', 'data-size', 'data-icon', 'data-type', 'data-lang', 'checked', 'type', 'disabled'].forEach(function (at) {
        var v = n.getAttribute(at); if (v != null) keep[at] = v;
      });
      var style = n.getAttribute('style');
      if (style && /color|background|text-align|font-size|width|height|margin/i.test(style)) keep.style = style.replace(/position\s*:[^;]+;?/gi, '');
      n.getAttributeNames().forEach(function (at) { if (!(at in keep)) n.removeAttribute(at); });
      Object.keys(keep).forEach(function (at) { if (at !== 'style') n.setAttribute(at, keep[at]); else n.setAttribute('style', keep.style); });
      if (n.tagName === 'A') { n.setAttribute('rel', 'noopener noreferrer'); if ((n.getAttribute('href') || '').indexOf('javascript:') === 0) n.removeAttribute('href'); }
      if (n.tagName === 'INPUT' && n.getAttribute('type') === 'checkbox') { n.setAttribute('type', 'checkbox'); n.contentEditable = 'false'; }
      // 内容块 class 保留
      if (n.tagName === 'DIV') {
        var cls = n.getAttribute('class') || '';
        var okCls = ['callout','co-tip','co-warning','co-danger','co-info','co-icon','co-text','toc-block','toc-b-title','toc-b-list','site-preview','file-attach','sp-head','sp-title','sp-menu','sp-stage','sp-drop'].filter(function (c) { return cls.indexOf(c) >= 0; });
        if (okCls.length) n.setAttribute('class', okCls.join(' ')); else n.removeAttribute('class');
      }
    });
    return node;
  }
  body.addEventListener('paste', function (e) {
    var cd = e.clipboardData; if (!cd) return;
    // 1) 文件（截图/拖入的文件走 drop，粘贴主要是截图）
    var files = [];
    for (var i = 0; i < cd.items.length; i++) { var it = cd.items[i]; if (it.kind === 'file') { var f = it.getAsFile(); if (f) files.push(f); } }
    if (files.length) {
      e.preventDefault();
      files.forEach(function (f) {
        if (/^image\//.test(f.type)) doUpload(f);
        else if (/\.(zip|html?|htm)$/i.test(f.name)) doUploadPkg(f);
        else if (/^video\//.test(f.type) || /\.(mp4|webm|mov|m4v)$/i.test(f.name)) doUploadVideo(f);
        else doUploadAttach(f);
      });
      return;
    }
    var html = cd.getData('text/html');
    var text = cd.getData('text/plain');
    var sel = window.getSelection();
    var hasSel = sel && !sel.isCollapsed && body.contains(sel.getRangeAt(0).commonAncestorContainer);
    // 2) 纯 URL + 有选区 → 变链接
    if (!html && /^https?:\/\/\S+$/.test(text.trim()) && hasSel) {
      e.preventDefault();
      var r = sel.getRangeAt(0), linkText = r.toString(), a = el('a');
      a.href = text.trim(); a.textContent = linkText; a.target = '_blank';
      r.deleteContents(); r.insertNode(a); mark(); return;
    }
    // 3) HTML（网页/Word）→ 清洗
    if (html && /<(p|div|h[1-6]|span|table|ul|ol|img|br)[\s>]/i.test(html)) {
      e.preventDefault();
      try {
        var doc0 = new DOMParser().parseFromString(html, 'text/html');
        var clean = sanitizeHtml(doc0.body);
        var fragHtml = clean.innerHTML;
        document.execCommand('insertHTML', false, fragHtml);
        mark(); return;
      } catch (err) { /* 降级文本 */ }
    }
    // 4) Markdown 文本 → 渲染插入
    if (text && /(^|\n)\s{0,3}(#{1,6}\s|\*\*|-\s|\d+\.\s|>\s|```|\|.*\|\s*$)/m.test(text)) {
      e.preventDefault();
      document.execCommand('insertHTML', false, mdToHtml(text));
      if (window.__jerrySiteEmbedScan) window.__jerrySiteEmbedScan();
      mark(); return;
    }
    // 5) 普通文本：浏览器默认 insertText（保留换行），不拦截
  });

  // 11) 文件直接拖进正文
  body.addEventListener('drop', function (e) {
    var dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      e.preventDefault(); e.stopPropagation();
      Array.prototype.slice.call(dt.files).forEach(function (f) {
        if (/^image\//.test(f.type)) doUpload(f);
        else if (/\.(zip|html?|htm)$/i.test(f.name)) doUploadPkg(f);
        else if (/^video\//.test(f.type) || /\.(mp4|webm|mov|m4v)$/i.test(f.name)) doUploadVideo(f);
        else doUploadAttach(f);
      });
    }
  }, true);

  // ============================================================
  // 12. 字数统计
  // ============================================================
  var wordBar = el('div', 'ne-wordbar');
  document.body.appendChild(wordBar);
  function updateWordCount() {
    var txt = body.innerText.replace(/\u200b/g, '');
    var cjk = (txt.match(/[\u4e00-\u9fa5]/g) || []).length;
    var words = (txt.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
    var total = cjk + words;
    var mins = Math.max(1, Math.round(total / 400));
    wordBar.innerHTML = '<span>字数 <b>' + total + '</b></span><span>字符 <b>' + txt.replace(/\s/g, '').length + '</b></span><span>约读 <b>' + mins + '</b> 分钟</span>';
  }
  body.addEventListener('input', updateWordCount);
  updateWordCount();
  refreshTocBlocks();
  decorateBlocks();
  decorateAnnos();

  // 对外暴露（与批注模块提前挂载的方法合并，勿整体覆盖）
  window.__ne = Object.assign(window.__ne || {}, { insertToggle: insertToggle, insertCallout: insertCallout, insertCodeBlock: insertCodeBlock, insertToc: insertToc, refreshToc: refreshTocBlocks });
})();
