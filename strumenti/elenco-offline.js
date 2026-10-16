// Aggiorna in sw.js l'elenco dei file da tenere in copia sull'iPad (RNF-02).
// Uso: node strumenti/elenco-offline.js
// Il test "ogni file dell'app è nella copia offline" ricorda di eseguirlo quando si aggiunge un file.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = fileURLToPath(new URL('..', import.meta.url));

function fileIn(cartella) {
  return readdirSync(join(RADICE, cartella)).sort().flatMap((nome) => {
    if (nome.startsWith('.')) return [];
    const percorso = join(RADICE, cartella, nome);
    return statSync(percorso).isDirectory()
      ? fileIn(relative(RADICE, percorso))
      : [relative(RADICE, percorso).split(sep).join('/')];
  });
}

const elenco = ['./', 'index.html', 'manifest.webmanifest', ...fileIn('risorse'), ...fileIn('src')];
const percorsoSw = join(RADICE, 'sw.js');
const sorgente = readFileSync(percorsoSw, 'utf8');
const blocco = `const FILE = [\n${elenco.map((f) => `  '${f}',`).join('\n')}\n];`;
writeFileSync(percorsoSw, sorgente.replace(/const FILE = \[[\s\S]*?\];/, blocco));
console.log(`sw.js: ${elenco.length} file in copia offline.`);
