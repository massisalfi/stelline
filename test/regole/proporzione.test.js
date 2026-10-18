// RN-14 Proporzione 70/30 e validazione del riepilogo (sezione 4, passo 11).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotAScelta, verificaProporzione, verificaCatalogo } from '../../src/regole/proporzione.js';
import { valida, tipiUsati, stellineMassime } from '../../src/regole/validazione.js';
import { calendario } from '../esempi.js';

// Comportamenti inventati e numerati, previsti ogni giorno con 1 stellina.
function ca(n, tipo = 'fisso', stato = 'attivo') {
  return {
    id: `ca-${n}`, nome: `Comportamento di prova ${n}`, tipo, stato,
    momento: 'mattina', validita: 'oggi', massimoSolleciti: 3,
    perTipo: {
      scuola: { previsto: true, stelline: 1, automatica: false },
      weekend: { previsto: true, stelline: 1, automatica: false },
    },
  };
}

function elenco(fissi, aScelta, catalogo = 0) {
  let n = 0;
  return [
    ...Array.from({ length: fissi }, () => ca(++n, 'fisso')),
    ...Array.from({ length: aScelta }, () => ca(++n, 'scelta')),
    ...Array.from({ length: catalogo }, () => ca(++n, 'catalogo', 'catalogo')),
  ];
}

function configurazione(comportamenti, altro = {}) {
  return {
    genitori: [{ id: 'g1', nome: 'Genitore A', pin: { impronta: 'x' } }, { id: 'g2', nome: 'Genitore B', pin: { impronta: 'y' } }],
    calendario,
    comportamenti,
    economia: {
      conversione: { stelline: 5, minuti: 20, categoria: 'cartoni' },
      categorie: [{ id: 'cartoni', limite: 40, tolleranza: 45 }],
      tettoTotale: 90,
    },
    premi: [
      ...Array.from({ length: 5 }, () => ({ modalita: 'livello' })),
      { modalita: 'boss' },
    ],
    stagioni: { settimane: 5 },
    ...altro,
  };
}

const codici = (lista) => lista.map((e) => e.codice);

test('RN-14: slot a scelta = 30% dei CA attivi, arrotondato all\'intero più vicino', () => {
  const attesi = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 4, 15: 5, 20: 6 };
  for (const [n, k] of Object.entries(attesi)) assert.equal(slotAScelta(Number(n)), k, `${n} attivi`);
});

test('CT-02: 10 CA attivi di cui 4 a scelta → salvataggio bloccato; con 3 è ammesso', () => {
  assert.equal(verificaProporzione(elenco(6, 4)).ok, false);
  assert.equal(verificaProporzione(elenco(7, 3)).ok, true);
  const bloccata = valida(configurazione(elenco(6, 4, 2)));
  assert.equal(bloccata.valida, false);
  assert.deepEqual(bloccata.errori, [{ codice: 'proporzione', ok: false, attivi: 10, aScelta: 4, richiesti: 3 }]);
  assert.equal(valida(configurazione(elenco(7, 3, 2))).valida, true);
});

test('RN-14: i CA del catalogo e quelli laureati non contano tra gli attivi', () => {
  const lista = [...elenco(7, 3, 4), ca(99, 'scelta', 'laureato')];
  assert.deepEqual(verificaProporzione(lista), { ok: true, attivi: 10, aScelta: 3, richiesti: 3 });
});

test('RN-14: un CA laureato resta attivo finché non c\'è il sostituto, e la proporzione resta valida', () => {
  // Il CA a scelta n. 8 ha raggiunto il criterio: resta 'attivo' fino alla scelta del sostituto.
  const prima = elenco(7, 3, 2);
  assert.equal(verificaProporzione(prima).ok, true);
  // Sostituzione: il laureato esce, un CA del catalogo diventa a scelta e attivo.
  const dopo = prima.map((c) => {
    if (c.id === 'ca-8') return { ...c, stato: 'laureato' };
    if (c.id === 'ca-11') return { ...c, tipo: 'scelta', stato: 'attivo' };
    return c;
  });
  assert.equal(verificaProporzione(dopo).ok, true);
});

test('scelta reale: il catalogo deve offrire almeno due CA in più degli slot', () => {
  assert.deepEqual(verificaCatalogo(elenco(7, 3, 1)), { ok: false, disponibili: 4, richiesti: 5 });
  assert.deepEqual(verificaCatalogo(elenco(7, 3, 2)), { ok: true, disponibili: 5, richiesti: 5 });
  assert.ok(codici(valida(configurazione(elenco(7, 3, 1))).avvisi).includes('catalogo-ridotto'));
});

test('validazione: un genitore senza PIN blocca il salvataggio', () => {
  const config = configurazione(elenco(7, 3, 2), {
    genitori: [{ id: 'g1', nome: 'Genitore A', pin: { impronta: 'x' } }, { id: 'g2', nome: 'Genitore B' }],
  });
  const esito = valida(config);
  assert.equal(esito.valida, false);
  assert.deepEqual(esito.errori, [{ codice: 'genitore-senza-pin', genitore: 'Genitore B' }]);
  assert.deepEqual(codici(valida(configurazione(elenco(7, 3, 2), { genitori: [] })).errori), ['nessun-genitore']);
});

test('validazione: un tipo di giorno usato nel calendario senza CA blocca il salvataggio', () => {
  const conFesta = { ...calendario, eccezioni: [{ dal: '2026-12-25', al: '2026-12-25', tipo: 'festivo' }] };
  assert.deepEqual(tipiUsati(conFesta).sort(), ['festivo', 'scuola', 'weekend']);
  const esito = valida(configurazione(elenco(7, 3, 2), { calendario: conFesta }));
  assert.deepEqual(esito.errori, [{ codice: 'tipo-senza-ca', tipo: 'festivo' }]);
});

test('avviso: le stelline massime di un tipo di giorno non bastano per un blocco di cartoni', () => {
  const pochi = elenco(3, 1, 3); // 4 stelline al giorno, ne servono 5
  assert.equal(stellineMassime('scuola', pochi), 4);
  const esito = valida(configurazione(pochi));
  assert.equal(esito.valida, true);
  assert.deepEqual(esito.avvisi.filter((a) => a.codice === 'stelline-insufficienti').map((a) => a.tipo).sort(),
    ['scuola', 'weekend']);
});

test('avviso: le stelline massime convertite in minuti superano i tetti', () => {
  // 15 stelline → 3 blocchi da 20 = 60 minuti di cartoni, oltre la tolleranza di 45.
  const tanti = elenco(10, 5, 2);
  const esito = valida(configurazione(tanti));
  const oltre = esito.avvisi.filter((a) => a.codice === 'stelline-oltre-tetti');
  assert.equal(oltre.length, 2);
  assert.deepEqual(oltre[0], { codice: 'stelline-oltre-tetti', tipo: 'scuola', massimo: 15, minuti: 60, tetto: 45 });
});

test('avviso: sequenza dei premi di livello più corta della stagione, premio del boss mancante', () => {
  const esito = valida(configurazione(elenco(7, 3, 2), { premi: [{ modalita: 'livello' }, { modalita: 'stelline' }] }));
  assert.equal(esito.valida, true);
  assert.deepEqual(codici(esito.avvisi), ['sequenza-livelli-corta', 'boss-senza-premio']);
});

test('validazione: configurazione completa e coerente → nessun errore e nessun avviso', () => {
  assert.deepEqual(valida(configurazione(elenco(7, 3, 2))), { valida: true, errori: [], avvisi: [] });
});
