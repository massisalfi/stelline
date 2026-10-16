// Dati di prova inventati, usati da più test. Nessun dato reale.
// Il calendario di riferimento è ottobre 2026: lunedì 12, martedì 13, … domenica 18.

export const calendario = {
  settimana: { 1: 'scuola', 2: 'scuola', 3: 'scuola', 4: 'scuola', 5: 'scuola', 6: 'weekend', 7: 'weekend' },
  eccezioni: [],
};

export const LUNEDI = '2026-10-12';
export const MARTEDI = '2026-10-13';
export const VENERDI = '2026-10-16';
export const SABATO = '2026-10-17';
export const DOMENICA = '2026-10-18';

// Comportamento del mattino, vale oggi, previsto ogni giorno.
export const pastelli = {
  id: 'ca-pastelli',
  nome: 'Riordinare i pastelli',
  tipo: 'fisso',
  stato: 'attivo',
  momento: 'mattina',
  validita: 'oggi',
  massimoSolleciti: 3,
  perTipo: {
    scuola: { previsto: true, stelline: 1, automatica: false },
    weekend: { previsto: true, stelline: 1, automatica: false },
  },
};

// Comportamento serale che vale domani: previsto ogni sera, automatico quando
// il giorno dopo non è di scuola (come nel caso di collaudo CT-09).
export const scarpe = {
  id: 'ca-scarpe',
  nome: 'Mettere le scarpe in fila',
  tipo: 'fisso',
  stato: 'attivo',
  momento: 'sera',
  validita: 'domani',
  massimoSolleciti: 3,
  automaticaSeDomaniNon: ['scuola'],
  perTipo: {
    scuola: { previsto: true, stelline: 1, automatica: false },
    weekend: { previsto: true, stelline: 1, automatica: false },
  },
};

// Comportamento del pomeriggio a scelta, solo nei giorni di scuola, da 2 stelline.
export const pesce = {
  id: 'ca-pesce',
  nome: 'Dare da mangiare al pesce',
  tipo: 'scelta',
  stato: 'attivo',
  momento: 'pomeriggio',
  validita: 'oggi',
  massimoSolleciti: 2,
  perTipo: {
    scuola: { previsto: true, stelline: 2, automatica: false },
    weekend: { previsto: false, stelline: 1, automatica: false },
  },
};

export const comportamenti = [scarpe, pesce, pastelli];
