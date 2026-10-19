// Configurazione guidata, passi 6–10 (requisiti, sezione 4): economia, listino premi,
// stagioni e boss, sorprese, alert. Valori proposti e controlli; i testi stanno in src/testi/it.js.
// In M1 questi valori si salvano e servono a riscatti e tetti; il loro effetto sul gioco arriva in M2/M3.

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const vuoto = (testo) => !testo || !testo.trim();

// Passo 6: economia.
//   conversione: N stelline = un blocco di M minuti della categoria indicata
//   confermaRiscatto: 'tutti' (ogni premio), 'schermo' (solo premi di schermo), 'nessuno'
export function economiaProposta() {
  return {
    conversione: { stelline: 5, minuti: 20, categoria: 'cartoni' },
    sogliaLivello: 40,
    categorie: [
      { id: 'cartoni', nome: 'Cartoni', limite: 40, tolleranza: 45 },
      { id: 'videogiochi', nome: 'Videogiochi', limite: 50, tolleranza: 55 },
    ],
    tettoTotale: 90,
    confermaRiscatto: 'tutti',
  };
}

// Passo 8: stagioni e boss. Obiettivo del boss: percentuale delle stelline possibili nella
// settimana, oppure un CA specifico valido per almeno N giorni.
export function stagioniProposte() {
  return {
    settimane: 5,
    boss: { tipo: 'percentuale', percentuale: 80, comportamento: null, giorni: 5 },
  };
}

// Passo 9: sorprese.
export function sorpreseProposte() {
  return {
    minimo: 1,
    massimo: 10,
    contenuti: { avatar: true, storia: true, creature: true, bonus: true },
    stellineBonus: 2,
  };
}

// Passo 10: soglie degli alert (RN-15). A1 e A7 non hanno soglie: dipendono dal criterio
// di laurea di ogni CA e dalla sequenza dei premi di livello.
export function alertProposti() {
  return {
    a2: { percentuale: 50, settimane: 2 },
    a3: { rifiutate: 3 },
    a4: { dubbi: 3 },
    a5: { punti: 5, settimane: 6 },
    a6: { revisioni: 2 },
    a8: { giorni: 7 },
  };
}

// RF-G07: suggerimenti del pulsante dubbio per la coppia (testi iniziali, modificabili nel pannello).
export function suggerimentiDubbioProposti() {
  return [
    'Descrivete il fatto, non il giudizio: «ha finito dopo il timer», non «ha fatto la lenta».',
    'Se il caso non è previsto dalla definizione, oggi vale la lettura più semplice; alla revisione riscrivete la regola insieme.',
    'Niente braccio di ferro: esauriti i solleciti, la conseguenza.',
    'Accogliete l\'emozione senza rinegoziare la stellina.',
    'Rinforzate subito e con parole specifiche («hai preparato lo zaino da sola»), senza enfasi.',
  ];
}

// Passo 7: un premio del listino.
//   famiglia: Status, Accesso, Potere, Emotivo, Tangibile
//   modalita: 'stelline' (costo), 'livello' (sequenza), 'boss', 'raro' (ogni N stagioni)
//   categoria e minuti: solo per i premi di schermo, altrimenti null
export const FAMIGLIE = ['status', 'accesso', 'potere', 'emotivo', 'tangibile'];
export const MODALITA = ['stelline', 'livello', 'boss', 'raro'];

export function nuovoPremio(id) {
  return {
    id,
    nome: '',
    icona: null,
    famiglia: 'tangibile',
    modalita: 'stelline',
    costo: 5,
    ogniStagioni: 2,
    categoria: null,
    minuti: null,
    riutilizzabile: false,
    euro: null,
  };
}

export function nuovoIdPremio(premi) {
  let n = premi.length + 1;
  while (premi.some((p) => p.id === `premio-${n}`)) n++;
  return `premio-${n}`;
}

export function controllaEconomia(economia) {
  const errori = [];
  const { conversione, categorie } = economia;
  if (!intero(conversione.stelline, 1, 50)) errori.push({ codice: 'conversione-stelline' });
  if (!intero(conversione.minuti, 1, 240)) errori.push({ codice: 'conversione-minuti' });
  if (!categorie.some((c) => c.id === conversione.categoria)) errori.push({ codice: 'conversione-categoria' });
  if (!intero(economia.sogliaLivello, 1, 1000)) errori.push({ codice: 'soglia-livello' });
  const nomi = new Set();
  categorie.forEach((c, indice) => {
    if (vuoto(c.nome)) errori.push({ codice: 'categoria-nome-mancante', indice });
    else if (nomi.has(c.nome.trim().toLowerCase())) errori.push({ codice: 'categoria-nome-ripetuto', indice });
    else nomi.add(c.nome.trim().toLowerCase());
    if (!intero(c.limite, 0, 600)) errori.push({ codice: 'categoria-limite', indice });
    if (!intero(c.tolleranza, 0, 600) || c.tolleranza < c.limite) errori.push({ codice: 'categoria-tolleranza', indice });
  });
  if (!intero(economia.tettoTotale, 1, 900)) errori.push({ codice: 'tetto-totale' });
  if (!['tutti', 'schermo', 'nessuno'].includes(economia.confermaRiscatto)) errori.push({ codice: 'conferma-riscatto' });
  return errori;
}

export function controllaPremio(premio, categorie) {
  const errori = [];
  if (vuoto(premio.nome)) errori.push({ codice: 'premio-nome-mancante' });
  if (!premio.icona) errori.push({ codice: 'premio-icona-mancante' });
  if (!FAMIGLIE.includes(premio.famiglia)) errori.push({ codice: 'premio-famiglia' });
  if (!MODALITA.includes(premio.modalita)) errori.push({ codice: 'premio-modalita' });
  if (premio.modalita === 'stelline' && !intero(premio.costo, 1, 100)) errori.push({ codice: 'premio-costo' });
  if (premio.modalita === 'raro' && !intero(premio.ogniStagioni, 1, 10)) errori.push({ codice: 'premio-ogni-stagioni' });
  if (premio.categoria != null) {
    if (!categorie.some((c) => c.id === premio.categoria)) errori.push({ codice: 'premio-categoria' });
    if (!intero(premio.minuti, 1, 240)) errori.push({ codice: 'premio-minuti' });
  }
  if (premio.euro != null && !(typeof premio.euro === 'number' && premio.euro >= 0 && premio.euro <= 10000)) {
    errori.push({ codice: 'premio-euro' });
  }
  return errori;
}

// Passo 7: ogni premio completo. Il listino può restare vuoto: nel riepilogo ci saranno gli avvisi
// sui premi di livello e del boss mancanti.
export function controllaPremi(premi, categorie) {
  return premi.flatMap((p, indice) => (controllaPremio(p, categorie).length ? [{ codice: 'premio-incompleto', indice }] : []));
}

// I premi di livello in ordine: la bambina vede sempre il premio del livello successivo.
export function sequenzaLivelli(premi) {
  return premi.filter((p) => p.modalita === 'livello');
}

// Sposta un premio di livello di una posizione nella sequenza (-1 su, +1 giù).
export function spostaInSequenza(premi, id, direzione) {
  const livelli = sequenzaLivelli(premi);
  const da = livelli.findIndex((p) => p.id === id);
  const a = da + direzione;
  if (da < 0 || a < 0 || a >= livelli.length) return premi;
  const i = premi.indexOf(livelli[da]);
  const j = premi.indexOf(livelli[a]);
  const risultato = [...premi];
  [risultato[i], risultato[j]] = [risultato[j], risultato[i]];
  return risultato;
}

export function controllaStagioni(stagioni, comportamenti) {
  const errori = [];
  if (!intero(stagioni.settimane, 4, 6)) errori.push({ codice: 'stagione-settimane' });
  const { boss } = stagioni;
  if (boss.tipo === 'percentuale') {
    if (!intero(boss.percentuale, 50, 100)) errori.push({ codice: 'boss-percentuale' });
  } else if (boss.tipo === 'comportamento') {
    const ca = comportamenti.find((c) => c.id === boss.comportamento && c.stato === 'attivo');
    if (!ca) errori.push({ codice: 'boss-comportamento' });
    if (!intero(boss.giorni, 1, 7)) errori.push({ codice: 'boss-giorni' });
  } else {
    errori.push({ codice: 'boss-tipo' });
  }
  return errori;
}

// RN-12: dopo un intervallo massimo il successivo si estrae tra minimo e massimo − 1,
// quindi il massimo deve superare il minimo di almeno un giorno.
export function controllaSorprese(sorprese) {
  const errori = [];
  if (!intero(sorprese.minimo, 1, 60)) errori.push({ codice: 'sorprese-minimo' });
  if (!intero(sorprese.massimo, 2, 90) || sorprese.massimo <= sorprese.minimo) errori.push({ codice: 'sorprese-massimo' });
  if (!Object.values(sorprese.contenuti).some(Boolean)) errori.push({ codice: 'sorprese-contenuti' });
  if (sorprese.contenuti.bonus && !intero(sorprese.stellineBonus, 1, 10)) errori.push({ codice: 'sorprese-bonus' });
  return errori;
}

export function controllaAlert(alert) {
  const errori = [];
  const regole = [
    ['a2', 'percentuale', 10, 90], ['a2', 'settimane', 1, 8],
    ['a3', 'rifiutate', 1, 20],
    ['a4', 'dubbi', 1, 20],
    ['a5', 'punti', 1, 50], ['a5', 'settimane', 2, 12],
    ['a6', 'revisioni', 1, 8],
    ['a8', 'giorni', 1, 60],
  ];
  for (const [chiave, campo, min, max] of regole) {
    if (!intero(alert[chiave]?.[campo], min, max)) errori.push({ codice: 'alert-soglia', alert: chiave, campo });
  }
  return errori;
}
