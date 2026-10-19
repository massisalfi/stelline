// Controlli sullo scheletro dell'app: copia offline completa (RNF-02),
// nessuna risorsa esterna (RNF-03, CT-16), versioni allineate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = fileURLToPath(new URL('..', import.meta.url));

function fileIn(cartella) {
  return readdirSync(join(RADICE, cartella)).flatMap((nome) => {
    const percorso = join(RADICE, cartella, nome);
    if (nome.startsWith('.')) return [];
    return statSync(percorso).isDirectory()
      ? fileIn(relative(RADICE, percorso))
      : [relative(RADICE, percorso).split(sep).join('/')];
  });
}

const FILE_APP = ['index.html', 'manifest.webmanifest', ...fileIn('src'), ...fileIn('risorse')];

function elencoServiceWorker() {
  const sorgente = readFileSync(join(RADICE, 'sw.js'), 'utf8');
  const blocco = sorgente.match(/const FILE = \[([\s\S]*?)\];/)[1];
  return [...blocco.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test('ogni file dell\'app è nella copia offline del service worker', () => {
  const elenco = new Set(elencoServiceWorker());
  const mancanti = FILE_APP.filter((f) => !elenco.has(f));
  assert.deepEqual(mancanti, [], `File da aggiungere alla copia offline (eseguite: node strumenti/elenco-offline.js): ${mancanti.join(', ')}`);
});

test('ogni file elencato nel service worker esiste', () => {
  const inesistenti = elencoServiceWorker().filter((f) => f !== './' && !existsSync(join(RADICE, f)));
  assert.deepEqual(inesistenti, []);
});

// L'unica eccezione è il nome del formato SVG: si scrive come un indirizzo ma non viene mai aperto.
const NOME_SVG = "'http://www.w3.org/2000/svg'";

test('nessun file dell\'app richiama indirizzi esterni', () => {
  const testuali = [...FILE_APP, 'sw.js'].filter((f) => /\.(html|js|css|webmanifest|json)$/.test(f));
  const trovati = testuali.flatMap((f) => {
    const contenuto = readFileSync(join(RADICE, f), 'utf8').replaceAll(NOME_SVG, '');
    return [...contenuto.matchAll(/(?:https?:)?\/\/[a-z0-9-]+\.[a-z0-9.-]+/gi)]
      .map((m) => `${f}: ${m[0]}`);
  });
  assert.deepEqual(trovati, []);
});

test('la pagina vieta i collegamenti esterni con una Content Security Policy', () => {
  const pagina = readFileSync(join(RADICE, 'index.html'), 'utf8');
  const csp = pagina.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? '';
  for (const regola of ["default-src 'self'", "script-src 'self'", "connect-src 'self'", "object-src 'none'"]) {
    assert.ok(csp.includes(regola), `manca: ${regola}`);
  }
});

test('la versione dell\'app e quella del service worker coincidono', async () => {
  const { VERSIONE } = await import('../src/versione.js');
  const sorgente = readFileSync(join(RADICE, 'sw.js'), 'utf8');
  assert.equal(sorgente.match(/const VERSIONE = '([^']+)'/)[1], VERSIONE);
});

test('il manifest permette l\'installazione sulla schermata Home', () => {
  const manifest = JSON.parse(readFileSync(join(RADICE, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'it');
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));
  for (const icona of manifest.icons) assert.ok(existsSync(join(RADICE, icona.src)), icona.src);
});
