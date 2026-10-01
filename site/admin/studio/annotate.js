/* ============================================================
 * annotate.js — 图片圈画标注器（Jerry CMS）
 * 在图片上画 箭头 / 矩形框 / 椭圆红圈 / 自由画笔 / 文字，
 * 导出合成 PNG 并上传（/api/upload，本地与线上管理员模式均可用），
 * 产物就是普通图片，前台无需任何特殊渲染。
 * 入口：window.openImageAnnotator(imgEl, onDoneUrl)
 * ============================================================ */
(function () {
  if (window.__neAnnotator) return;

  var CSS = ''
    + '.ne-anno-overlay{position:fixed;inset:0;z-index:10020;background:rgba(8,6,18,.92);display:none;flex-direction:column;backdrop-filter:blur(8px);font-family:inherit}'
    + '.ne-anno-overlay.open{display:flex}'
    + '.ne-anno-bar{display:flex;align-items:center;gap:6px;padding:10px 14px;background:rgba(20,16,40,.96);border-bottom:1px solid rgba(255,255,255,.12);flex-wrap:wrap}'
    + '.ne-anno-bar .ab-title{font-size:13px;font-weight:700;color:#fff;margin-right:10px}'
    + '.ne-anno-bar button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#eee;border-radius:9px;padding:7px 12px;font-size:13px;cursor:pointer;font-family:inherit}'
    + '.ne-anno-bar button:hover{background:rgba(92,225,230,.18)}'
    + '.ne-anno-bar button.active{background:rgba(92,225,230,.28);border-color:#5ce1e6;color:#fff}'
    + '.ne-anno-bar button.primary{background:linear-gradient(135deg,#5ce1e6,#b18cff);color:#0b0918;font-weight:700;border:none}'
    + '.ne-anno-bar button.danger{color:#ff9c8a;border-color:rgba(255,122,92,.4)}'
    + '.ne-anno-bar .ab-sep{width:1px;height:22px;background:rgba(255,255,255,.15);margin:0 4px}'
    + '.ne-anno-bar .ab-swatch{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.35);cursor:pointer;padding:0}'
    + '.ne-anno-bar .ab-swatch.active{outline:2px solid #5ce1e6;outline-offset:2px}'
    + '.ne-anno-stage{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:24px}'
    + '.ne-anno-canvas-wrap{position:relative;box-shadow:0 20px 80px rgba(0,0,0,.7);border-radius:6px;line-height:0;background:#fff}'
    + '.ne-anno-canvas-wrap canvas{display:block;max-width:92vw;max-height:78vh;cursor:crosshair;touch-action:none}'
    + '.ne-anno-hint{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);font-size:11px;color:rgba(255,255,255,.55);background:rgba(0,0,0,.4);padding:6px 14px;border-radius:999px}'
    + '.ne-anno-toast{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:rgba(20,16,40,.98);border:1px solid rgba(255,255,255,.2);color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;z-index:10021;display:none}'
    + '@media (max-width:720px){'
    + '.ne-anno-bar{padding:8px 10px;gap:5px;max-height:30dvh;overflow-y:auto;align-content:center}'
    + '.ne-anno-bar .ab-title{display:none}'
    + '.ne-anno-bar button{padding:9px 11px;font-size:12.5px;min-height:40px;border-radius:9px}'
    + '.ne-anno-bar .ab-swatch{width:30px;height:30px;min-height:30px;padding:0}'
    + '.ne-anno-bar .ab-sep{height:20px;margin:0 2px}'
    + '.ne-anno-stage{padding:10px;align-items:flex-start;padding-top:14px}'
    + '.ne-anno-canvas-wrap canvas{max-width:96vw;max-height:56dvh}'
    + '.ne-anno-hint{font-size:10px;padding:5px 10px;max-width:90vw;text-align:center;bottom:calc(8px + env(safe-area-inset-bottom))}'
    + '}'
    + '@media (max-width:900px) and (max-height:480px){.ne-anno-canvas-wrap canvas{max-height:70dvh}.ne-anno-stage{padding-top:8px}}';

  var TOOLS = [
    { id: 'arrow', ic: '↗', t: '箭头' },
    { id: 'rect', ic: '▭', t: '矩形框' },
    { id: 'ellipse', ic: '◯', t: '椭圆/红圈' },
    { id: 'pen', ic: '✏️', t: '自由画笔' },
    { id: 'text', ic: 'T', t: '文字' }
  ];
  var COLORS = ['#ff3b30', '#ffcc00', '#111111', '#ffffff', '#0a84ff', '#34c759'];
  var WIDTHS = [2, 4, 8];

  var overlay, stage, wrap, canvas, ctx, hint, toastEl;
  var natW = 0, natH = 0, dispW = 0, dispH = 0;
  var strokes = [], tool = 'arrow', color = '#ff3b30', lineW = 4;
  var drawing = false, startPt = null, curPt = null, curPen = null;
  var targetImg = null, doneCb = null;

  function inject() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    overlay = document.createElement('div'); overlay.className = 'ne-anno-overlay';
    overlay.innerHTML =
      '<div class="ne-anno-bar">' +
      '<span class="ab-title">✏️ 图片圈画标注</span>' +
      TOOLS.map(function (t) { return '<button type="button" data-tool="' + t.id + '" title="' + t.t + '">' + t.ic + ' ' + t.t + '</button>'; }).join('') +
      '<span class="ab-sep"></span>' +
      COLORS.map(function (c) { return '<button type="button" class="ab-swatch" data-color="' + c + '" style="background:' + c + '" title="颜色"></button>'; }).join('') +
      '<span class="ab-sep"></span>' +
      WIDTHS.map(function (w) { return '<button type="button" data-w="' + w + '" title="线宽 ' + w + '">' + (w === 2 ? '细' : w === 4 ? '中' : '粗') + '</button>'; }).join('') +
      '<span class="ab-sep"></span>' +
      '<button type="button" id="abUndo" title="撤销 (Ctrl+Z)">↩️ 撤销</button>' +
      '<button type="button" id="abClear" class="danger" title="清空标注">🗑 清空</button>' +
      '<span style="flex:1"></span>' +
      '<button type="button" id="abCancel">取消</button>' +
      '<button type="button" class="primary" id="abDone">✅ 完成并替换图片</button>' +
      '</div>' +
      '<div class="ne-anno-stage"><div class="ne-anno-canvas-wrap"><canvas></canvas></div></div>' +
      '<div class="ne-anno-hint">拖动绘制；文字工具点击图片后输入；完成后标注会与图片合成为一张新图</div>' +
      '<div class="ne-anno-toast"></div>';
    document.body.appendChild(overlay);
    wrap = overlay.querySelector('.ne-anno-canvas-wrap');
    canvas = overlay.querySelector('canvas');
    ctx = canvas.getContext('2d');
    hint = overlay.querySelector('.ne-anno-hint');
    toastEl = overlay.querySelector('.ne-anno-toast');

    overlay.querySelectorAll('[data-tool]').forEach(function (b) {
      b.onclick = function () { tool = b.dataset.tool; syncBtns(); };
    });
    overlay.querySelectorAll('[data-color]').forEach(function (b) {
      b.onclick = function () { color = b.dataset.color; syncBtns(); };
    });
    overlay.querySelectorAll('[data-w]').forEach(function (b) {
      b.onclick = function () { lineW = +b.dataset.w; syncBtns(); };
    });
    overlay.querySelector('#abUndo').onclick = undo;
    overlay.querySelector('#abClear').onclick = function () { if (strokes.length && confirm('确定清空全部标注？')) { strokes = []; redraw(); } };
    overlay.querySelector('#abCancel').onclick = close;
    overlay.querySelector('#abDone').onclick = finish;
    document.addEventListener('keydown', onKey, true);
    bindCanvas();
    syncBtns();
  }

  function syncBtns() {
    overlay.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('active', b.dataset.tool === tool); });
    overlay.querySelectorAll('[data-color]').forEach(function (b) { b.classList.toggle('active', b.dataset.color === color); });
    overlay.querySelectorAll('[data-w]').forEach(function (b) { b.classList.toggle('active', +b.dataset.w === lineW); });
  }

  function showToast(msg) {
    toastEl.textContent = msg; toastEl.style.display = 'block';
    clearTimeout(showToast._t); showToast._t = setTimeout(function () { toastEl.style.display = 'none'; }, 2600);
  }

  function onKey(e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  }

  function toNat(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (natW / r.width),
      y: (clientY - r.top) * (natH / r.height)
    };
  }

  function bindCanvas() {
    var pos = function (e) {
      var p = e.touches && e.touches[0] ? e.touches[0] : e;
      return toNat(p.clientX, p.clientY);
    };
    var down = function (e) {
      if (!natW || !natH) { showToast('图片尚未载入完成，请稍候'); return; }
      e.preventDefault();
      var p = pos(e);
      if (tool === 'text') {
        var txt = prompt('输入要标注的文字：');
        if (txt && txt.trim()) { strokes.push({ tool: 'text', x: p.x, y: p.y, text: txt.trim(), color: color, size: Math.round(natW / 28) }); redraw(); }
        return;
      }
      drawing = true; startPt = p; curPt = p;
      if (tool === 'pen') { curPen = { tool: 'pen', color: color, width: lineW, points: [[p.x, p.y]] }; strokes.push(curPen); }
    };
    var move = function (e) {
      if (!drawing) return; e.preventDefault();
      var p = pos(e); curPt = p;
      if (tool === 'pen' && curPen) { curPen.points.push([p.x, p.y]); }
      redraw(true);
    };
    var up = function () {
      if (!drawing) return;
      drawing = false;
      if (tool !== 'pen' && startPt && curPt) {
        var dist = Math.hypot(curPt.x - startPt.x, curPt.y - startPt.y);
        if (dist > 4) strokes.push({ tool: tool, color: color, width: lineW, x1: startPt.x, y1: startPt.y, x2: curPt.x, y2: curPt.y });
      }
      curPen = null; startPt = null; curPt = null; redraw();
    };
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }

  function undo() { strokes.pop(); redraw(); }

  function drawArrow(c, s) {
    var x1 = s.x1, y1 = s.y1, x2 = s.x2, y2 = s.y2;
    c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.width; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1), head = Math.max(14, s.width * 4);
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    c.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    c.closePath(); c.fill();
  }

  function redraw(preview) {
    ctx.clearRect(0, 0, natW, natH);
    if (window.__annoBase) ctx.drawImage(window.__annoBase, 0, 0, natW, natH);
    strokes.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (s.tool === 'arrow') { drawArrow(ctx, s); }
      else if (s.tool === 'rect') { ctx.beginPath(); ctx.strokeRect(Math.min(s.x1, s.x2), Math.min(s.y1, s.y2), Math.abs(s.x2 - s.x1), Math.abs(s.y2 - s.y1)); }
      else if (s.tool === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, Math.abs(s.x2 - s.x1) / 2, Math.abs(s.y2 - s.y1) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.tool === 'pen') {
        if (!s.points.length) return;
        ctx.beginPath(); ctx.moveTo(s.points[0][0], s.points[0][1]);
        for (var i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1]);
        ctx.stroke();
      } else if (s.tool === 'text') {
        ctx.font = 'bold ' + s.size + 'px sans-serif';
        ctx.lineWidth = Math.max(2, s.size / 12); ctx.strokeStyle = s.color === '#ffffff' ? 'rgba(0,0,0,.55)' : '#ffffff';
        ctx.strokeText(s.text, s.x, s.y);
        ctx.fillText(s.text, s.x, s.y);
      }
    });
    // 正在拖拽中的形状预览
    if (preview && drawing && startPt && curPt && tool !== 'pen') {
      var ps = { tool: tool, color: color, width: lineW, x1: startPt.x, y1: startPt.y, x2: curPt.x, y2: curPt.y };
      if (tool === 'arrow') drawArrow(ctx, ps);
      else if (tool === 'rect') { ctx.beginPath(); ctx.strokeRect(Math.min(ps.x1, ps.x2), Math.min(ps.y1, ps.y2), Math.abs(ps.x2 - ps.x1), Math.abs(ps.y2 - ps.y1)); }
      else if (tool === 'ellipse') { ctx.beginPath(); ctx.ellipse((ps.x1 + ps.x2) / 2, (ps.y1 + ps.y2) / 2, Math.abs(ps.x2 - ps.x1) / 2, Math.abs(ps.y2 - ps.y1) / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
  }

  function open(imgEl, onDone) {
    if (!overlay) inject();
    targetImg = imgEl; doneCb = onDone || null; strokes = [];
    natW = 0; natH = 0; window.__annoBase = null;
    overlay.classList.add('open');
    showToast('正在载入图片…');
    var done = false;
    var fail = function (msg) {
      if (done) return; done = true;
      showToast(msg || '图片载入失败：外部域名图片可能禁止读取，请先把图片上传到本站图床再标注');
    };
    var timer = setTimeout(function () { fail('图片载入超时，请检查网络或改用已上传到本站的图片'); }, 12000);
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      if (done) return; done = true; clearTimeout(timer);
      natW = im.naturalWidth; natH = im.naturalHeight;
      if (!natW || !natH) { fail('图片尺寸异常，无法标注'); return; }
      canvas.width = natW; canvas.height = natH;
      var base = document.createElement('canvas');
      base.width = natW; base.height = natH;
      var bc = base.getContext('2d');
      try {
        bc.fillStyle = '#fff'; bc.fillRect(0, 0, natW, natH); bc.drawImage(im, 0, 0, natW, natH);
        // 跨域污染探测：此时 drawImage 未必立刻抛错，finish 时 toDataURL 还会再校验
      } catch (e) { fail('图片跨域受限，无法读取像素，请先上传到本站'); return; }
      window.__annoBase = base;
      redraw(); showToast('');
    };
    im.onerror = function () { clearTimeout(timer); fail(); };
    im.src = imgEl.src;
  }

  function close() { overlay.classList.remove('open'); window.__annoBase = null; targetImg = null; doneCb = null; }

  function finish() {
    try {
      var dataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      showToast('图片来自外部域名且不允许跨域读取，请先把它上传到本地图床后再标注');
      return;
    }
    showToast('⏳ 正在合成并上传…');
    var payload = JSON.stringify({ filename: 'annotated-' + Date.now() + '.png', base64: dataUrl, dir: 'images/posts' });
    fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok && d.url) {
          if (doneCb) doneCb(d.url);
          else if (targetImg) { targetImg.src = d.url; targetImg.setAttribute('data-w', targetImg.getAttribute('data-w') || '100%'); }
          showToast('✅ 标注图已生成'); setTimeout(close, 500);
        } else {
          // 上传失败：退回直接内嵌 dataURL（图不大时可用）
          if (confirm('标注图上传失败（' + (d.error || '未知错误') + '）。\n确定要把标注图直接内嵌进文章吗？（图片较大时不建议）')) {
            if (doneCb) doneCb(dataUrl); else if (targetImg) targetImg.src = dataUrl;
            close();
          }
        }
      })
      .catch(function (e) { showToast('上传异常：' + e.message); });
  }

  window.openImageAnnotator = open;
  window.__neAnnotator = true;
})();
