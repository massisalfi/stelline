// RN-07 Riscatto a stelline e RN-08 Tetti di schermo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  minutiDelGiorno, proposto, minutiResidui, valutaRiscatto, bloccatoDaiTetti, bloccatoDallaPausa,
} from '../../src/regole/riscatto.js';

const economia = {
  categorie: [
    { id: 'cartoni', nome: 'Cartoni', limite: 40, tolleranza: 45 },
    { id: 'videogiochi', nome: 'Videogiochi', limite: 50, tolleranza: 55 },
  ],
  tettoTotale: 90,
};
const bloccoCartoni = { costo: 5, categoria: 'cartoni', minuti: 20 };
const videogioco = { costo: 0, categoria: 'videogiochi', minuti: 50 };
const adesivo = { costo: 3 }; // premio non di schermo, inventato

test('RN-07: ammesso se il costo è ≤ portafoglio', () => {
  assert.equal(valutaRiscatto({ premio: bloccoCartoni, portafoglio: 5, economia }).ammesso, true);
  assert.equal(valutaRiscatto({ premio: bloccoCartoni, portafoglio: 6, economia }).ammesso, true);
});

test('RN-07 e RF-B06: se le stelline non bastano, si sa quante ne mancano', () => {
  const esito = valutaRiscatto({ premio: bloccoCartoni, portafoglio: 2, economia });
  assert.deepEqual(esito, { ammesso: false, motivi: ['stelline'], mancano: 3 });
  assert.equal(bloccatoDaiTetti(esito), false);
});

test('CT-05: cartoni con limite 40 e tolleranza 45, con 40 minuti già usati nessun riscatto proposto', () => {
  assert.equal(proposto(bloccoCartoni, { cartoni: 40 }, economia), false);
  const esito = valutaRiscatto({ premio: bloccoCartoni, portafoglio: 10, minutiOggi: { cartoni: 40 }, economia });
  assert.equal(esito.ammesso, false);
  assert.deepEqual(esito.motivi, ['limite']);
});

test('CT-05: con 25 minuti già usati un blocco da 20 è ammesso (25 + 20 = 45, entro la tolleranza)', () => {
  assert.equal(proposto(bloccoCartoni, { cartoni: 25 }, economia), true);
  assert.equal(valutaRiscatto({ premio: bloccoCartoni, portafoglio: 5, minutiOggi: { cartoni: 25 }, economia }).ammesso, true);
});

test('CT-05: con 30 minuti già usati un blocco da 20 è bloccato (30 + 20 = 50, oltre la tolleranza)', () => {
  assert.equal(proposto(bloccoCartoni, { cartoni: 30 }, economia), true);
  const esito = valutaRiscatto({ premio: bloccoCartoni, portafoglio: 5, minutiOggi: { cartoni: 30 }, economia });
  assert.deepEqual(esito.motivi, ['tolleranza']);
  assert.equal(bloccatoDaiTetti(esito), true);
});

test('CT-06: cartoni 45 più videogiochi 50 → il secondo riscatto è bloccato dal tetto totale di 90', () => {
  const esito = valutaRiscatto({ premio: videogioco, fonte: 'scrigno', minutiOggi: { cartoni: 45 }, economia });
  assert.equal(esito.ammesso, false);
  assert.deepEqual(esito.motivi, ['totale']);
});

test('CT-06: il tetto totale vale anche con stelline bonus da sorpresa e per ogni fonte', () => {
  const minutiOggi = { cartoni: 45, videogiochi: 30 };
  for (const fonte of ['stelline', 'scrigno', 'sorpresa', 'raro']) {
    const esito = valutaRiscatto({ premio: { ...bloccoCartoni, categoria: 'videogiochi' }, fonte, portafoglio: 50, minutiOggi, economia });
    assert.equal(esito.ammesso, false, fonte);
    assert.ok(esito.motivi.includes('totale'), fonte);
  }
});

test('RN-08: i tetti valgono anche per i premi dello scrigno, senza costo in stelline', () => {
  assert.equal(valutaRiscatto({ premio: videogioco, fonte: 'scrigno', economia }).ammesso, true);
  const esito = valutaRiscatto({ premio: videogioco, fonte: 'scrigno', minutiOggi: { videogiochi: 10 }, economia });
  assert.deepEqual(esito.motivi, ['tolleranza']);
});

test('RN-08: i premi non di schermo non hanno tetti', () => {
  const minutiOggi = { cartoni: 45, videogiochi: 55 };
  assert.equal(proposto(adesivo, minutiOggi, economia), true);
  assert.equal(valutaRiscatto({ premio: adesivo, portafoglio: 3, minutiOggi, economia }).ammesso, true);
});

test('RF-B06: se mancano stelline e c\'è anche un tetto, prevale il messaggio "un altro giorno"', () => {
  const esito = valutaRiscatto({ premio: bloccoCartoni, portafoglio: 1, minutiOggi: { cartoni: 40 }, economia });
  assert.deepEqual(esito.motivi, ['stelline', 'limite']);
  assert.equal(bloccatoDaiTetti(esito), true);
});

test('RF-G08: minuti residui per categoria, tenendo conto del tetto totale', () => {
  assert.equal(minutiResidui('cartoni', {}, economia), 45);
  assert.equal(minutiResidui('cartoni', { cartoni: 25 }, economia), 20);
  assert.equal(minutiResidui('cartoni', { cartoni: 40 }, economia), 0);
  assert.equal(minutiResidui('videogiochi', { cartoni: 45 }, economia), 45);
  assert.equal(minutiResidui('videogiochi', { cartoni: 45, videogiochi: 40 }, economia), 5);
});

test('RN-08: minuti già riscattati oggi, per categoria', () => {
  const riscatti = [
    { giorno: '2026-10-12', categoria: 'cartoni', minuti: 20 },
    { giorno: '2026-10-12', categoria: 'cartoni', minuti: 20 },
    { giorno: '2026-10-12', categoria: 'videogiochi', minuti: 45 },
    { giorno: '2026-10-12' }, // premio non di schermo
    { giorno: '2026-10-11', categoria: 'cartoni', minuti: 20 },
  ];
  assert.deepEqual(minutiDelGiorno('2026-10-12', riscatti), { cartoni: 40, videogiochi: 45 });
});

test('RN-08: una categoria sconosciuta è un errore di configurazione', () => {
  assert.throws(() => valutaRiscatto({ premio: { costo: 1, categoria: 'film', minuti: 10 }, portafoglio: 5, economia }));
});

test('RF-G09: in pausa nessun riscatto nell\'app, da nessuna fonte, anche con stelline e minuti disponibili', () => {
  for (const fonte of ['stelline', 'scrigno', 'sorpresa', 'raro']) {
    for (const premio of [bloccoCartoni, adesivo, videogioco]) {
      const esito = valutaRiscatto({ premio, fonte, portafoglio: 50, minutiOggi: {}, economia, inPausa: true });
      assert.deepEqual(esito, { ammesso: false, motivi: ['pausa'], mancano: 0 }, `${fonte}`);
      assert.equal(bloccatoDallaPausa(esito), true);
      assert.equal(bloccatoDaiTetti(esito), false);
    }
  }
  // Fuori dalla pausa lo stesso riscatto è ammesso.
  assert.equal(valutaRiscatto({ premio: bloccoCartoni, portafoglio: 5, economia }).ammesso, true);
});
