// Configurazione guidata, passi 1–3: PIN cifrati e controlli dei passi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinValido, creaImpronta, verificaPin } from '../src/sicurezza/pin.js';
import {
  nuovaBozza, controllaGenitori, controllaGiocatrice, controllaCalendario, tipoEliminabile, nuovoIdTipo,
} from '../src/regole/configurazione.js';

const codici = (errori) => errori.map((e) => e.codice);

test('PIN: da 4 a 6 cifre, solo numeri', () => {
  for (const pin of ['1234', '12345', '123456']) assert.equal(pinValido(pin), true, pin);
  for (const pin of ['123', '1234567', '12a4', '', null, 1234]) assert.equal(pinValido(pin), false, String(pin));
});

test('RNF-06: si conserva un\'impronta, non il PIN', async () => {
  const salvato = await creaImpronta('2468');
  assert.equal(JSON.stringify(salvato).includes('2468'), false);
  assert.match(salvato.impronta, /^[0-9a-f]{64}$/);
  assert.equal(await verificaPin('2468', salvato), true);
  assert.equal(await verificaPin('2469', salvato), false);
  assert.equal(await verificaPin('24680', salvato), false);
});

test('RNF-06: lo stesso PIN ha impronte diverse grazie al sale casuale', async () => {
  const a = await creaImpronta('1357');
  const b = await creaImpronta('1357');
  assert.notEqual(a.impronta, b.impronta);
  assert.equal(await verificaPin('1357', a), true);
  assert.equal(await verificaPin('1357', b), true);
});

test('PIN non valido: nessuna impronta', async () => {
  await assert.rejects(() => creaImpronta('12'));
  assert.equal(await verificaPin('1234', null), false);
});

test('passo 1: servono i nomi e i PIN di entrambi i genitori', async () => {
  const bozza = nuovaBozza();
  assert.deepEqual(codici(controllaGenitori(bozza)),
    ['nome-genitore-mancante', 'pin-mancante', 'nome-genitore-mancante', 'pin-mancante']);
  bozza.genitori[0] = { ...bozza.genitori[0], nome: 'Genitore A', pin: await creaImpronta('1111') };
  bozza.genitori[1] = { ...bozza.genitori[1], nome: 'Genitore B', pin: await creaImpronta('2222') };
  assert.deepEqual(controllaGenitori(bozza), []);
});

test('passo 1: i due genitori devono avere nomi diversi', async () => {
  const bozza = nuovaBozza();
  bozza.genitori[0] = { ...bozza.genitori[0], nome: 'Genitore', pin: await creaImpronta('1111') };
  bozza.genitori[1] = { ...bozza.genitori[1], nome: ' genitore ', pin: await creaImpronta('2222') };
  assert.deepEqual(codici(controllaGenitori(bozza)), ['nomi-genitori-uguali']);
});

test('passo 2: nome della giocatrice ed età tra 3 e 12 anni', () => {
  const bozza = nuovaBozza();
  assert.deepEqual(codici(controllaGiocatrice(bozza)), ['nome-giocatrice-mancante']);
  bozza.giocatrice.nome = 'Nome inventato';
  assert.deepEqual(controllaGiocatrice(bozza), []);
  bozza.giocatrice.eta = 2;
  assert.deepEqual(codici(controllaGiocatrice(bozza)), ['eta-non-valida']);
});

test('passo 3: i valori proposti sono già validi', () => {
  const bozza = nuovaBozza();
  assert.deepEqual(controllaCalendario(bozza), []);
  assert.equal(bozza.calendario.settimana[1], 'scuola');
  assert.equal(bozza.calendario.settimana[7], 'weekend');
  assert.deepEqual(bozza.revisione, { giorno: 7, ora: '18:00' });
});

test('passo 3: nomi dei tipi obbligatori e non ripetuti', () => {
  const bozza = nuovaBozza();
  bozza.tipiGiorno[2] = { ...bozza.tipiGiorno[2], nome: ' ' };
  bozza.tipiGiorno[3] = { ...bozza.tipiGiorno[3], nome: 'scuola' };
  assert.deepEqual(codici(controllaCalendario(bozza)), ['nome-tipo-mancante', 'nome-tipo-ripetuto']);
});

test('passo 3: ogni giorno della settimana ha un tipo esistente', () => {
  const bozza = nuovaBozza();
  bozza.calendario.settimana[3] = 'inesistente';
  assert.deepEqual(controllaCalendario(bozza), [{ codice: 'giorno-senza-tipo', giorno: 3 }]);
});

test('passo 3: eccezioni con date valide, fine non prima dell\'inizio e tipo esistente', () => {
  const bozza = nuovaBozza();
  bozza.calendario.eccezioni = [
    { dal: '2026-12-23', al: '2027-01-06', tipo: 'vacanza' },
    { dal: '2026-12-25', al: '', tipo: 'festivo' },
    { dal: '', al: '', tipo: 'festivo' },
    { dal: '2026-11-03', al: '2026-11-01', tipo: 'festivo' },
    { dal: '2026-11-10', al: '', tipo: 'sparito' },
  ];
  assert.deepEqual(controllaCalendario(bozza), [
    { codice: 'eccezione-dal-mancante', indice: 2 },
    { codice: 'eccezione-al-prima-di-dal', indice: 3 },
    { codice: 'eccezione-senza-tipo', indice: 4 },
  ]);
});

test('passo 3: revisione con giorno e ora validi', () => {
  const bozza = nuovaBozza();
  bozza.revisione = { giorno: 8, ora: '25:00' };
  assert.deepEqual(codici(controllaCalendario(bozza)), ['revisione-giorno', 'revisione-ora']);
});

test('passo 3: un tipo usato nel calendario non si può eliminare', () => {
  const bozza = nuovaBozza();
  assert.equal(tipoEliminabile(bozza, 'scuola'), false);
  assert.equal(tipoEliminabile(bozza, 'vacanza'), true);
  bozza.calendario.eccezioni = [{ dal: '2026-12-23', al: '2027-01-06', tipo: 'vacanza' }];
  assert.equal(tipoEliminabile(bozza, 'vacanza'), false);
});

test('passo 3: un nuovo tipo di giorno ha un identificativo mai usato', () => {
  const bozza = nuovaBozza();
  const id = nuovoIdTipo(bozza);
  assert.equal(bozza.tipiGiorno.some((t) => t.id === id), false);
});

import {
  nuovoComportamento, controllaComportamento, controllaComportamenti, allineaAiTipi,
} from '../src/regole/configurazione.js';
import { importaModello, MODELLO_ESEMPIO } from '../src/modello-esempio.js';
import { verificaProporzione, verificaCatalogo } from '../src/regole/proporzione.js';
import { ICONE_COMPORTAMENTI } from '../src/risorse/icone-comportamenti.js';
import { existsSync } from 'node:fs';

test('CT-01: al primo avvio nessun comportamento è precaricato', () => {
  assert.deepEqual(nuovaBozza().comportamenti, []);
  assert.deepEqual(codici(controllaComportamenti(nuovaBozza())), ['nessun-comportamento']);
});

test('passo 4: un comportamento nuovo va completato prima di andare avanti', () => {
  const bozza = nuovaBozza();
  const ca = nuovoComportamento(bozza.tipiGiorno, 'ca-1');
  assert.deepEqual(codici(controllaComportamento(ca, bozza.tipiGiorno)),
    ['ca-nome-mancante', 'ca-icona-mancante', 'ca-frase-mancante']);
  // La definizione operativa è facoltativa.
  Object.assign(ca, { nome: 'Prova', icona: 'giochi', frase: 'Hai fatto la prova.' });
  assert.deepEqual(controllaComportamento(ca, bozza.tipiGiorno), []);
  bozza.comportamenti = [ca, { ...ca, id: 'ca-2', nome: '' }];
  assert.deepEqual(controllaComportamenti(bozza), [{ codice: 'ca-incompleto', indice: 1 }]);
});

test('passo 4: stelline intere da 1 a 10 nei giorni previsti, almeno un giorno, valori sensati', () => {
  const bozza = nuovaBozza();
  const ca = { ...nuovoComportamento(bozza.tipiGiorno, 'ca-1'), nome: 'P', icona: 'giochi', frase: 'F', definizione: 'D' };
  ca.perTipo.scuola.stelline = 0;
  ca.massimoSolleciti = -1;
  ca.timer = 0;
  ca.laurea = { percentuale: 120, settimane: 3 };
  assert.deepEqual(codici(controllaComportamento(ca, bozza.tipiGiorno)),
    ['ca-stelline', 'ca-solleciti', 'ca-timer', 'ca-laurea']);
  const mai = { ...ca, massimoSolleciti: 3, timer: null, laurea: { percentuale: 80, settimane: 3 } };
  mai.perTipo = Object.fromEntries(bozza.tipiGiorno.map((t) => [t.id, { previsto: false, stelline: 1, automatica: false }]));
  assert.deepEqual(codici(controllaComportamento(mai, bozza.tipiGiorno)), ['ca-nessun-giorno']);
});

test('i comportamenti seguono i tipi di giorno aggiunti o eliminati', () => {
  const bozza = nuovaBozza();
  const ca = { ...nuovoComportamento(bozza.tipiGiorno, 'ca-1'), automaticaSeDomaniNon: ['scuola', 'vacanza'] };
  const tipi = [...bozza.tipiGiorno.filter((t) => t.id !== 'vacanza'), { id: 'nonni', nome: 'Nonni', colore: '#000' }];
  const allineato = allineaAiTipi(ca, tipi);
  assert.deepEqual(Object.keys(allineato.perTipo).sort(), ['festivo', 'nonni', 'scuola', 'weekend']);
  assert.equal(allineato.perTipo.nonni.previsto, false);
  assert.deepEqual(allineato.automaticaSeDomaniNon, ['scuola']);
});

test('modello d\'esempio: si importa solo su richiesta, completo, con la proporzione 70/30 rispettata', () => {
  const bozza = importaModello(nuovaBozza());
  assert.equal(bozza.comportamenti.length, MODELLO_ESEMPIO.length);
  assert.deepEqual(controllaComportamenti(bozza), []);
  assert.equal(verificaProporzione(bozza.comportamenti).ok, true);
  assert.equal(verificaCatalogo(bozza.comportamenti).ok, true);
  assert.equal(new Set(bozza.comportamenti.map((c) => c.id)).size, bozza.comportamenti.length);
  // Importarlo due volte non crea doppioni.
  assert.equal(importaModello(bozza).comportamenti.length, MODELLO_ESEMPIO.length);
});

test('ogni icona della libreria ha il suo file', () => {
  for (const { id } of ICONE_COMPORTAMENTI) {
    assert.ok(existsSync(new URL(`../risorse/icone/comportamenti/${id}.svg`, import.meta.url)), id);
  }
  for (const c of MODELLO_ESEMPIO) assert.ok(ICONE_COMPORTAMENTI.some((i) => i.id === c.icona), c.nome);
});

import { completaBozza } from '../src/regole/configurazione.js';

test('una bozza salvata con una versione precedente si completa senza perdere i dati', () => {
  // Bozza come la salvava la 0.2.x: senza comportamenti, voce senza tono e senza scelta.
  const vecchia = nuovaBozza();
  delete vecchia.comportamenti;
  vecchia.giocatrice.voce = { attiva: false, velocita: 0.8 };
  vecchia.passo = 4;
  vecchia.genitori[0].nome = 'Genitore A';
  vecchia.tipiGiorno = vecchia.tipiGiorno.slice(0, 2);
  const nuova = completaBozza(vecchia);
  assert.deepEqual(nuova.comportamenti, []);
  assert.deepEqual(nuova.giocatrice.voce, { attiva: false, velocita: 0.8, tono: 1, id: null });
  assert.equal(nuova.passo, 4);
  assert.equal(nuova.genitori[0].nome, 'Genitore A');
  assert.equal(nuova.tipiGiorno.length, 2);
  // Una bozza già completa non cambia.
  assert.deepEqual(completaBozza(nuova), nuova);
});
