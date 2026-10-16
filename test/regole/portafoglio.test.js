// RN-05 Stelline automatiche e RN-06 Portafoglio.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { automaticheDelGiorno } from '../../src/regole/automatiche.js';
import {
  giornoDelPortafoglio, accreditoDaRegistrazione, automaticheDaAccreditare,
  bonus, spesa, saldo, scadenzeDaRegistrare,
} from '../../src/regole/portafoglio.js';
import { effetti } from '../../src/regole/registrazione.js';
import { calendario, comportamenti, pastelli, scarpe, LUNEDI, MARTEDI, VENERDI, SABATO, DOMENICA } from '../esempi.js';

const registrazione = (campi) => ({
  id: 'r1', eseguito: true, solleciti: 0, stellinaAccettata: true, ...campi,
});

test('CT-03: CA "vale domani" registrato lunedì sera → +1 nel portafoglio di martedì, lunedì invariato', () => {
  const r = registrazione({ comportamento: scarpe.id, giorno: LUNEDI, giornoRegistrazione: LUNEDI });
  const m = accreditoDaRegistrazione(r, effetti(r, { massimoSolleciti: 3, stelline: 1 }), scarpe.validita);
  assert.equal(saldo(MARTEDI, [m]), 1);
  assert.equal(saldo(LUNEDI, [m]), 0);
});

test('RN-06: CA "vale oggi" → stelline nel portafoglio dello stesso giorno', () => {
  const r = registrazione({ giorno: LUNEDI, giornoRegistrazione: LUNEDI });
  assert.equal(giornoDelPortafoglio(r, 'oggi'), LUNEDI);
});

test('RN-06: registrazione in ritardo ("ieri") → stelline nel portafoglio del giorno di registrazione', () => {
  const tardi = registrazione({ giorno: LUNEDI, giornoRegistrazione: MARTEDI });
  assert.equal(giornoDelPortafoglio(tardi, 'oggi'), MARTEDI);
  assert.equal(giornoDelPortafoglio(tardi, 'domani'), MARTEDI);
});

test('RN-06 e CT-07: stellina rifiutata o non valida → nessun movimento', () => {
  const rifiutata = registrazione({ giorno: LUNEDI, giornoRegistrazione: LUNEDI, stellinaAccettata: false });
  assert.equal(accreditoDaRegistrazione(rifiutata, effetti(rifiutata, { massimoSolleciti: 3, stelline: 1 }), 'oggi'), null);
  const oltre = registrazione({ giorno: LUNEDI, giornoRegistrazione: LUNEDI, solleciti: 'oltre' });
  assert.equal(accreditoDaRegistrazione(oltre, effetti(oltre, { massimoSolleciti: 3, stelline: 1 }), 'oggi'), null);
});

test('CT-09 e RN-05: venerdì sera, domani è weekend → stellina automatica nel portafoglio di sabato', () => {
  const sabato = automaticheDelGiorno(SABATO, comportamenti, calendario);
  assert.deepEqual(sabato, [{ comportamento: scarpe.id, giornoOrigine: VENERDI, quantita: 1 }]);
  assert.deepEqual(automaticheDelGiorno(VENERDI, comportamenti, calendario), []);
});

test('RN-05: sabato sera (domani domenica) → automatica anche nel portafoglio di domenica', () => {
  assert.deepEqual(automaticheDelGiorno(DOMENICA, comportamenti, calendario),
    [{ comportamento: scarpe.id, giornoOrigine: SABATO, quantita: 1 }]);
});

test('RN-05: domenica sera (domani scuola) → nessuna automatica il lunedì: va registrata', () => {
  assert.deepEqual(automaticheDelGiorno(LUNEDI, comportamenti, calendario), []);
});

test('RN-05: automatica "vale oggi" → nel portafoglio dello stesso giorno', () => {
  const ca = { ...pastelli, perTipo: { ...pastelli.perTipo, weekend: { previsto: false, stelline: 2, automatica: true } } };
  assert.deepEqual(automaticheDelGiorno(SABATO, [ca], calendario), [{ comportamento: ca.id, giornoOrigine: SABATO, quantita: 2 }]);
});

test('RN-05 e CT-21: in pausa non arrivano stelline automatiche', () => {
  assert.deepEqual(automaticheDelGiorno(SABATO, comportamenti, calendario, [{ dal: VENERDI, al: VENERDI }]), []);
});

test('RN-05: le stelline automatiche si accreditano una volta sola', () => {
  const auto = automaticheDelGiorno(SABATO, comportamenti, calendario);
  const prima = automaticheDaAccreditare(SABATO, auto, []);
  assert.equal(prima.length, 1);
  assert.equal(prima[0].tipo, 'automatica');
  assert.deepEqual(automaticheDaAccreditare(SABATO, auto, prima), []);
  assert.equal(saldo(SABATO, prima), 1);
});

test('RN-06: portafoglio = accrediti + automatiche + bonus − spese', () => {
  const movimenti = [
    { giorno: SABATO, tipo: 'accredito', quantita: 3, origine: {} },
    { giorno: SABATO, tipo: 'automatica', quantita: 1, origine: {} },
    bonus(SABATO, 2, { sorpresa: 's1' }),
    spesa(SABATO, 5, { riscatto: 'k1' }),
    { giorno: DOMENICA, tipo: 'accredito', quantita: 1, origine: {} },
  ];
  assert.equal(saldo(SABATO, movimenti), 1);
  assert.equal(saldo(DOMENICA, movimenti), 1);
});

test('CT-04: 3 stelline non spese lunedì scadono a mezzanotte, con movimento di scadenza', () => {
  const movimenti = [
    { giorno: LUNEDI, tipo: 'accredito', quantita: 2, origine: {} },
    { giorno: LUNEDI, tipo: 'accredito', quantita: 1, origine: {} },
  ];
  // Lunedì stesso il residuo non scade ancora.
  assert.deepEqual(scadenzeDaRegistrare(LUNEDI, movimenti), []);
  const scadenze = scadenzeDaRegistrare(MARTEDI, movimenti);
  assert.deepEqual(scadenze, [{ giorno: LUNEDI, tipo: 'scadenza', quantita: -3, origine: { scadenza: LUNEDI } }]);
  const dopo = [...movimenti, ...scadenze];
  assert.equal(saldo(LUNEDI, dopo), 0);
  assert.equal(saldo(MARTEDI, dopo), 0);
  // La scadenza si registra una volta sola.
  assert.deepEqual(scadenzeDaRegistrare(MARTEDI, dopo), []);
});

test('RN-06: un giorno chiuso a zero non genera scadenze', () => {
  const movimenti = [
    { giorno: LUNEDI, tipo: 'accredito', quantita: 5, origine: {} },
    spesa(LUNEDI, 5, { riscatto: 'k1' }),
  ];
  assert.deepEqual(scadenzeDaRegistrare(MARTEDI, movimenti), []);
});

test('RN-06: scadenze di più giorni passati, anche dopo giorni senza aperture', () => {
  const movimenti = [
    { giorno: LUNEDI, tipo: 'accredito', quantita: 2, origine: {} },
    { giorno: MARTEDI, tipo: 'accredito', quantita: 1, origine: {} },
  ];
  const scadenze = scadenzeDaRegistrare(VENERDI, movimenti);
  assert.deepEqual(scadenze.map((s) => [s.giorno, s.quantita]), [[LUNEDI, -2], [MARTEDI, -1]]);
});
