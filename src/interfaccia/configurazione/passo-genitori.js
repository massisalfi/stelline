// Configurazione, passo 1: nome e PIN di ciascun genitore (sezione 4).

import { crea } from '../componenti/dom.js';
import { campoTesto, pulsante } from '../componenti/moduli.js';
import { chiediPin } from '../componenti/tastierino.js';
import { creaImpronta, verificaPin } from '../../sicurezza/pin.js';
import { controllaGenitori } from '../../regole/configurazione.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.genitori;

// Chiede il PIN due volte; se non coincide o è uguale a quello dell'altro genitore, riparte.
async function nuovoPin(nome, pinAltro) {
  let messaggio = '';
  for (;;) {
    const primo = await chiediPin({ titolo: t.scegli(nome), messaggio });
    if (primo == null) return null;
    const secondo = await chiediPin({ titolo: t.ripeti });
    if (secondo == null) return null;
    if (primo !== secondo) {
      messaggio = t.nonCoincide;
      continue;
    }
    if (pinAltro && await verificaPin(primo, pinAltro)) {
      messaggio = t.ugualeAllAltro;
      continue;
    }
    return creaImpronta(primo);
  }
}

export const passoGenitori = {
  controlla: controllaGenitori,

  disegna(ctx) {
    const schede = ctx.bozza.genitori.map((genitore, indice) => {
      const altro = ctx.bozza.genitori[1 - indice];
      const impostato = Boolean(genitore.pin?.impronta);
      return crea('div', { class: 'scheda genitore' }, [
        crea('h2', {}, t.genitore(indice + 1)),
        campoTesto({
          etichetta: t.nome,
          valore: genitore.nome,
          errore: ctx.errore('nome-genitore-mancante', indice),
          alCambio: (valore) => ctx.modifica((b) => { b.genitori[indice].nome = valore; }),
        }),
        crea('div', { class: ctx.errore('pin-mancante', indice) ? 'campo con-errore' : 'campo' }, [
          crea('span', { class: 'etichetta' }, t.pin),
          crea('div', { class: 'riga-pin' }, [
            crea('span', { class: impostato ? 'stato-pin fatto' : 'stato-pin' }, impostato ? `✓ ${t.pinImpostato}` : '—'),
            pulsante(impostato ? t.cambia : t.imposta, async () => {
              const pin = await nuovoPin(genitore.nome, altro.pin);
              if (pin) ctx.modifica((b) => { b.genitori[indice].pin = pin; }, { ridisegna: true });
            }, { classe: impostato ? '' : 'primario' }),
          ]),
          ctx.errore('pin-mancante', indice)
            ? crea('p', { class: 'campo-errore', role: 'alert' }, ctx.errore('pin-mancante', indice))
            : null,
        ]),
      ]);
    });

    return crea('div', {}, [
      crea('div', { class: 'griglia-due' }, schede),
      ctx.errore('nomi-genitori-uguali')
        ? crea('p', { class: 'campo-errore', role: 'alert' }, ctx.errore('nomi-genitori-uguali'))
        : null,
    ]);
  },
};
