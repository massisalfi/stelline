// RN-05 Stelline automatiche.
// Arrivano senza esecuzione per i CA che le prevedono in quel tipo di giorno, oppure quando il
// giorno dopo non è di un tipo indicato nel CA. Rispettano la validità: una stellina automatica
// "vale domani" entra nel portafoglio del giorno dopo. Non danno punti esperienza e non contano
// per laurea e boss.
//
// In pausa (RF-G09) il gioco è congelato: nessuna stellina automatica. Per una stellina "vale domani"
// conta il giorno di origine: se quel giorno era in pausa, il giorno dopo non arriva nulla.
// (Decisione del committente del 18 ottobre 2026, che sostituisce quella presa poco prima sui giorni alterni.)

import { giornoPrima } from './date.js';
import { statoNelGiorno, stellineNelGiorno } from './giorno.js';

// Stelline automatiche che entrano nel portafoglio di "giorno".
// Ognuna dice da quale CA e da quale giorno arriva, così si accredita una volta sola.
export function automaticheDelGiorno(giorno, comportamenti, calendario, pause = []) {
  const risultato = [];
  for (const c of comportamenti) {
    const giornoOrigine = c.validita === 'domani' ? giornoPrima(giorno) : giorno;
    // statoNelGiorno restituisce "non previsto" per i giorni in pausa.
    if (statoNelGiorno(c, giornoOrigine, calendario, pause) !== 'automatico') continue;
    const quantita = stellineNelGiorno(c, giornoOrigine, calendario);
    if (quantita > 0) risultato.push({ comportamento: c.id, giornoOrigine, quantita });
  }
  return risultato;
}
