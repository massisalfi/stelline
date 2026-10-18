// RN-01 Giorno e RN-02 CA previsto.
//
// Forma dei dati usati qui (configurazione valida in quel giorno):
//   calendario: { settimana: { 1: idTipo, …, 7: idTipo }, eccezioni: [{ dal, al, tipo }] }
//   pause:      [{ dal, al }]                (al assente = fino a riattivazione)
//   comportamento: {
//     stato: 'attivo' | 'catalogo' | 'laureato',
//     momento: 'mattina' | 'pomeriggio' | 'sera',
//     perTipo: { [idTipo]: { previsto, stelline, automatica } },
//     automaticaSeDomaniNon: [idTipo]       (facoltativo, RN-05)
//   }

import { giornoDellaSettimana, giornoDopo, differenzaGiorni, nellIntervallo } from './date.js';

const ORDINE_MOMENTI = { mattina: 1, pomeriggio: 2, sera: 3 };

// RN-01: le eccezioni per data prevalgono sul giorno della settimana.
// Se due eccezioni si sovrappongono vale la più breve (la più specifica, ad esempio
// Natale dentro le vacanze di Natale); a parità di durata, quella inserita per ultima.
export function tipoDelGiorno(giorno, calendario) {
  let scelta = null;
  for (const eccezione of calendario.eccezioni ?? []) {
    if (!nellIntervallo(giorno, eccezione.dal, eccezione.al ?? eccezione.dal)) continue;
    const durata = differenzaGiorni(eccezione.dal, eccezione.al ?? eccezione.dal);
    if (!scelta || durata <= scelta.durata) scelta = { tipo: eccezione.tipo, durata };
  }
  return scelta ? scelta.tipo : calendario.settimana[giornoDellaSettimana(giorno)];
}

export function inPausa(giorno, pause = []) {
  return pause.some((p) => nellIntervallo(giorno, p.dal, p.al));
}

// Come si presenta un CA in un giorno:
//   'previsto'     → i genitori lo registrano;
//   'automatico'   → la stellina arriva senza esecuzione (RN-05);
//   'non previsto' → quel giorno non c'è.
// In pausa (RF-G09) il gioco è congelato: nessun CA previsto e nessuna stellina automatica.
export function statoNelGiorno(comportamento, giorno, calendario, pause = []) {
  if (comportamento.stato !== 'attivo' || inPausa(giorno, pause)) return 'non previsto';
  const regola = comportamento.perTipo?.[tipoDelGiorno(giorno, calendario)];
  if (!regola) return 'non previsto';
  if (regola.automatica) return 'automatico';
  if (!regola.previsto) return 'non previsto';
  const tipiDomani = comportamento.automaticaSeDomaniNon;
  if (tipiDomani?.length && !tipiDomani.includes(tipoDelGiorno(giornoDopo(giorno), calendario))) {
    return 'automatico';
  }
  return 'previsto';
}

// RN-02: CA previsto se attivo, previsto per quel tipo di giorno e il giorno non è in pausa.
export function previsto(comportamento, giorno, calendario, pause = []) {
  return statoNelGiorno(comportamento, giorno, calendario, pause) === 'previsto';
}

// Stelline del CA in quel giorno, secondo il suo tipo (intero ≥ 1, oppure 0 se non definito).
export function stellineNelGiorno(comportamento, giorno, calendario) {
  return comportamento.perTipo?.[tipoDelGiorno(giorno, calendario)]?.stelline ?? 0;
}

// I CA da mostrare nella schermata Oggi (RF-G02), in ordine di momento della giornata.
export function comportamentiDelGiorno(comportamenti, giorno, calendario, pause = []) {
  return comportamenti
    .map((c) => ({ comportamento: c, stato: statoNelGiorno(c, giorno, calendario, pause) }))
    .filter((voce) => voce.stato !== 'non previsto')
    .sort((a, b) => (ORDINE_MOMENTI[a.comportamento.momento] ?? 9) - (ORDINE_MOMENTI[b.comportamento.momento] ?? 9));
}
