// Riepilogo e validazione della configurazione (requisiti, sezione 4, passo 11).
// Gli errori bloccano il salvataggio, gli avvisi lo consentono.
// Restituisce solo codici e numeri: i testi stanno in src/testi/it.js (RNF-10).
//
// Parti della configurazione usate qui:
//   genitori:     [{ id, nome, pinImpronta }]
//   calendario:   { settimana, eccezioni }
//   comportamenti (vedi giorno.js)
//   economia:     { conversione: { stelline, minuti, categoria }, categorie, tettoTotale }
//   premi:        [{ modalita: 'stelline' | 'livello' | 'boss' | 'raro' }]
//   stagioni:     { settimane }

import { verificaProporzione, verificaCatalogo, attivi } from './proporzione.js';

// Tipi di giorno effettivamente usati dal calendario.
export function tipiUsati(calendario) {
  const tipi = new Set(Object.values(calendario.settimana ?? {}));
  for (const e of calendario.eccezioni ?? []) tipi.add(e.tipo);
  tipi.delete(undefined);
  tipi.delete(null);
  return [...tipi];
}

// Stelline massime ottenibili in un giorno di quel tipo (registrate o automatiche).
export function stellineMassime(tipo, comportamenti) {
  return attivi(comportamenti).reduce((somma, c) => {
    const regola = c.perTipo?.[tipo];
    return regola && (regola.previsto || regola.automatica) ? somma + (regola.stelline ?? 0) : somma;
  }, 0);
}

export function valida(config) {
  const errori = [];
  const avvisi = [];
  const comportamenti = config.comportamenti ?? [];

  // Errore: un genitore senza PIN.
  const genitori = config.genitori ?? [];
  if (genitori.length === 0) errori.push({ codice: 'nessun-genitore' });
  for (const g of genitori) {
    if (!g.pinImpronta) errori.push({ codice: 'genitore-senza-pin', genitore: g.nome });
  }

  // Errore: il numero di CA a scelta non è il 30% dei CA attivi (RN-14).
  const proporzione = verificaProporzione(comportamenti);
  if (!proporzione.ok) {
    errori.push({ codice: 'proporzione', ...proporzione });
  }

  // Errore: un tipo di giorno usato nel calendario non ha alcun CA.
  const tipi = tipiUsati(config.calendario ?? {});
  for (const tipo of tipi) {
    const conCA = attivi(comportamenti).some((c) => c.perTipo?.[tipo]?.previsto || c.perTipo?.[tipo]?.automatica);
    if (!conCA) errori.push({ codice: 'tipo-senza-ca', tipo });
  }

  // Avviso: catalogo troppo piccolo perché la scelta della bambina sia reale.
  const catalogo = verificaCatalogo(comportamenti);
  if (!catalogo.ok) avvisi.push({ codice: 'catalogo-ridotto', ...catalogo });

  // Avvisi sull'economia, per ogni tipo di giorno usato.
  const conv = config.economia?.conversione;
  if (conv?.stelline > 0) {
    const cat = config.economia.categorie?.find((c) => c.id === conv.categoria);
    const tetto = Math.min(cat?.tolleranza ?? Infinity, config.economia.tettoTotale ?? Infinity);
    for (const tipo of tipi) {
      const massimo = stellineMassime(tipo, comportamenti);
      if (massimo === 0) continue; // già segnalato come errore
      if (massimo < conv.stelline) {
        avvisi.push({ codice: 'stelline-insufficienti', tipo, massimo, necessarie: conv.stelline });
      }
      const minuti = Math.floor(massimo / conv.stelline) * conv.minuti;
      if (minuti > tetto) {
        avvisi.push({ codice: 'stelline-oltre-tetti', tipo, massimo, minuti, tetto });
      }
    }
  }

  // Avvisi sui premi della stagione.
  const premi = config.premi ?? [];
  const settimane = config.stagioni?.settimane;
  const livelli = premi.filter((p) => p.modalita === 'livello').length;
  if (settimane && livelli < settimane) {
    avvisi.push({ codice: 'sequenza-livelli-corta', premi: livelli, settimane });
  }
  if (!premi.some((p) => p.modalita === 'boss')) avvisi.push({ codice: 'boss-senza-premio' });

  return { valida: errori.length === 0, errori, avvisi };
}
