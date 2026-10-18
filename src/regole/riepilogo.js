// Configurazione, passo 11: riepilogo e validazione dell'insieme (sezione 4), e avvio della settimana 0.
// Gli errori bloccano l'avvio, gli avvisi lo consentono. Ognuno dice in quale passo si corregge.

import {
  controllaGenitori, controllaGiocatrice, controllaCalendario, controllaComportamenti,
} from './configurazione.js';
import {
  controllaEconomia, controllaPremi, controllaStagioni, controllaSorprese, controllaAlert,
} from './configurazione-gioco.js';
import { valida } from './validazione.js';
import { nuovaVersione } from './versioni.js';
import { giornoDi } from './date.js';

// Controlli di ogni passo, con il numero del passo in cui si correggono.
const CONTROLLI_DEI_PASSI = [
  [1, (b) => controllaGenitori(b)],
  [2, (b) => controllaGiocatrice(b)],
  [3, (b) => controllaCalendario(b)],
  [4, (b) => controllaComportamenti(b)],
  [6, (b) => controllaEconomia(b.economia)],
  [7, (b) => controllaPremi(b.premi, b.economia.categorie)],
  [8, (b) => controllaStagioni(b.stagioni, b.comportamenti)],
  [9, (b) => controllaSorprese(b.sorprese)],
  [10, (b) => controllaAlert(b.alert)],
];

// Dove si correggono gli errori e gli avvisi del riepilogo d'insieme.
const PASSO_DEL_CODICE = {
  'nessun-genitore': 1,
  'genitore-senza-pin': 1,
  proporzione: 5,
  'tipo-senza-ca': 4,
  'catalogo-ridotto': 5,
  'stelline-insufficienti': 6,
  'stelline-oltre-tetti': 6,
  'sequenza-livelli-corta': 7,
  'boss-senza-premio': 7,
};

export function riepilogo(bozza) {
  const errori = [];
  // Un passo con punti da correggere compare una volta sola, con il numero di punti.
  for (const [passo, controlla] of CONTROLLI_DEI_PASSI) {
    const trovati = controlla(bozza);
    if (trovati.length) errori.push({ codice: 'passo-da-correggere', passo, quanti: trovati.length });
  }
  const insieme = valida(bozza);
  const giaSegnalato = (passo) => errori.some((e) => e.codice === 'passo-da-correggere' && e.passo === passo);
  for (const e of insieme.errori) {
    const passo = PASSO_DEL_CODICE[e.codice];
    // I genitori senza PIN sono già tra i punti del passo 1.
    if (passo === 1 && giaSegnalato(1)) continue;
    errori.push({ ...e, passo });
  }
  const avvisi = insieme.avvisi.map((a) => ({ ...a, passo: PASSO_DEL_CODICE[a.codice] }));
  return { avviabile: errori.length === 0, errori, avvisi };
}

// Il contenuto della configurazione da salvare come versione: la bozza senza i dati della procedura.
export function contenutoConfigurazione(bozza) {
  const { passo, ...contenuto } = structuredClone(bozza);
  return contenuto;
}

// RF: "Avvia la settimana 0". Prima versione della configurazione, valida da subito (versioni.js).
export function avvioSettimana0(bozza, adesso) {
  const esito = riepilogo(bozza);
  if (!esito.avviabile) throw new Error('La configurazione ha ancora errori da correggere');
  return {
    versione: nuovaVersione([], contenutoConfigurazione(bozza), 'Configurazione iniziale', adesso),
    inizio: giornoDi(adesso),
  };
}

// Numeri principali per il riepilogo a schermo.
export function numeri(bozza) {
  const attivi = bozza.comportamenti.filter((c) => c.stato === 'attivo');
  return {
    attivi: attivi.length,
    fissi: attivi.filter((c) => c.tipo === 'fisso').length,
    aScelta: attivi.filter((c) => c.tipo === 'scelta').length,
    catalogo: bozza.comportamenti.filter((c) => c.tipo === 'catalogo').length,
    premiLivello: bozza.premi.filter((p) => p.modalita === 'livello').length,
    premiStelline: bozza.premi.filter((p) => p.modalita === 'stelline').length,
    premiBoss: bozza.premi.filter((p) => p.modalita === 'boss').length,
    premiRari: bozza.premi.filter((p) => p.modalita === 'raro').length,
    eccezioni: bozza.calendario.eccezioni.length,
  };
}
