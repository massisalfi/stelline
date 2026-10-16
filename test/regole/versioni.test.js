// Versioni della configurazione: le modifiche valgono dal giorno dopo (sezione 4, CT-15).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuovaVersione, versioneDelGiorno, ultimaVersione } from '../../src/regole/versioni.js';

const ore = (giorno, h, m = 0) => {
  const [a, mese, g] = giorno.split('-').map(Number);
  return new Date(a, mese - 1, g, h, m).getTime();
};

test('la prima configurazione vale subito', () => {
  const v1 = nuovaVersione([], { costoBlocco: 5 }, 'Genitore A', ore('2026-10-12', 21));
  assert.equal(v1.numero, 1);
  assert.equal(v1.validaDal, '2026-10-12');
  assert.equal(v1.autore, 'Genitore A');
});

test('CT-15: un costo modificato alle 15:00 vale da domani', () => {
  const v1 = nuovaVersione([], { costoBlocco: 5 }, 'Genitore A', ore('2026-10-10', 9));
  const v2 = nuovaVersione([v1], { costoBlocco: 6 }, 'Genitore B', ore('2026-10-12', 15));
  assert.equal(v2.numero, 2);
  assert.equal(v2.validaDal, '2026-10-13');
  const versioni = [v1, v2];
  assert.equal(versioneDelGiorno('2026-10-12', versioni).contenuto.costoBlocco, 5);
  assert.equal(versioneDelGiorno('2026-10-13', versioni).contenuto.costoBlocco, 6);
});

test('modifiche anche a mezzanotte meno un minuto valgono dal giorno dopo', () => {
  const v1 = nuovaVersione([], {}, 'A', ore('2026-10-10', 9));
  const v2 = nuovaVersione([v1], {}, 'A', ore('2026-10-12', 23, 59));
  assert.equal(v2.validaDal, '2026-10-13');
});

test('due modifiche nello stesso giorno: domani vale l\'ultima', () => {
  const v1 = nuovaVersione([], { costoBlocco: 5 }, 'A', ore('2026-10-10', 9));
  const v2 = nuovaVersione([v1], { costoBlocco: 6 }, 'A', ore('2026-10-12', 10));
  const v3 = nuovaVersione([v1, v2], { costoBlocco: 7 }, 'B', ore('2026-10-12', 18));
  const versioni = [v3, v1, v2];
  assert.equal(versioneDelGiorno('2026-10-12', versioni).numero, 1);
  assert.equal(versioneDelGiorno('2026-10-13', versioni).numero, 3);
  assert.equal(ultimaVersione(versioni).numero, 3);
});

test('i giorni passati restano legati alla versione allora in vigore (niente retroattività)', () => {
  const v1 = nuovaVersione([], { costoBlocco: 5 }, 'A', ore('2026-10-01', 9));
  const v2 = nuovaVersione([v1], { costoBlocco: 6 }, 'A', ore('2026-10-12', 15));
  assert.equal(versioneDelGiorno('2026-10-05', [v1, v2]).contenuto.costoBlocco, 5);
  assert.equal(versioneDelGiorno('2026-09-30', [v1, v2]), null);
});
