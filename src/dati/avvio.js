// Avvio della settimana 0 (sezione 4): si salva la prima versione della configurazione,
// si passa alla fase "settimana0" e si toglie la bozza. Tutto in un'unica operazione:
// o va a buon fine tutto, o non cambia nulla.

import { avvioSettimana0 } from '../regole/riepilogo.js';
import { CHIAVE_BOZZA } from '../interfaccia/configurazione/costanti.js';

export async function avviaSettimana0(archivio, bozza, adesso = Date.now()) {
  const { versione, inizio } = avvioSettimana0(bozza, adesso);
  await archivio.scriviInsieme([
    { contenitore: 'configurazioni', record: versione },
    { contenitore: 'stato', record: { chiave: 'fase', valore: 'settimana0' } },
    { contenitore: 'stato', record: { chiave: 'inizioSettimana0', valore: inizio } },
    { contenitore: 'stato', elimina: CHIAVE_BOZZA },
  ]);
  return { versione, inizio };
}
