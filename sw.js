/* Nagori · service worker
   Réseau d'abord, cache en secours : le jeu se met toujours à jour quand on est en ligne,
   et s'ouvre quand même hors ligne avec la dernière version vue. La météo n'est jamais mise en cache. */
const CACHE = 'nagori';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('open-meteo') || url.hostname.includes('goatcounter') || url.hostname.includes('zgo.at')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('fonts.g'))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: url.origin === location.origin }).then(r => r || caches.match('./')))
  );
});
