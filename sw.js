const CACHE_NAME = 'mountain-view-preview-shell-v4';
const SHELL_URLS = ['./', './index.html', './preview.html', './manifest.webmanifest', './favicon.svg', './icons/mountain-view-180.png', './icons/mountain-view-192.png', './icons/mountain-view-512.png', './icons/mountain-view-512-maskable.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const scope = self.registration.scope;
    const canonicalApp = new Request(new URL('preview.html', scope), { cache: 'reload' });
    event.respondWith(fetch(canonicalApp).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(async cache => {
        await cache.put('./index.html', response.clone());
        await cache.put('./preview.html', response.clone());
      });
      return response;
    }).catch(async () => (await caches.match('./preview.html')) || (await caches.match('./index.html')) || (await caches.match('./'))));
    return;
  }

  event.respondWith(caches.match(request).then(async cached => {
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  }));
});
