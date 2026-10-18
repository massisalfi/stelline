// Configurazione, passo 9: sorprese (sezione 4, RN-12). Arrivano dal mondo del gioco, mai dai genitori.

import { crea } from '../componenti/dom.js';
import { contatoreNumerico, interruttore, sezione } from '../componenti/moduli.js';
import { controllaSorprese } from '../../regole/configurazione-gioco.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.sorprese;
const CONTENUTI = ['avatar', 'storia', 'creature', 'bonus'];

export const passoSorprese = {
  controlla: (bozza) => controllaSorprese(bozza.sorprese),

  disegna(ctx) {
    const s = ctx.bozza.sorprese;
    const spiegazione = crea('p', { class: 'nota', 'aria-live': 'polite' }, t.intervalloSpiegazione(s.minimo, s.massimo));
    const aggiorna = () => { spiegazione.textContent = t.intervalloSpiegazione(ctx.bozza.sorprese.minimo, ctx.bozza.sorprese.massimo); };

    return crea('div', { class: 'griglia-due' }, [
      sezione(t.intervallo, [
        crea('div', { class: 'riga-campi' }, [
          contatoreNumerico({
            etichetta: t.minimo, valore: s.minimo, minimo: 1, massimo: 60, formato: t.giorni,
            errore: ctx.errore('sorprese-minimo'),
            alCambio: (n) => { ctx.modifica((b) => { b.sorprese.minimo = n; }); aggiorna(); },
          }),
          contatoreNumerico({
            etichetta: t.massimo, valore: s.massimo, minimo: 2, massimo: 90, formato: t.giorni,
            errore: ctx.errore('sorprese-massimo'),
            alCambio: (n) => { ctx.modifica((b) => { b.sorprese.massimo = n; }); aggiorna(); },
          }),
        ]),
        spiegazione,
      ]),
      sezione(t.contenuti, [
        ...CONTENUTI.map((chiave) => interruttore({
          etichetta: t.contenutiOpzioni[chiave],
          attivo: s.contenuti[chiave],
          alCambio: (v) => ctx.modifica((b) => { b.sorprese.contenuti[chiave] = v; }, { ridisegna: chiave === 'bonus' }),
        })),
        ctx.errore('sorprese-contenuti') ? crea('p', { class: 'campo-errore' }, ctx.errore('sorprese-contenuti')) : null,
        s.contenuti.bonus
          ? contatoreNumerico({
            etichetta: t.quanteBonus, valore: s.stellineBonus, minimo: 1, massimo: 10,
            errore: ctx.errore('sorprese-bonus'),
            alCambio: (n) => ctx.modifica((b) => { b.sorprese.stellineBonus = n; }),
          })
          : null,
        s.contenuti.bonus ? crea('p', { class: 'nota' }, t.bonusSpiegazione) : null,
      ]),
    ]);
  },
};
