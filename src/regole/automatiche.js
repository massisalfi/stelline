// RN-05 Stelline automatiche.
// Arrivano senza esecuzione per i CA che le prevedono in quel tipo di giorno, oppure quando il
// giorno dopo non è di un tipo indicato nel CA. Rispettano la validità: una stellina automatica
// "vale domani" entra nel portafoglio del giorno dopo. Non danno punti esperienza e non contano
// per laurea e boss.
//
// In pausa (RF-G09) non si aspetta nulla dalla bambina, ma le stelline automatiche continuano
// ad arrivare al 50%, senza mezze stelline: a giorni alterni, a partire dal primo giorno di pausa
// (primo giorno sì, secondo no, terzo sì…).

import { giornoPrima, differenzaGiorni, nellIntervallo } from './date.js';
import { statoNelGiorno, stellineNelGiorno } from './giorno.js';

// Posizione del giorno nella sua pausa (0 = primo giorno), oppure null se non è in pausa.
export function giornoDellaPausa(giorno, pause = []) {
  const pausa = pause.find((p) => nellIntervallo(giorno, p.dal, p.al));
  return pausa ? differenzaGiorni(pausa.dal, giorno) : null;
}

// In pausa la stellina automatica arriva solo nei giorni pari della pausa (il 1°, il 3°, il 5°…).
export function automaticaInPausa(giorno, pause = []) {
  const posizione = giornoDellaPausa(giorno, pause);
  return posizione === null || posizione % 2 === 0;
}

// Stelline automatiche che entrano nel portafoglio di "giorno".
// Ognuna dice da quale CA e da quale giorno arriva, così si accredita una volta sola.
export function automaticheDelGiorno(giorno, comportamenti, calendario, pause = []) {
  const risultato = [];
  for (const c of comportamenti) {
    const giornoOrigine = c.validita === 'domani' ? giornoPrima(giorno) : giorno;
    // Lo stato si valuta come se non ci fosse la pausa; la pausa decide solo i giorni alterni.
    if (statoNelGiorno(c, giornoOrigine, calendario) !== 'automatico') continue;
    if (!automaticaInPausa(giornoOrigine, pause)) continue;
    const quantita = stellineNelGiorno(c, giornoOrigine, calendario);
    if (quantita > 0) risultato.push({ comportamento: c.id, giornoOrigine, quantita });
  }
  return risultato;
}
