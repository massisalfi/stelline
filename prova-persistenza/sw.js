// Service worker della prova: rete prima, copia locale se offline.
// Così una versione nuova pubblicata si vede subito, e senza rete la pagina si apre lo stesso.
// Dalla versione 3 annota installazione e attivazione nell'archivio "testo", per il diario.

const VERSIONE = 3;
const CACHE = `prova-persistenza-v${VERSIONE}`;
const NOME_TESTO = 'prova-persistenza-testo';
const FILE = [
  './',
  'index.html',
  'stile.css',
  'prova.js',
  'manifest.webmanifest',
  'icona-180.png',
  'icona-512.png',
];

function annota(testo) {
  return new Promise((risolvi) => {
    const richiesta = indexedDB.open(NOME_TESTO, 1);
    richiesta.onupgradeneeded = () => richiesta.result.createObjectStore('dati');
    richiesta.onerror = () => risolvi();
    richiesta.onsuccess = () => {
      const db = richiesta.result;
      const tx = db.transaction('dati', 'readwrite');
      const archivio = tx.objectStore('dati');
      const lettura = archivio.get('eventi');
      lettura.onsuccess = () => archivio.put([...(lettura.result || []), { quando: Date.now(), testo }], 'eventi');
      tx.oncomplete = () => { db.close(); risolvi(); };
      tx.onerror = () => { db.close(); risolvi(); };
    };
  });
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILE))
      .then(() => annota(`aggiornamento installato: versione ${VERSIONE}`))
      .then(() => self.skipWaiting()),
  );
});

// Si cancellano solo le copie vecchie di questa pagina, mai quelle di altre pagine del sito.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi
        .filter((n) => n.startsWith('prova-persistenza-v') && n !== CACHE)
        .map((n) => caches.delete(n))))
      .then(() => annota(`aggiornamento attivato: versione ${VERSIONE}`))
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
