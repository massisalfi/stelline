// Service worker: tiene una copia completa dell'app sull'iPad, così funziona senza rete (RNF-02).
// Ogni file dell'app deve comparire in FILE: un test controlla che l'elenco sia completo.

const VERSIONE = '0.1.0';
const CACHE = `stelline-${VERSIONE}`;

const FILE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'risorse/icone/app-180.png',
  'risorse/icone/app-192.png',
  'risorse/icone/app-512.png',
  'risorse/icone/app-maskable-512.png',
  'src/interfaccia/benvenuto.js',
  'src/interfaccia/componenti/dom.js',
  'src/main.js',
  'src/stile/base.css',
  'src/testi/it.js',
  'src/versione.js',
];

self.addEventListener('install', (evento) => {
  // cache: 'reload' evita di copiare file vecchi dalla memoria del browser.
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(FILE.map((percorso) => new Request(percorso, { cache: 'reload' })))),
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'attiva') self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(
        nomi.filter((n) => n.startsWith('stelline-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Si risponde dalla copia locale solo per i file dell'app; tutto il resto del sito
// (per esempio la pagina di prova) non viene toccato.
const PERCORSI = new Set(FILE.map((percorso) => new URL(percorso, self.registration.scope).pathname));
const PAGINA = new URL('index.html', self.registration.scope).pathname;

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  const indirizzo = new URL(richiesta.url);
  if (richiesta.method !== 'GET' || indirizzo.origin !== self.location.origin) return;
  if (!PERCORSI.has(indirizzo.pathname)) return;
  const chiave = richiesta.mode === 'navigate' ? PAGINA : indirizzo.pathname;
  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(chiave)) || fetch(richiesta);
  })());
});
