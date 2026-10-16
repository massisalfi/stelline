// Configurazione, passo 2: nome ed età della giocatrice, voce narrante, suoni e volume (sezione 4).

import { crea } from '../componenti/dom.js';
import { campoTesto, interruttore, cursore, selettore, pulsante, sezione } from '../componenti/moduli.js';
import { controllaGiocatrice } from '../../regole/configurazione.js';
import {
  parla, attendiVoci, vociItaliane, voceDaUsare, qualitaVoce, disponibile,
} from '../../voce/voce.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.giocatrice;

// Menu delle voci italiane del dispositivo, aggiornato quando l'iPad finisce di elencarle.
function menuVoci(ctx) {
  const contenitore = crea('div', { class: 'colonna-stretta' });
  const disegna = () => {
    const voci = vociItaliane();
    if (!voci.length) {
      contenitore.replaceChildren(crea('p', { class: 'nota' }, disponibile() ? t.nessunaVoce : t.voceNonDisponibile));
      return;
    }
    const scelta = voceDaUsare(ctx.bozza.giocatrice.voce.id);
    contenitore.replaceChildren(selettore({
      etichetta: t.qualeVoce,
      valore: scelta?.voiceURI,
      opzioni: voci.map((v) => ({ valore: v.voiceURI, testo: t.nomeVoce(v.name, qualitaVoce(v)) })),
      alCambio: (id) => ctx.modifica((b) => { b.giocatrice.voce.id = id; }),
    }));
  };
  disegna();
  attendiVoci().then(disegna);
  if (disponibile()) {
    const aggiorna = () => {
      if (!contenitore.isConnected) window.speechSynthesis.removeEventListener('voiceschanged', aggiorna);
      else disegna();
    };
    window.speechSynthesis.addEventListener('voiceschanged', aggiorna);
  }
  return contenitore;
}

export const passoGiocatrice = {
  controlla: controllaGiocatrice,

  disegna(ctx) {
    const g = ctx.bozza.giocatrice;

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
        menuVoci(ctx),
        cursore({
          etichetta: t.velocita, valore: g.voce.velocita, minimo: 0.6, massimo: 1.4, passo: 0.1,
          sinistra: t.piuLenta, destra: t.piuVeloce,
          alCambio: (v) => ctx.modifica((b) => { b.giocatrice.voce.velocita = v; }),
        }),
        cursore({
          etichetta: t.tono, valore: g.voce.tono ?? 1, minimo: 0.6, massimo: 1.8, passo: 0.1,
          sinistra: t.piuGrave, destra: t.piuAcuto,
          alCambio: (v) => ctx.modifica((b) => { b.giocatrice.voce.tono = v; }),
        }),
        pulsante(t.ascolta, async () => {
          await attendiVoci();
          const v = ctx.bozza.giocatrice;
          parla(t.provaVoce(v.nome.trim()), {
            velocita: v.voce.velocita,
            tono: v.voce.tono ?? 1,
            volume: v.suoni.volume,
            voce: v.voce.id,
          });
        }, { classe: 'primario' }),
        crea('details', { class: 'consiglio' }, [
          crea('summary', {}, t.vociMiglioriTitolo),
          crea('ol', { class: 'istruzioni' }, t.vociMiglioriPassi.map((p) => crea('li', {}, p))),
        ]),
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
