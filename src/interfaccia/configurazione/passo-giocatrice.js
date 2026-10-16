// Configurazione, passo 2: nome ed età della giocatrice, voce narrante, suoni e volume (sezione 4).

import { crea } from '../componenti/dom.js';
import { campoTesto, interruttore, cursore, pulsante, sezione } from '../componenti/moduli.js';
import { controllaGiocatrice } from '../../regole/configurazione.js';
import { parla, attendiVoci, voceItaliana, disponibile } from '../../voce/voce.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.giocatrice;

export const passoGiocatrice = {
  controlla: controllaGiocatrice,

  disegna(ctx) {
    const g = ctx.bozza.giocatrice;
    const avvisoVoce = crea('p', { class: 'nota', hidden: true }, t.nessunaVoce);

    const eta = crea('output', { class: 'eta-valore', 'aria-live': 'polite' }, t.anni(g.eta));
    const cambiaEta = (delta) => {
      const nuova = Math.min(12, Math.max(3, g.eta + delta));
      ctx.modifica((b) => { b.giocatrice.eta = nuova; });
      eta.textContent = t.anni(nuova);
    };

    return crea('div', { class: 'griglia-due' }, [
      sezione(t.nome, [
        campoTesto({
          etichetta: t.nome,
          valore: g.nome,
          errore: ctx.errore('nome-giocatrice-mancante'),
          alCambio: (valore) => ctx.modifica((b) => { b.giocatrice.nome = valore; }),
        }),
        crea('div', { class: ctx.errore('eta-non-valida') ? 'campo con-errore' : 'campo' }, [
          crea('span', { class: 'etichetta' }, t.eta),
          crea('div', { class: 'contatore' }, [
            pulsante('−', () => cambiaEta(-1), { etichetta: 'Un anno in meno' }),
            eta,
            pulsante('+', () => cambiaEta(1), { etichetta: 'Un anno in più' }),
          ]),
        ]),
      ]),
      sezione(t.voce, [
        interruttore({
          etichetta: t.voce,
          attivo: g.voce.attiva,
          alCambio: (attiva) => ctx.modifica((b) => { b.giocatrice.voce.attiva = attiva; }),
        }),
        cursore({
          etichetta: t.velocita, valore: g.voce.velocita, minimo: 0.6, massimo: 1.4, passo: 0.1,
          sinistra: t.piuLenta, destra: t.piuVeloce,
          alCambio: (v) => ctx.modifica((b) => { b.giocatrice.voce.velocita = v; }),
        }),
        pulsante(t.ascolta, async () => {
          await attendiVoci();
          avvisoVoce.hidden = Boolean(voceItaliana()) || !disponibile();
          parla(t.provaVoce(ctx.bozza.giocatrice.nome.trim()), {
            velocita: ctx.bozza.giocatrice.voce.velocita,
            volume: ctx.bozza.giocatrice.suoni.volume,
          });
        }),
        avvisoVoce,
        interruttore({
          etichetta: t.suoni,
          attivo: g.suoni.attivi,
          alCambio: (attivi) => ctx.modifica((b) => { b.giocatrice.suoni.attivi = attivi; }),
        }),
        cursore({
          etichetta: t.volume, valore: g.suoni.volume, minimo: 0, massimo: 100, passo: 10,
          alCambio: (v) => ctx.modifica((b) => { b.giocatrice.suoni.volume = v; }),
        }),
      ]),
    ]);
  },
};
