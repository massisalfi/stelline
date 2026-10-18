// Nessuna pagina pubblicata, a parte l'app, deve poter leggere, scrivere o cancellare l'archivio
// "stelline" (decisione del 18 ottobre 2026). Due difese, controllate qui:
//   1. sul sito vanno solo i file dell'app (e la pagina della prova finché dura): strumenti/sito.js;
//   2. nessun file fuori dall'app nomina l'archivio "stelline" o lo apre con il nome predefinito.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELENCO_SITO } from '../strumenti/sito.js';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const ESCLUSE = new Set(['.git', 'node_modules', 'docs', '.claude', 'sito']);

function tuttiIFile(cartella = '') {
  return readdirSync(join(RADICE, cartella)).flatMap((nome) => {
    if (ESCLUSE.has(nome) || nome === '.DS_Store') return [];
    const percorso = join(RADICE, cartella, nome);
    const rel = relative(RADICE, percorso).split(sep).join('/');
    return statSync(percorso).isDirectory() ? tuttiIFile(rel) : [rel];
  });
}

const CODICE = tuttiIFile().filter((f) => /\.(js|html|mjs)$/.test(f));
const dellApp = (f) => f.startsWith('src/') || ['index.html', 'sw.js'].includes(f);

test('sul sito vanno solo i file dell\'app e la pagina della prova', () => {
  assert.deepEqual([...ELENCO_SITO].sort(), [
    '.nojekyll', 'index.html', 'manifest.webmanifest', 'prova-persistenza', 'risorse', 'src', 'sw.js',
  ]);
  for (const vietata of ['verifiche', 'test', 'strumenti', 'docs', 'CLAUDE.md', '.github']) {
    assert.ok(!ELENCO_SITO.includes(vietata), `${vietata} non deve andare sul sito`);
  }
});

test('ogni file della copia offline dell\'app è tra quelli pubblicati', () => {
  const sorgente = readFileSync(join(RADICE, 'sw.js'), 'utf8');
  const elenco = [...sorgente.match(/const FILE = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const f of elenco.filter((x) => x !== './')) {
    assert.ok(ELENCO_SITO.some((voce) => f === voce || f.startsWith(`${voce}/`)), `${f} non sarebbe pubblicato`);
  }
});

test('la pubblicazione automatica usa l\'elenco del sito ed esegue i test prima', () => {
  const flusso = readFileSync(join(RADICE, '.github/workflows/pubblica.yml'), 'utf8');
  assert.match(flusso, /node --test/);
  assert.match(flusso, /node strumenti\/sito\.js sito/);
  assert.match(flusso, /path: sito/);
  assert.ok(flusso.indexOf('node --test') < flusso.indexOf('upload-pages-artifact'), 'i test vengono prima della pubblicazione');
});

test('nell\'app solo src/dati/archivio.js apre o cancella archivi del browser', () => {
  for (const f of CODICE.filter(dellApp)) {
    if (f === 'src/dati/archivio.js') continue;
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/indexedDB\s*\.\s*(open|deleteDatabase)/.test(testo), `${f} apre direttamente IndexedDB`);
    assert.ok(!/localStorage|sessionStorage/.test(testo), `${f} usa un altro archivio del browser`);
  }
});

// File che un browser può eseguire, fuori dall'app: pagine di verifica e pagina della prova.
// test/ e strumenti/ girano solo con Node sul Mac e non sono sul sito.
const daBrowserFuoriApp = (f) => !dellApp(f) && (f.startsWith('verifiche/') || f.startsWith('prova-persistenza/') || f.endsWith('.html'));

test('nessuna pagina fuori dall\'app nomina l\'archivio "stelline" o lo apre con il nome predefinito', () => {
  const pagine = CODICE.filter(daBrowserFuoriApp);
  assert.ok(pagine.length >= 4, 'controllo su verifiche e pagina della prova');
  for (const f of pagine) {
    const testo = readFileSync(join(RADICE, f), 'utf8');
    assert.ok(!/['"`]stelline['"`]/.test(testo), `${f} nomina l'archivio "stelline"`);
    assert.ok(!/NOME_ARCHIVIO\b(?!\s*=)/.test(testo) || f.startsWith('prova-persistenza/'), `${f} usa il nome dell'archivio dell'app`);
    assert.ok(!/(apriArchivio|cancellaArchivio)\(\s*\)/.test(testo), `${f} apre l'archivio dell'app con il nome predefinito`);
  }
});

test('le verifiche nel browser usano un archivio proprio o uno finto', () => {
  const archivio = readFileSync(join(RADICE, 'verifiche/archivio.js'), 'utf8');
  assert.match(archivio, /const NOME = 'stelline-verifica';/);
  assert.ok([...archivio.matchAll(/(apriArchivio|cancellaArchivio)\(([^)]*)\)/g)].every((m) => m[2].trim() === 'NOME'));
  const compatibilita = readFileSync(join(RADICE, 'verifiche/compatibilita.js'), 'utf8');
  assert.ok(!/apriArchivio|cancellaArchivio|indexedDB/.test(compatibilita));
  assert.ok(existsSync(join(RADICE, 'prova-persistenza/prova.js')) ? /const NOME_ARCHIVIO = 'prova-persistenza';/.test(readFileSync(join(RADICE, 'prova-persistenza/prova.js'), 'utf8')) : true);
});
