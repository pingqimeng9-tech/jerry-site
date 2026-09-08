/* ============================================================
   Jerry CMS · 页面模块化包含机制（partials loader）
   ------------------------------------------------------------
   用法：把可复用区块抽成 partials/xxx.html，页面里放占位：
     <div data-include="/partials/xxx.html"></div>
   并在 </body> 前引入：<script src="/partials/include.js"></script>
   本脚本会把占位替换为区块内容；支持 {{KEY}} 占位符（值来自
   占位元素的 data-* 属性，如 data-id → {{ID}}）。
   注意：需要 http(s) 服务（本地 server.js 或线上托管均可），
   直接双击 file:// 打开时占位保持原样。
   ============================================================ */
(function () {
  document.querySelectorAll('[data-include]').forEach(function (el) {
    var url = el.getAttribute('data-include');
    fetch(url)
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(r.status)); })
      .then(function (html) {
        Array.prototype.forEach.call(el.attributes, function (attr) {
          if (attr.name.indexOf('data-') === 0 && attr.name !== 'data-include') {
            html = html.split('{{' + attr.name.slice(5).toUpperCase() + '}}').join(attr.value);
          }
        });
        el.outerHTML = html;
      })
      .catch(function () { /* 静默：保留占位，方便排查 */ });
  });
})();
