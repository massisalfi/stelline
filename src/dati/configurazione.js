// Lettura della configurazione avviata: le versioni salvate, completate con i campi
// aggiunti dalle versioni successive dell'app (RNF-16).

import { completaContenuto } from '../regole/configurazione.js';
import { versioneDelGiorno, ultimaVersione } from '../regole/versioni.js';
import { giornoDi } from '../regole/date.js';

export async function caricaConfigurazione(archivio, adesso = Date.now()) {
  const versioni = (await archivio.tutti('configurazioni'))
    .map((v) => ({ ...v, contenuto: completaContenuto(v.contenuto) }));
  const oggi = giornoDi(adesso);
  return {
    oggi,
    versioni,
    // Le regole di oggi (comportamenti, premi, economia) vengono dalla versione in vigore oggi.
    diOggi: versioneDelGiorno(oggi, versioni)?.contenuto ?? null,
    // I genitori e i loro PIN dall'ultima versione salvata: un PIN cambiato vale subito.
    ultima: ultimaVersione(versioni)?.contenuto ?? null,
  };
}
