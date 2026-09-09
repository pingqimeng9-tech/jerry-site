/* ============================================================
   Jerry 评论组件（单文件复用）
   用法：JerryComments.mount(容器元素, target)
     target 形如 "moment:xxx" / "post:xxx" / "site:guestbook"
   优先走本地 CMS /api/comments（本地可用）；
   若站点配置了 Gitalk 且为文章页，由 post.html 自行切换。
   ============================================================ */
(function () {
  if (window.JerryComments) return;

  var STYLE = '.jc-item{display:flex;gap:10px;padding:8px 0;font-size:13.5px}' +
    '.jc-item .who{font-weight:700;color:#5CE1E6;flex:none}' +
    '.jc-item .when{color:#c9c6e8;font-size:11px;margin-left:auto;flex:none;font-family:JetBrains Mono,monospace}' +
    '.jc-item .txt{color:#e8e6fb;line-height:1.7;word-break:break-word}' +
    '.jc-form{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}' +
    '.jc-form input{flex:0 0 130px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:9px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit}' +
    '.jc-form input:focus{border-color:#5CE1E6}' +
    '.jc-form input.jc-text{flex:1 1 200px}' +
    '.jc-form button{background:linear-gradient(120deg,#FF7A5C,#FF8CD9);border:none;border-radius:10px;color:#fff;padding:0 18px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px}' +
    '.jc-empty{color:#c9c6e8;font-size:12.5px;padding:6px 0;opacity:.8}';
  if (!document.getElementById('jerry-cmt-style')) {
    var st = document.createElement('style');
    st.id = 'jerry-cmt-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function fmtDate(s) { return (s || '').replace('T', ' ').slice(0, 16); }

  function mount(container, target) {
    container.innerHTML = '<div class="jc-empty">评论加载中…</div>';
    var name = localStorage.getItem('jerry_cmt_name') || '';
    fetch('/api/comments?target=' + encodeURIComponent(target))
      .then(function (r) { return r.json(); })
      .then(function (d) { render((d && d.items) || []); })
      .catch(function () { container.innerHTML = '<div class="jc-empty">评论功能需要本地 CMS 服务</div>'; });

    function render(items) {
      container.innerHTML =
        (items.length ? '' : '<div class="jc-empty">还没有评论，来抢沙发～</div>') +
        items.map(function (c) {
          return '<div class="jc-item"><span class="who">' + esc(c.name) + '</span>' +
            '<span class="txt">' + esc(c.text) + '</span>' +
            '<span class="when">' + esc(fmtDate(c.date)) + '</span></div>';
        }).join('') +
        '<div class="jc-form">' +
        '<input class="jc-name" placeholder="昵称" maxlength="24" value="' + esc(name) + '">' +
        '<input class="jc-text" placeholder="说点什么…" maxlength="1000">' +
        '<button type="button">发送</button></div>';
      var nameI = container.querySelector('.jc-name');
      var textI = container.querySelector('.jc-text');
      var btn = container.querySelector('.jc-form button');
      function submit() {
        var t = textI.value.trim();
        if (!t) return;
        name = nameI.value.trim();
        if (name) localStorage.setItem('jerry_cmt_name', name);
        btn.disabled = true; btn.textContent = '…';
        fetch('/api/comments/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: target, name: name || '匿名', text: t })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d.ok) { items.unshift(d.item); render(items); }
          else { btn.disabled = false; btn.textContent = '发送'; alert(d.error || '发送失败'); }
        }).catch(function () { btn.disabled = false; btn.textContent = '发送'; });
      }
      btn.addEventListener('click', submit);
      textI.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    }
  }

  window.JerryComments = { mount: mount };
})();
