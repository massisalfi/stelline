// RN-01 Giorno e RN-02 CA previsto.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  giornoDi, aggiungiGiorni, giornoDellaSettimana, differenzaGiorni, valido,
} from '../../src/regole/date.js';
import {
  tipoDelGiorno, inPausa, statoNelGiorno, previsto, stellineNelGiorno, comportamentiDelGiorno,
} from '../../src/regole/giorno.js';
import {
  calendario, comportamenti, pastelli, scarpe, pesce, LUNEDI, VENERDI, SABATO, DOMENICA,
} from '../esempi.js';

test('RN-01: il giorno è quello di calendario, dalle 00:00 alle 23:59 in ora locale', () => {
  assert.equal(giornoDi(new Date(2026, 9, 12, 0, 0, 0)), '2026-10-12');
  assert.equal(giornoDi(new Date(2026, 9, 12, 23, 59, 59)), '2026-10-12');
  assert.equal(giornoDi(new Date(2026, 9, 13, 0, 0, 0)), '2026-10-13');
});

test('RN-01: il cambio dell\'ora legale non sposta i giorni', () => {
  // In Italia l'ora legale finisce domenica 25 ottobre 2026 e ricomincia domenica 28 marzo 2027.
  assert.equal(aggiungiGiorni('2026-10-24', 1), '2026-10-25');
  assert.equal(aggiungiGiorni('2026-10-25', 1), '2026-10-26');
  assert.equal(aggiungiGiorni('2027-03-27', 2), '2027-03-29');
  assert.equal(differenzaGiorni('2026-10-24', '2026-10-26'), 2);
});

test('date: fine mese, fine anno, anno bisestile e giorni non validi', () => {
  assert.equal(aggiungiGiorni('2026-12-31', 1), '2027-01-01');
  assert.equal(aggiungiGiorni('2028-02-28', 1), '2028-02-29');
  assert.equal(aggiungiGiorni('2027-02-28', 1), '2027-03-01');
  assert.equal(valido('2026-02-30'), false);
  assert.equal(valido('2028-02-29'), true);
  assert.equal(valido('12/10/2026'), false);
});

test('date: 1 = lunedì, 7 = domenica', () => {
  assert.equal(giornoDellaSettimana(LUNEDI), 1);
  assert.equal(giornoDellaSettimana(VENERDI), 5);
  assert.equal(giornoDellaSettimana(DOMENICA), 7);
});

test('RN-01: il tipo di giorno viene dal giorno della settimana', () => {
  assert.equal(tipoDelGiorno(LUNEDI, calendario), 'scuola');
  assert.equal(tipoDelGiorno(SABATO, calendario), 'weekend');
});

test('RN-01: le eccezioni per data prevalgono sul giorno della settimana', () => {
  const conFesta = { ...calendario, eccezioni: [{ dal: LUNEDI, al: LUNEDI, tipo: 'festivo' }] };
  assert.equal(tipoDelGiorno(LUNEDI, conFesta), 'festivo');
  assert.equal(tipoDelGiorno('2026-10-13', conFesta), 'scuola');
});

test('RN-01: un intervallo di eccezione vale per tutti i suoi giorni, estremi compresi', () => {
  const vacanze = { ...calendario, eccezioni: [{ dal: '2026-12-23', al: '2027-01-06', tipo: 'vacanza' }] };
  assert.equal(tipoDelGiorno('2026-12-22', vacanze), 'scuola');
  assert.equal(tipoDelGiorno('2026-12-23', vacanze), 'vacanza');
  assert.equal(tipoDelGiorno('2027-01-01', vacanze), 'vacanza');
  assert.equal(tipoDelGiorno('2027-01-06', vacanze), 'vacanza');
  assert.equal(tipoDelGiorno('2027-01-07', vacanze), 'scuola');
});

test('RN-01: tra due eccezioni sovrapposte vale la più breve', () => {
  const cal = {
    ...calendario,
    eccezioni: [
      { dal: '2026-12-25', al: '2026-12-25', tipo: 'festivo' },
      { dal: '2026-12-23', al: '2027-01-06', tipo: 'vacanza' },
    ],
  };
  assert.equal(tipoDelGiorno('2026-12-25', cal), 'festivo');
  assert.equal(tipoDelGiorno('2026-12-24', cal), 'vacanza');
});

test('RN-02: CA previsto se attivo e previsto per quel tipo di giorno', () => {
  assert.equal(previsto(pesce, LUNEDI, calendario), true);
  assert.equal(previsto(pesce, SABATO, calendario), false);
  assert.equal(previsto(pastelli, SABATO, calendario), true);
});

test('RN-02: un CA non attivo non è mai previsto', () => {
  assert.equal(previsto({ ...pastelli, stato: 'catalogo' }, LUNEDI, calendario), false);
  assert.equal(previsto({ ...pastelli, stato: 'laureato' }, LUNEDI, calendario), false);
});

test('RN-02: un CA senza regole per quel tipo di giorno non è previsto', () => {
  const festa = { ...calendario, eccezioni: [{ dal: LUNEDI, al: LUNEDI, tipo: 'festivo' }] };
  assert.equal(statoNelGiorno(pastelli, LUNEDI, festa), 'non previsto');
});

test('RN-02 e CT-21: in pausa nessun CA è previsto', () => {
  const pause = [{ dal: LUNEDI, al: '2026-10-14' }];
  assert.equal(inPausa('2026-10-13', pause), true);
  assert.equal(inPausa('2026-10-15', pause), false);
  for (const c of comportamenti) {
    assert.equal(statoNelGiorno(c, '2026-10-13', calendario, pause), 'non previsto', c.nome);
  }
  assert.equal(statoNelGiorno(scarpe, VENERDI, calendario, [{ dal: VENERDI }]), 'non previsto');
});

test('RN-02: una pausa senza data di fine dura fino alla riattivazione', () => {
  const pause = [{ dal: LUNEDI }];
  assert.equal(inPausa('2027-05-01', pause), true);
  assert.equal(inPausa('2026-10-11', pause), false);
});

test('CA serale con regola del giorno dopo: previsto da domenica a giovedì, automatico venerdì e sabato', () => {
  assert.equal(statoNelGiorno(scarpe, DOMENICA, calendario), 'previsto');
  assert.equal(statoNelGiorno(scarpe, LUNEDI, calendario), 'previsto');
  assert.equal(statoNelGiorno(scarpe, '2026-10-15', calendario), 'previsto');
  assert.equal(statoNelGiorno(scarpe, VENERDI, calendario), 'automatico');
  assert.equal(statoNelGiorno(scarpe, SABATO, calendario), 'automatico');
});

test('regola del giorno dopo: se domani è festa, la stellina di stasera è automatica', () => {
  const festa = { ...calendario, eccezioni: [{ dal: '2026-10-13', al: '2026-10-13', tipo: 'festivo' }] };
  assert.equal(statoNelGiorno(scarpe, LUNEDI, festa), 'automatico');
});

test('stellina automatica per tipo di giorno', () => {
  const ca = { ...pastelli, perTipo: { ...pastelli.perTipo, weekend: { previsto: false, stelline: 1, automatica: true } } };
  assert.equal(statoNelGiorno(ca, SABATO, calendario), 'automatico');
  assert.equal(statoNelGiorno(ca, LUNEDI, calendario), 'previsto');
});

test('stelline del CA secondo il tipo di giorno', () => {
  assert.equal(stellineNelGiorno(pesce, LUNEDI, calendario), 2);
  assert.equal(stellineNelGiorno(pastelli, SABATO, calendario), 1);
});

test('RF-G02: i CA di oggi in ordine di momento della giornata', () => {
  const lunedi = comportamentiDelGiorno(comportamenti, LUNEDI, calendario);
  assert.deepEqual(lunedi.map((v) => v.comportamento.id), ['ca-pastelli', 'ca-pesce', 'ca-scarpe']);
  const sabato = comportamentiDelGiorno(comportamenti, SABATO, calendario);
  assert.deepEqual(sabato.map((v) => [v.comportamento.id, v.stato]), [
    ['ca-pastelli', 'previsto'],
    ['ca-scarpe', 'automatico'],
  ]);
});
