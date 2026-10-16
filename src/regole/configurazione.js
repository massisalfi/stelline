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
      voce: { attiva: true, velocita: 1 },
      suoni: { attivi: true, volume: 70 },
    },
    tipiGiorno: tipiProposti(),
    calendario: {
      settimana: { 1: 'scuola', 2: 'scuola', 3: 'scuola', 4: 'scuola', 5: 'scuola', 6: 'weekend', 7: 'weekend' },
      eccezioni: [],
    },
    revisione: { giorno: 7, ora: '18:00' },
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
