// RN-03 Validità, RN-04 Rifiuto, Annulla di 10 secondi (RF-G03) e feedback ritardato (RF-G04).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valida, effetti } from '../../src/regole/registrazione.js';

const ca = { massimoSolleciti: 3, stelline: 1 };
const reg = (campi) => ({ eseguito: true, solleciti: 0, stellinaAccettata: true, ...campi });

test('RN-03: eseguito con solleciti fino al massimo → valida', () => {
  for (const solleciti of [0, 1, 2, 3]) assert.equal(valida(reg({ solleciti }), 3), true, `${solleciti}`);
});

test('RN-03: solleciti oltre il massimo → non valida', () => {
  assert.equal(valida(reg({ solleciti: 4 }), 3), false);
  assert.equal(valida(reg({ solleciti: 'oltre' }), 3), false);
});

test('RN-03: non eseguito → non valida', () => {
  assert.equal(valida(reg({ eseguito: false }), 3), false);
});

test('RN-03: valida → tante stelline e altrettanti punti esperienza quante ne prevede il CA', () => {
  assert.deepEqual(effetti(reg({}), { massimoSolleciti: 3, stelline: 3 }), {
    valida: true, stellinePortafoglio: 3, puntiEsperienza: 3, eseguito: true,
  });
});

test('CT-08: solleciti oltre il massimo → zero stelline, zero punti, registrazione non valida', () => {
  assert.deepEqual(effetti(reg({ solleciti: 'oltre' }), ca), {
    valida: false, stellinePortafoglio: 0, puntiEsperienza: 0, eseguito: false,
  });
});

test('CT-07 e RN-04: stellina rifiutata → portafoglio invariato, punti accreditati, conta come eseguito', () => {
  assert.deepEqual(effetti(reg({ stellinaAccettata: false }), { massimoSolleciti: 3, stelline: 2 }), {
    valida: true, stellinePortafoglio: 0, puntiEsperienza: 2, eseguito: true,
  });
});

test('RN-04: il rifiuto non rende valida una registrazione non valida', () => {
  const e = effetti(reg({ eseguito: false, stellinaAccettata: false }), ca);
  assert.equal(e.puntiEsperienza, 0);
  assert.equal(e.eseguito, false);
});

test('RN-03: niente frazioni di stellina', () => {
  assert.throws(() => effetti(reg({}), { massimoSolleciti: 3, stelline: 0.5 }));
});
