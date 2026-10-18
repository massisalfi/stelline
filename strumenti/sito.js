// Prepara la cartella "sito" con i soli file da pubblicare su GitHub Pages: l'app e,
// finché dura la prova di conservazione dei dati, la sua pagina temporanea.
// Verifiche, test e strumenti restano nel repository ma non diventano pagine del sito,
// così nessuna pagina pubblicata, a parte l'app, può toccare l'archivio "stelline".
//
// Uso:  node strumenti/sito.js [cartella di destinazione, predefinita: sito]
// Lo usa la pubblicazione automatica (.github/workflows/pubblica.yml).

import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ELENCO_SITO = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '.nojekyll',
  'src',
  'risorse',
  // Da togliere a fine prova (dopo le prove del 25–26 ottobre 2026), insieme alla cartella.
  'prova-persistenza',
];

export function preparaSito(destinazione) {
  const radice = fileURLToPath(new URL('..', import.meta.url));
  const cartella = join(radice, destinazione);
  rmSync(cartella, { recursive: true, force: true });
  mkdirSync(cartella, { recursive: true });
  for (const voce of ELENCO_SITO) {
    if (!existsSync(join(radice, voce))) continue;
    cpSync(join(radice, voce), join(cartella, voce), { recursive: true });
  }
  return cartella;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cartella = preparaSito(process.argv[2] ?? 'sito');
  console.log(`Sito pronto in ${cartella}: ${ELENCO_SITO.join(', ')}`);
}
