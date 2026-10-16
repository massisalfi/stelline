// Versioni della configurazione (requisiti, sezione 4, "Modifiche successive").
// Ogni modifica a CA, listino, economia o tetti crea una nuova versione, con data e autore.
// Vale dal giorno dopo e non è mai retroattiva: le stelline, i punti e i premi già guadagnati
// sono nel registro dei movimenti e non vengono ricalcolati.
//
// Versione: { numero, data (istante, ms), autore, contenuto, validaDal (giorno) }

import { giornoDi, giornoDopo } from './date.js';

// La prima configurazione vale subito; le modifiche successive dal giorno dopo.
export function nuovaVersione(versioni, contenuto, autore, adesso) {
  const numero = versioni.reduce((max, v) => Math.max(max, v.numero), 0) + 1;
  const oggi = giornoDi(adesso);
  return {
    numero,
    data: adesso,
    autore,
    contenuto,
    validaDal: versioni.length === 0 ? oggi : giornoDopo(oggi),
  };
}

// La configurazione valida in un giorno: l'ultima già in vigore quel giorno.
// Se più versioni entrano in vigore lo stesso giorno, vale quella con il numero più alto.
export function versioneDelGiorno(giorno, versioni) {
  let scelta = null;
  for (const v of versioni) {
    if (v.validaDal > giorno) continue;
    if (!scelta || v.validaDal > scelta.validaDal
      || (v.validaDal === scelta.validaDal && v.numero > scelta.numero)) {
      scelta = v;
    }
  }
  return scelta;
}

// L'ultima versione salvata, anche se non ancora in vigore: è quella che si modifica nel pannello.
export function ultimaVersione(versioni) {
  return versioni.reduce((ultima, v) => (!ultima || v.numero > ultima.numero ? v : ultima), null);
}
