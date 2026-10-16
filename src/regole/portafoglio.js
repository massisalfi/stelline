// RN-06 Portafoglio. Le stelline sono un registro di movimenti, non un contatore (requisiti, sezione 8):
// ogni accredito, spesa e scadenza è una riga, e il saldo di un giorno è la somma delle sue righe.
//
// Movimento: { giorno, tipo, quantita, origine }
//   tipo: 'accredito' (da registrazione) | 'automatica' | 'bonus' | 'spesa' | 'scadenza'
//   quantita: positiva per accrediti, negativa per spese e scadenze.
// Gli identificativi li aggiunge l'archivio.

import { giornoDopo } from './date.js';

// In quale portafoglio entrano le stelline di una registrazione.
// Registrata nel suo giorno: "vale oggi" → quel giorno; "vale domani" → il giorno dopo.
// Registrata in ritardo (giorno di competenza "ieri"): nel giorno in cui viene registrata.
export function giornoDelPortafoglio(registrazione, validita) {
  if (registrazione.giorno !== registrazione.giornoRegistrazione) return registrazione.giornoRegistrazione;
  return validita === 'domani' ? giornoDopo(registrazione.giorno) : registrazione.giorno;
}

export function accreditoDaRegistrazione(registrazione, effetti, validita) {
  if (effetti.stellinePortafoglio <= 0) return null;
  return {
    giorno: giornoDelPortafoglio(registrazione, validita),
    tipo: 'accredito',
    quantita: effetti.stellinePortafoglio,
    origine: { registrazione: registrazione.id },
  };
}

// Le stelline automatiche di un giorno non ancora accreditate (si accreditano una volta sola).
export function automaticheDaAccreditare(giorno, automatiche, movimenti) {
  const gia = new Set(movimenti
    .filter((m) => m.tipo === 'automatica')
    .map((m) => `${m.origine.comportamento}|${m.origine.giornoOrigine}`));
  return automatiche
    .filter((a) => !gia.has(`${a.comportamento}|${a.giornoOrigine}`))
    .map((a) => ({
      giorno,
      tipo: 'automatica',
      quantita: a.quantita,
      origine: { comportamento: a.comportamento, giornoOrigine: a.giornoOrigine },
    }));
}

export function bonus(giorno, quantita, origine) {
  return { giorno, tipo: 'bonus', quantita, origine };
}

export function spesa(giorno, quantita, origine) {
  return { giorno, tipo: 'spesa', quantita: -quantita, origine };
}

// Saldo del portafoglio di un giorno.
export function saldo(giorno, movimenti) {
  return movimenti.reduce((somma, m) => (m.giorno === giorno ? somma + m.quantita : somma), 0);
}

// A mezzanotte il residuo scade: per ogni giorno passato con saldo positivo e senza scadenza
// registrata si crea il movimento di scadenza (si calcola alla prima apertura del giorno dopo).
export function scadenzeDaRegistrare(oggi, movimenti) {
  const giorni = new Set(movimenti.filter((m) => m.giorno < oggi).map((m) => m.giorno));
  const scaduti = new Set(movimenti.filter((m) => m.tipo === 'scadenza').map((m) => m.giorno));
  return [...giorni].sort()
    .filter((g) => !scaduti.has(g))
    .map((g) => ({ giorno: g, residuo: saldo(g, movimenti) }))
    .filter(({ residuo }) => residuo > 0)
    .map(({ giorno, residuo }) => ({ giorno, tipo: 'scadenza', quantita: -residuo, origine: { scadenza: giorno } }));
}
