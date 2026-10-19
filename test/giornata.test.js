// Aggiornamento della giornata alla prima apertura: stelline automatiche e scadenze (RN-05, RN-06).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movimentiDellaGiornata } from '../src/regole/giornata.js';
import { saldo } from '../src/regole/portafoglio.js';
import { calendario, comportamenti, pastelli, scarpe, VENERDI, SABATO, DOMENICA, LUNEDI, MARTEDI } from './esempi.js';

const configurazione = { calendario, comportamenti };

test('sabato: arriva la stellina automatica di venerdì sera (vale domani), una volta sola', () => {
  const nuovi = movimentiDellaGiornata({ oggi: SABATO, configurazioneOggi: configurazione, configurazioneIeri: configurazione, movimenti: [] });
  assert.deepEqual(nuovi.map((m) => [m.tipo, m.giorno, m.quantita]), [['automatica', SABATO, 1]]);
  assert.deepEqual(movimentiDellaGiornata({ oggi: SABATO, configurazioneOggi: configurazione, configurazioneIeri: configurazione, movimenti: nuovi }), []);
});

test('la stellina "vale domani" segue la configurazione di ieri: se ieri non c\'era, non arriva', () => {
  const nuovi = movimentiDellaGiornata({ oggi: SABATO, configurazioneOggi: configurazione, configurazioneIeri: null, movimenti: [] });
  assert.deepEqual(nuovi, []);
});

test('automatica "vale oggi" nella configurazione di oggi', () => {
  const sempre = { ...pastelli, perTipo: { scuola: { previsto: false, stelline: 2, automatica: true }, weekend: { previsto: false, stelline: 2, automatica: true } } };
  const nuovi = movimentiDellaGiornata({ oggi: LUNEDI, configurazioneOggi: { calendario, comportamenti: [sempre] }, configurazioneIeri: null, movimenti: [] });
  assert.equal(saldo(LUNEDI, nuovi), 2);
});

test('CT-04 all\'apertura: il residuo di lunedì scade, una volta sola', () => {
  const movimenti = [{ giorno: LUNEDI, tipo: 'accredito', quantita: 3, origine: {} }];
  const nuovi = movimentiDellaGiornata({ oggi: MARTEDI, configurazioneOggi: configurazione, configurazioneIeri: configurazione, movimenti });
  assert.deepEqual(nuovi.filter((m) => m.tipo === 'scadenza').map((m) => [m.giorno, m.quantita]), [[LUNEDI, -3]]);
});

test('in pausa nessuna stellina automatica all\'apertura', () => {
  const nuovi = movimentiDellaGiornata({
    oggi: DOMENICA, configurazioneOggi: configurazione, configurazioneIeri: configurazione, movimenti: [], pause: [{ dal: SABATO, al: DOMENICA }],
  });
  assert.deepEqual(nuovi, []);
  assert.ok(comportamenti.includes(scarpe));
  assert.equal(VENERDI < SABATO, true);
});
