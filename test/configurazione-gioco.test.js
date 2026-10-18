// Configurazione, passi 6–10: economia, listino premi, stagioni e boss, sorprese, alert.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  economiaProposta, stagioniProposte, sorpreseProposte, alertProposti, nuovoPremio, nuovoIdPremio,
  controllaEconomia, controllaPremio, controllaPremi, sequenzaLivelli, spostaInSequenza,
  controllaStagioni, controllaSorprese, controllaAlert,
} from '../src/regole/configurazione-gioco.js';
import { nuovaBozza } from '../src/regole/configurazione.js';
import { valida } from '../src/regole/validazione.js';

const codici = (errori) => errori.map((e) => e.codice);

test('passo 6: i valori proposti sono quelli dei requisiti e sono validi', () => {
  const e = economiaProposta();
  assert.deepEqual(e.conversione, { stelline: 5, minuti: 20, categoria: 'cartoni' });
  assert.equal(e.sogliaLivello, 40);
  assert.deepEqual(e.categorie.map((c) => [c.id, c.limite, c.tolleranza]), [['cartoni', 40, 45], ['videogiochi', 50, 55]]);
  assert.equal(e.tettoTotale, 90);
  assert.equal(e.confermaRiscatto, 'tutti');
  assert.deepEqual(controllaEconomia(e), []);
});

test('passo 6: la tolleranza non può essere sotto il limite e la conversione usa una categoria esistente', () => {
  const e = economiaProposta();
  e.categorie[0].tolleranza = 30;
  e.conversione.categoria = 'film';
  e.categorie[1].nome = 'cartoni';
  assert.deepEqual(codici(controllaEconomia(e)), ['conversione-categoria', 'categoria-tolleranza', 'categoria-nome-ripetuto']);
});

test('passo 7: un premio va completato; costo solo per i premi a stelline, minuti solo per quelli di schermo', () => {
  const categorie = economiaProposta().categorie;
  const p = nuovoPremio('premio-1');
  assert.deepEqual(codici(controllaPremio(p, categorie)), ['premio-nome-mancante', 'premio-icona-mancante']);
  Object.assign(p, { nome: 'Adesivo', icona: 'adesivo' });
  assert.deepEqual(controllaPremio(p, categorie), []);
  p.costo = 0;
  assert.deepEqual(codici(controllaPremio(p, categorie)), ['premio-costo']);
  p.modalita = 'livello'; // il costo non conta più
  assert.deepEqual(controllaPremio(p, categorie), []);
  p.categoria = 'videogiochi';
  assert.deepEqual(codici(controllaPremio(p, categorie)), ['premio-minuti']);
  p.minuti = 30;
  p.euro = -2;
  assert.deepEqual(codici(controllaPremio(p, categorie)), ['premio-euro']);
});

test('passo 7: i premi di livello formano una sequenza ordinata che si può riordinare', () => {
  const premi = ['a', 'b', 'c', 'd'].map((n, i) => ({ ...nuovoPremio(`p-${n}`), modalita: i === 1 ? 'stelline' : 'livello' }));
  assert.deepEqual(sequenzaLivelli(premi).map((p) => p.id), ['p-a', 'p-c', 'p-d']);
  const giu = spostaInSequenza(premi, 'p-a', 1);
  assert.deepEqual(sequenzaLivelli(giu).map((p) => p.id), ['p-c', 'p-a', 'p-d']);
  assert.equal(giu[1].id, 'p-b'); // gli altri premi restano dove sono
  assert.deepEqual(spostaInSequenza(premi, 'p-a', -1), premi); // il primo non sale oltre
  assert.equal(nuovoIdPremio(premi), 'premio-5');
});

test('passo 7: un listino con un premio incompleto si segnala, uno vuoto no', () => {
  const categorie = economiaProposta().categorie;
  assert.deepEqual(controllaPremi([], categorie), []);
  assert.deepEqual(controllaPremi([nuovoPremio('x')], categorie), [{ codice: 'premio-incompleto', indice: 0 }]);
});

test('passo 8: stagione di 4–6 settimane, boss a percentuale o su un CA attivo', () => {
  const s = stagioniProposte();
  assert.equal(s.settimane, 5);
  assert.deepEqual(s.boss, { tipo: 'percentuale', percentuale: 80, comportamento: null, giorni: 5 });
  assert.deepEqual(controllaStagioni(s, []), []);
  s.settimane = 7;
  s.boss = { tipo: 'comportamento', comportamento: 'ca-1', giorni: 5, percentuale: 80 };
  assert.deepEqual(codici(controllaStagioni(s, [{ id: 'ca-1', stato: 'catalogo' }])), ['stagione-settimane', 'boss-comportamento']);
  s.settimane = 4;
  assert.deepEqual(controllaStagioni(s, [{ id: 'ca-1', stato: 'attivo' }]), []);
});

test('passo 9: sorprese da 1 a 10 giorni; il massimo supera il minimo; almeno un contenuto', () => {
  const s = sorpreseProposte();
  assert.deepEqual([s.minimo, s.massimo], [1, 10]);
  assert.deepEqual(controllaSorprese(s), []);
  s.massimo = 1;
  s.contenuti = { avatar: false, storia: false, creature: false, bonus: false };
  assert.deepEqual(codici(controllaSorprese(s)), ['sorprese-massimo', 'sorprese-contenuti']);
});

test('passo 10: le soglie proposte degli alert sono quelle di RN-15 e sono modificabili entro limiti sensati', () => {
  const a = alertProposti();
  assert.deepEqual(a, {
    a2: { percentuale: 50, settimane: 2 }, a3: { rifiutate: 3 }, a4: { dubbi: 3 },
    a5: { punti: 5, settimane: 6 }, a6: { revisioni: 2 }, a8: { giorni: 7 },
  });
  assert.deepEqual(controllaAlert(a), []);
  a.a8.giorni = 0;
  assert.deepEqual(controllaAlert(a), [{ codice: 'alert-soglia', alert: 'a8', campo: 'giorni' }]);
});

test('la bozza nuova contiene le sezioni dei passi 6–10 e il riepilogo le usa', () => {
  const b = nuovaBozza();
  assert.ok(b.economia && Array.isArray(b.premi) && b.stagioni && b.sorprese && b.alert);
  const esito = valida(b);
  // Bozza vuota: mancano genitori e comportamenti; sui premi solo avvisi.
  assert.ok(esito.avvisi.some((a) => a.codice === 'boss-senza-premio'));
});

import { ICONE_PREMI } from '../src/risorse/icone-premi.js';
import { existsSync } from 'node:fs';

test('ogni icona dei premi ha il suo file', () => {
  for (const { id } of ICONE_PREMI) {
    assert.ok(existsSync(new URL(`../risorse/icone/premi/${id}.svg`, import.meta.url)), id);
  }
});

import { importaListino, LISTINO_ESEMPIO } from '../src/modello-esempio.js';

test('listino d\'esempio: si importa su richiesta, completo, senza doppioni, con 5 premi di livello e il boss', () => {
  const b = importaListino(nuovaBozza());
  assert.equal(b.premi.length, LISTINO_ESEMPIO.length);
  assert.deepEqual(controllaPremi(b.premi, b.economia.categorie), []);
  assert.equal(sequenzaLivelli(b.premi).length, 5);
  assert.ok(b.premi.some((p) => p.modalita === 'boss'));
  for (const p of b.premi) assert.ok(ICONE_PREMI.some((i) => i.id === p.icona), p.nome);
  assert.equal(importaListino(b).premi.length, LISTINO_ESEMPIO.length);
});

test('listino d\'esempio: un premio di schermo entra solo se la sua categoria esiste', () => {
  const b = nuovaBozza();
  b.economia.categorie = b.economia.categorie.filter((c) => c.id !== 'videogiochi');
  importaListino(b);
  assert.equal(b.premi.some((p) => p.categoria === 'videogiochi'), false);
});
