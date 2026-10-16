// Service worker della prova: rete prima, copia locale se offline.
// Così una versione nuova pubblicata si vede subito, e senza rete la pagina si apre lo stesso.

const CACHE = 'prova-persistenza-v2';
const FILE = [
  './',
  'index.html',
  'stile.css',
  'prova.js',
  'manifest.webmanifest',
  'icona-180.png',
  'icona-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    fetch(evento.request)
      .then((risposta) => {
        const copia = risposta.clone();
        caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
        return risposta;
      })
      .catch(() => caches.match(evento.request, { ignoreSearch: true })),
  );
});
