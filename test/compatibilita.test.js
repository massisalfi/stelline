// RNF-16 Compatibilità dei dati: ogni nuova versione apre i dati salvati da tutte le versioni precedenti.
//
// In test/compatibilita/ c'è una "fotografia" dei dati salvati da ogni versione pubblicata,
// ricavata dal suo codice originale e con contenuti inventati. Le fotografie non si modificano mai:
// prima di pubblicare una versione nuova se ne aggiunge una con  node strumenti/fotografia-dati.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { VERSIONE } from '../src/versione.js';
import {
  completaBozza, completaContenuto, FASI, nuovaBozza, nuovoComportamento,
  controllaGenitori, controllaGiocatrice, controllaCalendario, controllaComportamenti,
} from '../src/regole/configurazione.js';
import { verificaProporzione, verificaCatalogo } from '../src/regole/proporzione.js';
import { valida } from '../src/regole/validazione.js';
import { profiloProposto } from '../src/regole/sessione.js';

const CARTELLA = new URL('./compatibilita/', import.meta.url);
const confronta = (a, b) => a.split('.').map(Number).reduce((d, n, i) => d || n - Number(b.split('.')[i]), 0);
const fotografie = readdirSync(CARTELLA)
  .filter((f) => /^\d+\.\d+\.\d+\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(new URL(f, CARTELLA), 'utf8')))
  .sort((a, b) => confronta(a.versione, b.versione));

// Ogni chiave presente nel modello deve esserci anche nel risultato, con lo stesso tipo di valore.
function stessaForma(risultato, modello, percorso = 'bozza') {
  for (const [chiave, atteso] of Object.entries(modello)) {
    const dove = `${percorso}.${chiave}`;
    assert.ok(chiave in risultato, `manca ${dove}`);
    const valore = risultato[chiave];
    if (atteso === null) continue; // campi facoltativi (es. timer, voce scelta)
    if (Array.isArray(atteso)) assert.ok(Array.isArray(valore), `${dove} dovrebbe essere un elenco`);
    else if (typeof atteso === 'object') stessaForma(valore, atteso, dove);
    else if (valore !== null) assert.equal(typeof valore, typeof atteso, `${dove} ha un tipo diverso`);
  }
}

// Ogni valore salvato deve ritrovarsi identico dopo l'apertura: nessun dato perso o cambiato.
function nienteDiPerso(originale, risultato, percorso = 'bozza') {
  if (originale === null || typeof originale !== 'object') {
    assert.deepEqual(risultato, originale, `${percorso} è cambiato`);
    return;
  }
  for (const [chiave, valore] of Object.entries(originale)) {
    nienteDiPerso(valore, risultato?.[chiave], `${percorso}.${chiave}`);
  }
}

test('c\'è la fotografia dei dati della versione attuale (da creare prima di pubblicare)', () => {
  assert.ok(fotografie.some((f) => f.versione === VERSIONE),
    `Manca test/compatibilita/${VERSIONE}.json: eseguite  node strumenti/fotografia-dati.js`);
});

test('le fotografie coprono la storia senza buchi e nessuna viene dal futuro', () => {
  assert.equal(fotografie[0].versione, '0.1.0');
  for (const f of fotografie) assert.ok(confronta(f.versione, VERSIONE) <= 0, `${f.versione} è più recente dell'app`);
});

for (const fotografia of fotografie) {
  const salvata = fotografia.stato.bozzaConfigurazione;

  test(`${fotografia.versione}: i dati salvati si aprono con la versione attuale`, () => {
    if (!salvata) return; // quella versione non salvava dati
    const aperta = completaBozza(structuredClone(salvata));
    stessaForma(aperta, nuovaBozza());
    for (const ca of aperta.comportamenti) {
      const { perTipo, ...modello } = nuovoComportamento(aperta.tipiGiorno, ca.id);
      stessaForma(ca, modello, `comportamento ${ca.id}`);
      for (const tipo of aperta.tipiGiorno) assert.ok(ca.perTipo[tipo.id], `${ca.id}: manca il tipo ${tipo.id}`);
    }
  });

  test(`${fotografia.versione}: nessun dato salvato va perso o cambia`, () => {
    if (!salvata) return;
    nienteDiPerso(salvata, completaBozza(structuredClone(salvata)));
  });

  test(`${fotografia.versione}: tutti i controlli della configurazione funzionano su quei dati`, () => {
    if (!salvata) return;
    const b = completaBozza(structuredClone(salvata));
    for (const controllo of [controllaGenitori, controllaGiocatrice, controllaCalendario, controllaComportamenti]) {
      assert.ok(Array.isArray(controllo(b)), controllo.name);
    }
    verificaProporzione(b.comportamenti);
    verificaCatalogo(b.comportamenti);
    valida({ ...b, economia: {}, premi: [], stagioni: {} });
    // Riaprire dati già aperti non cambia nulla.
    assert.deepEqual(completaBozza(structuredClone(b)), b);
  });
}

// Dati salvati dopo "Avvia la settimana 0" (dalla versione 0.5.0 in poi).
for (const fotografia of fotografie.filter((f) => f.avviata)) {
  const { stato, configurazioni } = fotografia.avviata;

  test(`${fotografia.versione} (avviata): fase, data di inizio e ultimo profilo si leggono`, () => {
    assert.ok(FASI.includes(stato.fase), `fase sconosciuta: ${stato.fase}`);
    assert.match(stato.inizioSettimana0, /^\d{4}-\d{2}-\d{2}$/);
    // L'ultimo profilo usato (dalla 0.6.0) è facoltativo; se c'è, è uno dei genitori o viene ignorato.
    if (stato.ultimoGenitore !== undefined) assert.equal(typeof stato.ultimoGenitore, 'string');
    const genitori = completaContenuto(structuredClone(configurazioni.at(-1).contenuto)).genitori;
    assert.ok(profiloProposto(genitori, stato.ultimoGenitore), 'nessun profilo da proporre');
  });

  test(`${fotografia.versione} (avviata): ogni versione della configurazione si apre senza perdere nulla`, () => {
    assert.ok(configurazioni.length >= 1);
    const { passo, ...modello } = nuovaBozza();
    for (const v of configurazioni) {
      assert.ok(Number.isInteger(v.numero) && v.validaDal && v.autore, `versione ${v.numero} incompleta`);
      const aperta = completaContenuto(structuredClone(v.contenuto));
      stessaForma(aperta, modello, `configurazione ${v.numero}`);
      nienteDiPerso(v.contenuto, aperta, `configurazione ${v.numero}`);
      for (const ca of aperta.comportamenti) {
        const { perTipo, ...modelloCA } = nuovoComportamento(aperta.tipiGiorno, ca.id);
        stessaForma(ca, modelloCA, `configurazione ${v.numero}, comportamento ${ca.id}`);
      }
      assert.equal(valida(aperta).valida, true, `configurazione ${v.numero} non più valida`);
    }
  });
}
