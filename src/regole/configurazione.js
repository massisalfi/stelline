// Configurazione iniziale guidata (requisiti, sezione 4): valori proposti e controlli dei passi.
// Restituisce solo codici: i testi stanno in src/testi/it.js.

import { valido as giornoValido } from './date.js';

export const COLORI_TIPI = ['#2f6f5e', '#c9852c', '#9a3b1f', '#4a6fa5', '#7a5c99', '#5c7a3a'];

// Passo 3: tipi di giorno proposti e modificabili.
export function tipiProposti() {
  return [
    { id: 'scuola', nome: 'Scuola', colore: COLORI_TIPI[0] },
    { id: 'weekend', nome: 'Weekend', colore: COLORI_TIPI[1] },
    { id: 'festivo', nome: 'Festivo', colore: COLORI_TIPI[2] },
    { id: 'vacanza', nome: 'Vacanza', colore: COLORI_TIPI[3] },
  ];
}

export function nuovaBozza() {
  return {
    passo: 1,
    genitori: [
      { id: 'genitore-1', nome: '', pin: null },
      { id: 'genitore-2', nome: '', pin: null },
    ],
    giocatrice: {
      nome: '',
      eta: 6,
      voce: { attiva: true, velocita: 1, tono: 1, id: null },
      suoni: { attivi: true, volume: 70 },
    },
    tipiGiorno: tipiProposti(),
    calendario: {
      settimana: { 1: 'scuola', 2: 'scuola', 3: 'scuola', 4: 'scuola', 5: 'scuola', 6: 'weekend', 7: 'weekend' },
      eccezioni: [],
    },
    revisione: { giorno: 7, ora: '18:00' },
    comportamenti: [],
  };
}

const vuoto = (testo) => !testo || !testo.trim();

// Passo 1: due genitori, con nome e PIN. Che i due PIN siano diversi si controlla
// quando si imposta il PIN, perché qui ci sono solo le impronte.
export function controllaGenitori(bozza) {
  const errori = [];
  bozza.genitori.forEach((g, indice) => {
    if (vuoto(g.nome)) errori.push({ codice: 'nome-genitore-mancante', indice });
    if (!g.pin?.impronta) errori.push({ codice: 'pin-mancante', indice });
  });
  const [a, b] = bozza.genitori.map((g) => g.nome?.trim().toLowerCase());
  if (a && b && a === b) errori.push({ codice: 'nomi-genitori-uguali' });
  return errori;
}

// Passo 2: nome ed età della giocatrice; voce e suoni hanno sempre un valore.
export function controllaGiocatrice(bozza) {
  const errori = [];
  const { nome, eta } = bozza.giocatrice;
  if (vuoto(nome)) errori.push({ codice: 'nome-giocatrice-mancante' });
  if (!Number.isInteger(eta) || eta < 3 || eta > 12) errori.push({ codice: 'eta-non-valida' });
  return errori;
}

// Tipi di giorno usati dal calendario (settimana ed eccezioni).
export function tipiInUso(bozza) {
  return new Set([
    ...Object.values(bozza.calendario.settimana),
    ...bozza.calendario.eccezioni.map((e) => e.tipo),
  ]);
}

// Passo 3: tipi di giorno, settimana, eccezioni e revisione settimanale.
export function controllaCalendario(bozza) {
  const errori = [];
  const ids = new Set(bozza.tipiGiorno.map((t) => t.id));

  if (bozza.tipiGiorno.length === 0) errori.push({ codice: 'nessun-tipo' });
  const nomi = new Map();
  bozza.tipiGiorno.forEach((t, indice) => {
    if (vuoto(t.nome)) {
      errori.push({ codice: 'nome-tipo-mancante', indice });
      return;
    }
    const chiave = t.nome.trim().toLowerCase();
    if (nomi.has(chiave)) errori.push({ codice: 'nome-tipo-ripetuto', indice });
    nomi.set(chiave, indice);
  });

  for (let giorno = 1; giorno <= 7; giorno++) {
    if (!ids.has(bozza.calendario.settimana[giorno])) errori.push({ codice: 'giorno-senza-tipo', giorno });
  }

  bozza.calendario.eccezioni.forEach((e, indice) => {
    if (!giornoValido(e.dal)) errori.push({ codice: 'eccezione-dal-mancante', indice });
    else if (e.al && !giornoValido(e.al)) errori.push({ codice: 'eccezione-al-non-valido', indice });
    else if (e.al && e.al < e.dal) errori.push({ codice: 'eccezione-al-prima-di-dal', indice });
    if (!ids.has(e.tipo)) errori.push({ codice: 'eccezione-senza-tipo', indice });
  });

  const { giorno, ora } = bozza.revisione;
  if (!Number.isInteger(giorno) || giorno < 1 || giorno > 7) errori.push({ codice: 'revisione-giorno' });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(ora ?? '')) errori.push({ codice: 'revisione-ora' });

  return errori;
}

// Un tipo di giorno si può eliminare solo se non è usato nel calendario.
export function tipoEliminabile(bozza, idTipo) {
  return !tipiInUso(bozza).has(idTipo);
}

export function nuovoIdTipo(bozza) {
  let n = bozza.tipiGiorno.length + 1;
  while (bozza.tipiGiorno.some((t) => t.id === `tipo-${n}`)) n++;
  return `tipo-${n}`;
}

// Passo 4: comportamenti attesi (CA). Ogni campo segue la sezione 4 dei requisiti.
//   tipo:   'fisso' | 'scelta' | 'catalogo'        stato: 'attivo' | 'catalogo' | 'laureato'
//   perTipo: per ogni tipo di giorno { previsto, stelline, automatica }
//   automaticaSeDomaniNon: tipi di giorno; se domani non è di uno di questi, la stellina è automatica
export const MOMENTI = ['mattina', 'pomeriggio', 'sera'];

export function statoDaTipo(tipo) {
  return tipo === 'catalogo' ? 'catalogo' : 'attivo';
}

export function nuovoComportamento(tipiGiorno, id) {
  return {
    id,
    nome: '',
    icona: null,
    frase: '',
    definizione: '',
    tipo: 'fisso',
    stato: 'attivo',
    momento: 'mattina',
    validita: 'oggi',
    perTipo: Object.fromEntries(tipiGiorno.map((t) => [t.id, { previsto: true, stelline: 1, automatica: false }])),
    automaticaSeDomaniNon: [],
    massimoSolleciti: 3,
    timer: null,
    laurea: { percentuale: 80, settimane: 3 },
  };
}

// Le regole per tipo di giorno restano allineate ai tipi esistenti (aggiunti o eliminati al passo 3).
export function allineaAiTipi(comportamento, tipiGiorno) {
  const ids = new Set(tipiGiorno.map((t) => t.id));
  return {
    ...comportamento,
    perTipo: Object.fromEntries(tipiGiorno.map((t) => [
      t.id, comportamento.perTipo?.[t.id] ?? { previsto: false, stelline: 1, automatica: false },
    ])),
    automaticaSeDomaniNon: (comportamento.automaticaSeDomaniNon ?? []).filter((id) => ids.has(id)),
  };
}

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

export function controllaComportamento(c, tipiGiorno) {
  const errori = [];
  if (vuoto(c.nome)) errori.push({ codice: 'ca-nome-mancante' });
  if (!c.icona) errori.push({ codice: 'ca-icona-mancante' });
  if (vuoto(c.frase)) errori.push({ codice: 'ca-frase-mancante' });
  if (vuoto(c.definizione)) errori.push({ codice: 'ca-definizione-mancante' });
  if (!['fisso', 'scelta', 'catalogo'].includes(c.tipo)) errori.push({ codice: 'ca-tipo' });
  if (!MOMENTI.includes(c.momento)) errori.push({ codice: 'ca-momento' });
  if (!['oggi', 'domani'].includes(c.validita)) errori.push({ codice: 'ca-validita' });

  let inUnGiorno = false;
  for (const t of tipiGiorno) {
    const r = c.perTipo?.[t.id];
    if (!r || !(r.previsto || r.automatica)) continue;
    inUnGiorno = true;
    if (!intero(r.stelline, 1, 10)) errori.push({ codice: 'ca-stelline', tipo: t.id });
  }
  if (!inUnGiorno) errori.push({ codice: 'ca-nessun-giorno' });

  if (!intero(c.massimoSolleciti, 0, 10)) errori.push({ codice: 'ca-solleciti' });
  if (c.timer != null && !intero(c.timer, 1, 120)) errori.push({ codice: 'ca-timer' });
  if (!intero(c.laurea?.percentuale, 50, 100) || !intero(c.laurea?.settimane, 1, 12)) {
    errori.push({ codice: 'ca-laurea' });
  }
  return errori;
}

// Passo 4: almeno un comportamento, e ognuno completo. L'indice dice quale CA è da correggere.
export function controllaComportamenti(bozza) {
  if (bozza.comportamenti.length === 0) return [{ codice: 'nessun-comportamento' }];
  return bozza.comportamenti.flatMap((c, indice) =>
    controllaComportamento(c, bozza.tipiGiorno).length ? [{ codice: 'ca-incompleto', indice }] : []);
}

export function nuovoIdComportamento(bozza) {
  let n = bozza.comportamenti.length + 1;
  while (bozza.comportamenti.some((c) => c.id === `ca-${n}`)) n++;
  return `ca-${n}`;
}
