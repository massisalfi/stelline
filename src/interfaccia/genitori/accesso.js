// Accesso all'area genitori (RF-G01): profilo e PIN, con l'ultimo profilo usato già proposto.

import { crea } from '../componenti/dom.js';
import { sceltaPulsanti, pulsante } from '../componenti/moduli.js';
import { creaTastierino } from '../componenti/tastierino.js';
import { verificaPin } from '../../sicurezza/pin.js';
import { profiloProposto } from '../../regole/sessione.js';
import { testi } from '../../testi/it.js';

const t = testi.accesso;

export function schermataAccesso({ genitori, ultimoId, alAccesso, alRitorno }) {
  let scelto = profiloProposto(genitori, ultimoId);
  const titoloPin = crea('h2', { class: 'titolo-pin' }, t.pin(scelto.nome));

  const tastierino = creaTastierino({
    aiuto: testi.configurazione.genitori.cifre,
    alFatto: async (pin) => {
      if (await verificaPin(pin, scelto.pin)) alAccesso(scelto);
      else tastierino.errore(t.sbagliato);
    },
  });

  return crea('main', { class: 'schermo accesso' }, [
    crea('header', { class: 'testata-accesso' }, [
      crea('h1', {}, t.titolo),
      pulsante(`‹ ${t.torna}`, alRitorno, { classe: 'leggero' }),
    ]),
    crea('div', { class: 'corpo-accesso' }, [
      genitori.length > 1
        ? sceltaPulsanti({
          etichetta: t.chi,
          valore: scelto.id,
          opzioni: genitori.map((g) => ({ valore: g.id, testo: g.nome })),
          alCambio: (id) => {
            scelto = genitori.find((g) => g.id === id);
            titoloPin.textContent = t.pin(scelto.nome);
            tastierino.aiuto(testi.configurazione.genitori.cifre);
          },
        })
        : null,
      crea('section', { class: 'scheda scheda-pin' }, [titoloPin, tastierino.elemento]),
    ]),
  ]);
}
