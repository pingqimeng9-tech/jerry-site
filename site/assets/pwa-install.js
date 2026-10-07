(function () {
  if (window.__EMBED || window.__jerryPwaInstall) return;
  window.__jerryPwaInstall = true;

  var deferredPrompt = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    render();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    close();
  });

  function render() {
    if (!dialog) return;
    var text = dialog.querySelector('.pwa-install-copy');
    var button = dialog.querySelector('.pwa-install-action');
    if (deferredPrompt) {
      text.textContent = '安装 Jerry-site 到设备后，可以从主屏幕直接打开。';
      button.hidden = false;
    } else if (ios) {
      text.textContent = '请在 Safari 中点“分享”，再选择“添加到主屏幕”，即可安装 Jerry-site。';
      button.hidden = true;
    } else {
      text.textContent = '如果没有出现一键安装按钮，请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。';
      button.hidden = true;
    }
  }

  function close() {
    if (dialog) dialog.hidden = true;
  }

  function open() {
    if (standalone || !dialog) return;
    render();
    dialog.hidden = false;
  }

  var style = document.createElement('style');
  style.textContent = [
    '.pwa-install-overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
    '.pwa-install-overlay[hidden]{display:none}',
    '.pwa-install-card{position:relative;width:min(420px,100%);padding:28px 24px 22px;border:1px solid rgba(255,255,255,.17);border-radius:24px;background:#171717;color:#f5f3ed;box-shadow:0 24px 80px #0009;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}',
    '.pwa-install-icon{width:84px;height:84px;margin:0 auto 16px;border-radius:20px;box-shadow:0 8px 24px #0008}',
    '.pwa-install-card h2{margin:0 32px 8px;font-size:22px;line-height:1.3;font-weight:700}',
    '.pwa-install-copy{margin:0 auto 20px;max-width:330px;color:#c6c3bb;font-size:14px}',
    '.pwa-install-action,.pwa-install-later{width:100%;min-height:46px;border:0;border-radius:12px;font:600 15px system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}',
    '.pwa-install-action{margin-bottom:9px;background:#f2eee4;color:#171717}',
    '.pwa-install-action[hidden]{display:none}',
    '.pwa-install-later{background:transparent;color:#c6c3bb}',
    '.pwa-install-close{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:#ffffff12;color:#eee;font-size:21px;cursor:pointer}',
    '@media(prefers-reduced-motion:no-preference){.pwa-install-card{animation:pwa-install-enter .22s ease-out}}',
    '@keyframes pwa-install-enter{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}'
  ].join('');
  document.head.appendChild(style);

  var dialog = document.createElement('div');
  dialog.className = 'pwa-install-overlay';
  dialog.hidden = true;
  dialog.innerHTML = '<section class="pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">' +
    '<button class="pwa-install-close" type="button" aria-label="关闭">×</button>' +
    '<img class="pwa-install-icon" src="/icons/icon-192.png" alt="Jerry-site 图标">' +
    '<h2 id="pwa-install-title">安装 Jerry-site</h2>' +
    '<p class="pwa-install-copy"></p>' +
    '<button class="pwa-install-action" type="button" hidden>安装到设备</button>' +
    '<button class="pwa-install-later" type="button">暂不安装</button>' +
    '</section>';
  document.body.appendChild(dialog);

  dialog.querySelector('.pwa-install-close').addEventListener('click', close);
  dialog.querySelector('.pwa-install-later').addEventListener('click', close);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
  dialog.querySelector('.pwa-install-action').addEventListener('click', async function () {
    if (!deferredPrompt) return;
    var promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      if (!standalone) render();
    } catch (error) {
      console.error('PWA installation prompt failed:', error);
      render();
    }
  });

  var installButton = document.getElementById('dbtn');
  if (installButton) installButton.addEventListener('click', open);

  var isSecureOrigin = location.protocol === 'https:' ||
    (location.protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
  if ('serviceWorker' in navigator && isSecureOrigin) {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.error('Service worker registration failed:', error);
    });
  }

  if (!standalone) window.setTimeout(open, 800);
})();
