// RN-03 Validità e RN-04 Rifiuto, più le regole di Annulla e correzioni (RF-G03, RF-G05).
//
// Registrazione: {
//   id, comportamento, giorno (di competenza), quando (istante, ms), giornoRegistrazione,
//   genitore, eseguito, solleciti (numero, oppure 'oltre'), stellinaAccettata, dubbio, nota
// }

export const SECONDI_ANNULLA = 10;

// RN-03: valida se il CA è eseguito con solleciti ≤ massimo del CA.
export function valida(registrazione, massimoSolleciti) {
  const { eseguito, solleciti } = registrazione;
  return eseguito === true
    && Number.isInteger(solleciti)
    && solleciti >= 0
    && solleciti <= massimoSolleciti;
}

// Effetti di una registrazione, dato il numero di stelline del CA in quel tipo di giorno.
//   stellinePortafoglio: quante entrano nel portafoglio;
//   puntiEsperienza:     quanti punti esperienza si accreditano;
//   eseguito:            se conta come eseguito per laurea, boss e grafici.
// RN-03: valida → tante stelline e altrettanti punti; non valida → zero. Niente frazioni.
// RN-04: stellina rifiutata → niente stelline, punti accreditati comunque, conta come eseguito.
export function effetti(registrazione, { massimoSolleciti, stelline }) {
  if (!Number.isInteger(stelline) || stelline < 0) throw new Error(`Stelline non valide: ${stelline}`);
  if (!valida(registrazione, massimoSolleciti)) {
    return { valida: false, stellinePortafoglio: 0, puntiEsperienza: 0, eseguito: false };
  }
  return {
    valida: true,
    stellinePortafoglio: registrazione.stellinaAccettata === false ? 0 : stelline,
    puntiEsperienza: stelline,
    eseguito: true,
  };
}

// RF-G03: l'Annulla resta disponibile per 10 secondi dal salvataggio.
export function annullabile(registrazione, adesso) {
  const trascorsi = adesso - registrazione.quando;
  return trascorsi >= 0 && trascorsi <= SECONDI_ANNULLA * 1000;
}

// RF-G04: animazione e voce per la bambina solo quando l'Annulla non è più possibile.
export function visibileAllaBambina(registrazione, adesso) {
  return adesso - registrazione.quando > SECONDI_ANNULLA * 1000;
}
