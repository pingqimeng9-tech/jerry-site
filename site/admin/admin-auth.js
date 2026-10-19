/* ============================================================
 * admin-auth.js — Jerry CMS 后台门禁（/admin/ 四个后台页）
 * 1) 本地（localhost/127.0.0.1）：完全放行，接口由本地 server.js 提供
 * 2) 线上：管理员邮箱验证码登录，服务端校验白名单后签发自包含会话
 * 依赖：本文件之前先引入 /admin/studio/cms-adapter.js
 * ============================================================ */
(function () {
  'use strict';

  var Adapter = window.JerryCmsAdapter;
  if (!Adapter) { console.error('cms-adapter.js 未加载'); return; }
  if (Adapter.isLocal) return;

  var otpToken = '';

  function showGate(onSuccess) {
    document.body.style.overflow = 'hidden';
    var mask = document.createElement('div');
    mask.id = 'aa-mask';
    mask.innerHTML =
      '<style>' +
      '#aa-mask{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;' +
      'background:radial-gradient(1200px 600px at 50% -10%,rgba(177,140,255,.18),transparent),#0b0918;font-family:inherit}' +
      '.aa-card{width:min(420px,92vw);padding:38px 34px 30px;border-radius:22px;background:rgba(255,255,255,.05);' +
      'border:1px solid rgba(177,140,255,.35);box-shadow:0 30px 80px rgba(0,0,0,.55);text-align:center}' +
      '.aa-logo{font-size:40px;margin-bottom:10px}.aa-card h2{margin:0 0 6px;font-size:21px;color:#f3efff}' +
      '.aa-sub{color:#a99fce;font-size:12.5px;line-height:1.7;margin-bottom:24px}' +
      '.aa-card input{width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.14);' +
      'background:rgba(0,0,0,.28);color:#fff;font-size:14px;outline:none;margin-bottom:12px}' +
      '.aa-card input:focus{border-color:#b18cff}' +
      '.aa-card button{width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;font-size:14px;font-weight:700;margin-bottom:10px}' +
      '#aa-send{background:linear-gradient(120deg,#b18cff,#5ce1e6);color:#fff}' +
      '#aa-verify{background:#fff;color:#241d3d}' +
      '#aa-verify:disabled,#aa-send:disabled{opacity:.55;cursor:not-allowed}' +
      '#aa-msg{min-height:20px;font-size:12.5px;line-height:1.6;margin-top:4px;color:#ff9db4}' +
      '#aa-msg.ok{color:#7ff0d6}' +
      '</style>' +
      '<div class="aa-card">' +
      '<div class="aa-logo">🔐</div>' +
      '<h2>Jerry CMS 管理员登录</h2>' +
      '<div class="aa-sub">线上后台仅对站长开放。<br>请输入管理员邮箱，收取一次性验证码登录。</div>' +
      '<input id="aa-email" type="email" autocomplete="email" placeholder="管理员邮箱">' +
      '<button id="aa-send">发送验证码</button>' +
      '<input id="aa-code" type="text" inputmode="numeric" maxlength="8" autocomplete="one-time-code" placeholder="输入邮箱收到的 8 位验证码" style="display:none;letter-spacing:4px">' +
      '<button id="aa-verify" style="display:none">验证并进入后台</button>' +
      '<div id="aa-msg"></div>' +
      '</div>';
    document.body.appendChild(mask);

    var msgEl = mask.querySelector('#aa-msg');
    function msg(t, ok) { msgEl.textContent = t; msgEl.className = ok ? 'ok' : ''; }
    var sendBtn = mask.querySelector('#aa-send'), verBtn = mask.querySelector('#aa-verify');
    var codeInput = mask.querySelector('#aa-code'), emailInput = mask.querySelector('#aa-email');

    sendBtn.addEventListener('click', async function () {
      var email = emailInput.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg('请输入有效的邮箱地址');
      sendBtn.disabled = true; sendBtn.textContent = '发送中…'; msg('');
      try {
        var r = await fetch('/api/assist?do=send-code', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email })
        });
        var d = await r.json();
        if (!d.ok) throw new Error(d.error || '发送失败');
        otpToken = d.otp_token || '';
        codeInput.style.display = 'block'; verBtn.style.display = 'block';
        codeInput.focus();
        msg('验证码已发送至该邮箱，' + (d.ttl || 10) + ' 分钟内有效（若收件箱没有请查垃圾邮件）', true);
        var left = 60; sendBtn.textContent = '重新发送（' + left + 's）';
        var timer = setInterval(function () {
          left--; if (left <= 0) { clearInterval(timer); sendBtn.disabled = false; sendBtn.textContent = '重新发送验证码'; }
          else sendBtn.textContent = '重新发送（' + left + 's）';
        }, 1000);
      } catch (e) {
        sendBtn.disabled = false; sendBtn.textContent = '发送验证码'; msg(e.message);
      }
    });

    verBtn.addEventListener('click', async function () {
      var email = emailInput.value.trim().toLowerCase();
      var code = codeInput.value.trim();
      if (!otpToken) return msg('请先点击发送验证码');
      if (code.length !== 8) return msg('请输入完整的 8 位验证码');
      verBtn.disabled = true; verBtn.textContent = '验证中…';
      try {
        var r = await fetch('/api/assist?do=verify-code', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, code: code, token: otpToken })
        });
        var d = await r.json();
        if (!d.ok) throw new Error(d.error || '验证失败');
        if (!d.session) throw new Error('登录失败，请重试');
        Adapter.setToken(d.session);
        location.reload();
      } catch (e) {
        verBtn.disabled = false; verBtn.textContent = '验证并进入后台'; msg(e.message);
      }
    });
  }

  function boot() {
    if (Adapter.getToken()) {
      Adapter.install();
      return;
    }
    showGate(function () { Adapter.install(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
