// Sessione dei genitori: chiusura dopo 2 minuti di inattività (CT-18) e profilo proposto (RF-G01).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessioneScaduta, profiloProposto, INATTIVITA_MASSIMA_MS, PRESSIONE_PROLUNGATA_MS } from '../src/regole/sessione.js';

const genitori = [
  { id: 'genitore-1', nome: 'Genitore A' },
  { id: 'genitore-2', nome: 'Genitore B' },
];

test('CT-18: la sessione resta aperta fino a 2 minuti senza tocchi, poi si chiude', () => {
  const t0 = 1_000_000;
  assert.equal(INATTIVITA_MASSIMA_MS, 120_000);
  assert.equal(sessioneScaduta(t0, t0), false);
  assert.equal(sessioneScaduta(t0, t0 + 119_999), false);
  assert.equal(sessioneScaduta(t0, t0 + 120_000), false);
  assert.equal(sessioneScaduta(t0, t0 + 120_001), true);
  // Anche dopo ore in secondo piano (iPad in standby): chiusa.
  assert.equal(sessioneScaduta(t0, t0 + 3 * 3600_000), true);
});

test('CT-18: un orologio che torna molto indietro chiude la sessione per prudenza', () => {
  assert.equal(sessioneScaduta(1_000_000, 1_000_000 - 30_000), false);
  assert.equal(sessioneScaduta(1_000_000, 1_000_000 - 120_000), true);
});

test('RF-G01: l\'accesso propone l\'ultimo profilo usato, altrimenti il primo', () => {
  assert.equal(profiloProposto(genitori, 'genitore-2').id, 'genitore-2');
  assert.equal(profiloProposto(genitori, undefined).id, 'genitore-1');
  assert.equal(profiloProposto(genitori, 'genitore-che-non-esiste').id, 'genitore-1');
  assert.equal(profiloProposto([], 'genitore-1'), null);
});

test('RF-G01: il gesto per entrare è una pressione prolungata di 1,5 secondi', () => {
  assert.equal(PRESSIONE_PROLUNGATA_MS, 1500);
});
