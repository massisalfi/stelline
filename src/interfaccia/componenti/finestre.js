// Finestre sopra la pagina: la scheda a tutto schermo (per modificare un elemento)
// e la richiesta di conferma (per le scelte da non fare per sbaglio).

import { crea } from './dom.js';

// Scheda a tutto schermo con titolo, contenuto scorrevole e pulsanti in basso.
// Restituisce { corpo, chiudi }: il corpo si può ridisegnare dall'esterno.
export function apriScheda({ titolo, azioni = [] }) {
  document.activeElement?.blur?.();
  const corpo = crea('div', { class: 'scheda-corpo' });
  const finestra = crea('div', { class: 'scheda-finestra', role: 'dialog', 'aria-modal': 'true', 'aria-label': titolo, tabindex: '-1' }, [
    crea('header', { class: 'scheda-testata' }, crea('h2', {}, titolo)),
    corpo,
    crea('footer', { class: 'scheda-azioni' }, azioni),
  ]);
  const sfondo = crea('div', { class: 'scheda-sfondo' }, finestra);
  document.body.append(sfondo);
  document.body.classList.add('bloccato');
  finestra.focus({ preventScroll: true });
  return {
    corpo,
    chiudi() {
      sfondo.remove();
      document.body.classList.remove('bloccato');
    },
  };
}

// Domanda con due risposte. Restituisce true per la risposta "sì".
export function chiediConferma({ domanda, spiegazione, si, no }) {
  return new Promise((risolvi) => {
    document.activeElement?.blur?.();
    const chiudi = (risposta) => { sfondo.remove(); risolvi(risposta); };
    const finestra = crea('div', { class: 'conferma-finestra', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': domanda, tabindex: '-1' }, [
      crea('h2', {}, domanda),
      spiegazione ? crea('p', {}, spiegazione) : null,
      crea('div', { class: 'conferma-azioni' }, [
        crea('button', { type: 'button', class: 'pulsante', onclick: () => chiudi(false) }, no),
        crea('button', { type: 'button', class: 'pulsante primario', onclick: () => chiudi(true) }, si),
      ]),
    ]);
    const sfondo = crea('div', { class: 'pin-sfondo' }, finestra);
    document.body.append(sfondo);
    finestra.focus({ preventScroll: true });
  });
}
