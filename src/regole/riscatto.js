// RN-07 Riscatto a stelline e RN-08 Tetti di schermo.
//
// economia: {
//   categorie: [{ id, nome, limite, tolleranza }],   minuti al giorno per categoria
//   tettoTotale                                        minuti al giorno, tutte le categorie insieme
// }
// premio:  { costo, categoria, minuti }   (categoria assente = non è un premio di schermo)
// fonte:   'stelline' | 'scrigno' | 'sorpresa' | 'raro'  — i tetti valgono per ogni fonte.

// Minuti di schermo già riscattati in un giorno, per categoria.
export function minutiDelGiorno(giorno, riscatti) {
  const minuti = {};
  for (const r of riscatti) {
    if (r.giorno !== giorno || !r.categoria) continue;
    minuti[r.categoria] = (minuti[r.categoria] ?? 0) + r.minuti;
  }
  return minuti;
}

function totale(minutiOggi) {
  return Object.values(minutiOggi).reduce((s, m) => s + m, 0);
}

function categoria(economia, id) {
  const trovata = economia.categorie.find((c) => c.id === id);
  if (!trovata) throw new Error(`Categoria di schermo sconosciuta: ${id}`);
  return trovata;
}

// RN-08: un premio di schermo è proposto solo se i minuti già riscattati oggi
// in quella categoria sono sotto il limite.
export function proposto(premio, minutiOggi, economia) {
  if (!premio.categoria) return true;
  return (minutiOggi[premio.categoria] ?? 0) < categoria(economia, premio.categoria).limite;
}

// Minuti ancora riscattabili oggi in una categoria (RF-G08), tenendo conto anche del tetto totale.
export function minutiResidui(idCategoria, minutiOggi, economia) {
  const cat = categoria(economia, idCategoria);
  const usati = minutiOggi[idCategoria] ?? 0;
  if (usati >= cat.limite) return 0;
  return Math.max(0, Math.min(cat.tolleranza - usati, economia.tettoTotale - totale(minutiOggi)));
}

// Valuta una richiesta di riscatto. Restituisce:
//   ammesso: se si può riscattare adesso;
//   motivi:  perché no — 'pausa' (il gioco è in pausa), 'stelline' (non bastano),
//            'limite' (categoria già al limite), 'tolleranza' (si supererebbe la tolleranza),
//            'totale' (si supererebbe il tetto totale);
//   mancano: stelline che mancano (0 se bastano).
// Un premio dello scrigno bloccato dal tetto resta nello scrigno: qui non si toglie nulla.
// RF-G09: in pausa il gioco è congelato e nessun premio si riscatta nell'app, da nessuna fonte.
export function valutaRiscatto({ premio, fonte = 'stelline', portafoglio = 0, minutiOggi = {}, economia, inPausa = false }) {
  const motivi = [];
  let mancano = 0;
  if (inPausa) return { ammesso: false, motivi: ['pausa'], mancano: 0 };

  // RN-07: costo ≤ portafoglio, solo per i premi pagati con le stelline.
  if (fonte === 'stelline' && premio.costo > portafoglio) {
    motivi.push('stelline');
    mancano = premio.costo - portafoglio;
  }

  if (premio.categoria) {
    const cat = categoria(economia, premio.categoria);
    const usati = minutiOggi[premio.categoria] ?? 0;
    if (usati >= cat.limite) motivi.push('limite');
    else if (usati + premio.minuti > cat.tolleranza) motivi.push('tolleranza');
    if (totale(minutiOggi) + premio.minuti > economia.tettoTotale) motivi.push('totale');
  }

  return { ammesso: motivi.length === 0, motivi, mancano };
}

// RF-B06: se un premio non si può usare per i tetti, la voce dice che si potrà usare
// un altro giorno, anche quando mancano stelline.
export function bloccatoDaiTetti(esito) {
  return esito.motivi.some((m) => m === 'limite' || m === 'tolleranza' || m === 'totale');
}

export function bloccatoDallaPausa(esito) {
  return esito.motivi.includes('pausa');
}
