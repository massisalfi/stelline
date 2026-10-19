// Schermata Oggi e registrazione rapida (RF-G02, RF-G03).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statoInOggi, sceltePronte, nuovaRegistrazione } from '../src/regole/oggi.js';
import { saldo } from '../src/regole/portafoglio.js';
import { calendario, pastelli, scarpe, pesce, LUNEDI, MARTEDI } from './esempi.js';

const base = { calendario, genitore: 'genitore-1', quando: 1_000, versione: 1 };

test('RF-G02: stato di ogni comportamento nella lista di Oggi', () => {
  assert.equal(statoInOggi('previsto', null), 'da fare');
  assert.equal(statoInOggi('automatico', null), 'automatico');
  assert.equal(statoInOggi('previsto', { valida: true, stellinaAccettata: true }), 'eseguito');
  assert.equal(statoInOggi('previsto', { valida: true, stellinaAccettata: false }), 'rifiutata');
  assert.equal(statoInOggi('previsto', { valida: false }), 'non eseguito');
});

test('RF-G03: si salva solo dopo aver detto se è stato eseguito', () => {
  assert.equal(sceltePronte({}), false);
  assert.equal(sceltePronte({ eseguito: false }), true);
  assert.equal(sceltePronte({ eseguito: true, solleciti: 0 }), true);
  assert.equal(sceltePronte({ eseguito: true, solleciti: 'oltre' }), true);
  assert.equal(sceltePronte({ eseguito: true }), false);
});

test('CT-19: caso più frequente (eseguito, 0 solleciti, accettata) → stelline e punti', () => {
  const { registrazione, movimenti, punti } = nuovaRegistrazione({
    ...base, id: 'r1', comportamento: pesce, giorno: LUNEDI, giornoRegistrazione: LUNEDI,
    scelte: { eseguito: true, solleciti: 0, stellinaAccettata: true },
  });
  assert.equal(registrazione.valida, true);
  assert.equal(registrazione.stelline, 2);
  assert.equal(registrazione.punti, 2);
  assert.equal(saldo(LUNEDI, movimenti), 2);
  assert.deepEqual(punti, [{ id: 'r1-punti', giorno: LUNEDI, quantita: 2, origine: { registrazione: 'r1' } }]);
});

test('CT-03 dalla registrazione: "vale domani" registrato lunedì sera → stellina martedì', () => {
  const { movimenti } = nuovaRegistrazione({
    ...base, id: 'r2', comportamento: scarpe, giorno: LUNEDI, giornoRegistrazione: LUNEDI,
    scelte: { eseguito: true, solleciti: 1 },
  });
  assert.equal(saldo(MARTEDI, movimenti), 1);
  assert.equal(saldo(LUNEDI, movimenti), 0);
});

test('CT-07 dalla registrazione: stellina rifiutata → nessuna stellina, punti sì', () => {
  const { registrazione, movimenti, punti } = nuovaRegistrazione({
    ...base, id: 'r3', comportamento: pastelli, giorno: LUNEDI, giornoRegistrazione: LUNEDI,
    scelte: { eseguito: true, solleciti: 0, stellinaAccettata: false },
  });
  assert.equal(registrazione.valida, true);
  assert.deepEqual(movimenti, []);
  assert.equal(punti[0].quantita, 1);
});

test('CT-08 dalla registrazione: oltre i solleciti → niente stelline, niente punti', () => {
  const { registrazione, movimenti, punti } = nuovaRegistrazione({
    ...base, id: 'r4', comportamento: pastelli, giorno: LUNEDI, giornoRegistrazione: LUNEDI,
    scelte: { eseguito: true, solleciti: 'oltre', stellinaAccettata: true },
  });
  assert.equal(registrazione.valida, false);
  assert.deepEqual([movimenti, punti], [[], []]);
});

test('non eseguito: registrazione salvata senza solleciti né stelline', () => {
  const { registrazione, movimenti } = nuovaRegistrazione({
    ...base, id: 'r5', comportamento: pastelli, giorno: LUNEDI, giornoRegistrazione: LUNEDI,
    scelte: { eseguito: false, solleciti: 2, dubbio: true, nota: '  ha iniziato tardi  ' },
  });
  assert.equal(registrazione.eseguito, false);
  assert.equal(registrazione.solleciti, null);
  assert.equal(registrazione.dubbio, true);
  assert.equal(registrazione.nota, 'ha iniziato tardi');
  assert.deepEqual(movimenti, []);
});

test('registrazione in ritardo ("ieri"): giorno di competenza ieri, stelline e punti nel giorno di registrazione', () => {
  const { registrazione, movimenti, punti } = nuovaRegistrazione({
    ...base, id: 'r6', comportamento: scarpe, giorno: LUNEDI, giornoRegistrazione: MARTEDI,
    scelte: { eseguito: true, solleciti: 0 },
  });
  assert.equal(registrazione.giorno, LUNEDI);
  assert.equal(saldo(MARTEDI, movimenti), 1);
  assert.equal(punti[0].giorno, MARTEDI);
});
