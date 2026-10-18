// Configurazione, passo 11: riepilogo d'insieme e avvio della settimana 0.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riepilogo, avvioSettimana0, contenutoConfigurazione, numeri } from '../src/regole/riepilogo.js';
import { nuovaBozza } from '../src/regole/configurazione.js';
import { importaModello, importaListino } from '../src/modello-esempio.js';
import { creaImpronta } from '../src/sicurezza/pin.js';

async function bozzaCompleta() {
  const b = nuovaBozza();
  b.genitori[0] = { ...b.genitori[0], nome: 'Genitore A', pin: await creaImpronta('1111') };
  b.genitori[1] = { ...b.genitori[1], nome: 'Genitore B', pin: await creaImpronta('2222') };
  b.giocatrice.nome = 'Giocatrice di prova';
  importaModello(b);
  importaListino(b);
  b.passo = 11;
  return b;
}

const codici = (lista) => lista.map((e) => e.codice);

test('CT-01: una configurazione vuota non si può avviare', () => {
  const esito = riepilogo(nuovaBozza());
  assert.equal(esito.avviabile, false);
  assert.deepEqual(esito.errori.filter((e) => e.codice === 'passo-da-correggere').map((e) => e.passo), [1, 2, 4]);
});

test('una configurazione completa e coerente si avvia, senza avvisi', async () => {
  const esito = riepilogo(await bozzaCompleta());
  assert.deepEqual(esito, { avviabile: true, errori: [], avvisi: [] });
});

test('CT-02: 10 CA attivi di cui 4 a scelta → avvio bloccato, da correggere al passo 5', async () => {
  const b = await bozzaCompleta();
  // Il modello ha 7 attivi (2 a scelta) e 2 di catalogo: ne rendo attivi altri 3, tutti a scelta.
  b.comportamenti.filter((c) => c.tipo === 'catalogo').forEach((c) => { c.tipo = 'scelta'; c.stato = 'attivo'; });
  b.comportamenti.push({ ...structuredClone(b.comportamenti[0]), id: 'ca-extra', nome: 'In più', tipo: 'fisso' });
  const esito = riepilogo(b);
  assert.equal(esito.avviabile, false);
  const proporzione = esito.errori.find((e) => e.codice === 'proporzione');
  assert.deepEqual([proporzione.attivi, proporzione.aScelta, proporzione.richiesti, proporzione.passo], [10, 4, 3, 5]);
});

test('un tipo di giorno usato senza comportamenti blocca l\'avvio (passo 4)', async () => {
  const b = await bozzaCompleta();
  b.calendario.eccezioni = [{ dal: '2026-12-25', al: '', tipo: 'nuovo' }];
  b.tipiGiorno.push({ id: 'nuovo', nome: 'Nuovo', colore: '#000' });
  const esito = riepilogo(b);
  assert.ok(esito.errori.some((e) => e.codice === 'tipo-senza-ca' && e.tipo === 'nuovo' && e.passo === 4));
});

test('un genitore senza PIN compare una volta sola, al passo 1', async () => {
  const b = await bozzaCompleta();
  b.genitori[1].pin = null;
  const esito = riepilogo(b);
  assert.deepEqual(esito.errori, [{ codice: 'passo-da-correggere', passo: 1, quanti: 1 }]);
});

test('gli avvisi non bloccano l\'avvio e dicono dove intervenire', async () => {
  const b = await bozzaCompleta();
  b.premi = b.premi.filter((p) => p.modalita !== 'boss');
  const esito = riepilogo(b);
  assert.equal(esito.avviabile, true);
  assert.deepEqual(esito.avvisi.map((a) => [a.codice, a.passo]), [['boss-senza-premio', 7]]);
});

test('avvio della settimana 0: versione 1, valida da subito, senza i dati della procedura', async () => {
  const b = await bozzaCompleta();
  const adesso = new Date(2026, 9, 19, 21, 30).getTime();
  const { versione, inizio } = avvioSettimana0(b, adesso);
  assert.equal(versione.numero, 1);
  assert.equal(versione.validaDal, '2026-10-19');
  assert.equal(inizio, '2026-10-19');
  assert.equal('passo' in versione.contenuto, false);
  assert.deepEqual(versione.contenuto, contenutoConfigurazione(b));
  assert.equal(JSON.stringify(versione).includes('1111'), false); // i PIN restano impronte
});

test('avvio impossibile con errori', () => {
  assert.throws(() => avvioSettimana0(nuovaBozza(), Date.now()));
});

test('numeri del riepilogo', async () => {
  const n = numeri(await bozzaCompleta());
  assert.deepEqual(n, { attivi: 7, fissi: 5, aScelta: 2, catalogo: 2, premiLivello: 5, premiStelline: 1, premiBoss: 1, premiRari: 1, eccezioni: 0 });
});

test('avviso giallo per ogni comportamento senza "cosa conta come eseguito", che non blocca l\'avvio', async () => {
  const b = await bozzaCompleta();
  b.comportamenti[0].definizione = '';
  b.comportamenti[3].definizione = '   ';
  const esito = riepilogo(b);
  assert.equal(esito.avviabile, true);
  assert.deepEqual(esito.avvisi.filter((a) => a.codice === 'ca-senza-definizione').map((a) => [a.comportamento, a.passo]), [
    [b.comportamenti[0].nome, 4],
    [b.comportamenti[3].nome, 4],
  ]);
});
