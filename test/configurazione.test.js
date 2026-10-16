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
