// Configurazione, passo 10: soglie degli alert (sezione 4, RN-15). Gli alert sono solo per i genitori.

import { crea } from '../componenti/dom.js';
import { contatoreNumerico } from '../componenti/moduli.js';
import { controllaAlert } from '../../regole/configurazione-gioco.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.alert;

// Per ogni alert: i campi modificabili con i loro limiti (gli stessi di controllaAlert).
const SOGLIE = {
  a2: [['percentuale', t.percentuale, 10, 90, 5, (n) => `${n}%`], ['settimane', t.settimane, 1, 8, 1, String]],
  a3: [['rifiutate', t.quanti, 1, 20, 1, String]],
  a4: [['dubbi', t.quanti, 1, 20, 1, String]],
  a5: [['punti', t.punti, 1, 50, 1, String], ['settimane', t.settimane, 2, 12, 1, String]],
  a6: [['revisioni', t.revisioni, 1, 8, 1, String]],
  a8: [['giorni', t.giorni, 1, 60, 1, String]],
};
const ORDINE = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'];

function valori(chiave, alert) {
  const v = alert[chiave];
  switch (chiave) {
    case 'a2': return t.a2Valori(v.percentuale, v.settimane);
    case 'a3': return t.a3Valori(v.rifiutate);
    case 'a4': return t.a4Valori(v.dubbi);
    case 'a5': return t.a5Valori(v.punti, v.settimane);
    case 'a6': return t.a6Valori(v.revisioni);
    case 'a8': return t.a8Valori(v.giorni);
    default: return t.sempre;
  }
}

export const passoAlert = {
  controlla: (bozza) => controllaAlert(bozza.alert),

  disegna(ctx) {
    const { alert } = ctx.bozza;
    return crea('div', { class: 'elenco-alert' }, ORDINE.map((chiave) => {
      const riassunto = crea('p', { class: 'riassunto-alert', 'aria-live': 'polite' }, valori(chiave, alert));
      const campi = (SOGLIE[chiave] ?? []).map(([campo, etichetta, min, max, passo, formato]) => contatoreNumerico({
        etichetta, valore: alert[chiave][campo], minimo: min, massimo: max, passo, formato,
        errore: ctx.errore('alert-soglia', null, (e) => e.alert === chiave && e.campo === campo),
        alCambio: (n) => {
          ctx.modifica((b) => { b.alert[chiave][campo] = n; });
          riassunto.textContent = valori(chiave, ctx.bozza.alert);
        },
      }));
      return crea('section', { class: 'scheda scheda-alert' }, [
        crea('h2', {}, [crea('span', { class: 'codice-alert' }, chiave.toUpperCase()), t[chiave]]),
        crea('p', { class: 'nota' }, t[`${chiave}Spiegazione`]),
        riassunto,
        campi.length ? crea('div', { class: 'riga-campi' }, campi) : null,
      ]);
    }));
  },
};
