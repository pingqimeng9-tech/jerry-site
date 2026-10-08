// Jerry-site Service Worker
// 策略：首页运行时与模板资源网络优先；不碰 /api/ 和 /admin
const CACHE = 'jerry-site-v1';
const HOMEPAGE_ASSETS = new Set(['/assets/index.css', '/assets/index-runtime.js', '/assets/template-registry.js']);

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return;

  if (HOMEPAGE_ASSETS.has(url.pathname) || url.pathname.startsWith('/assets/templates/')) {
    if (req.cache === 'force-cache') {
      event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
      return;
    }
    const network = fetch(req);
    event.waitUntil(
      network.then((res) => {
        if (res.ok) return caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
      }).catch((error) => console.warn('Could not cache homepage asset:', req.url, error))
    );
    event.respondWith(
      network.catch(async (error) => {
        const cached = await caches.match(req);
        if (cached) return cached;
        console.error('Homepage asset unavailable:', req.url, error);
        throw error;
      })
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
  }
});
