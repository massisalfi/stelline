// Tastierino per il PIN, a tutto schermo e con tasti grandi.
// È fatto dall'app invece di usare la tastiera di sistema, così l'iPad non propone
// di salvare il PIN tra le password e non compare la tastiera completa.

import { crea } from './dom.js';
import { testi } from '../../testi/it.js';

const MASSIMO = 6;
const MINIMO = 4;

// Mostra il tastierino e restituisce il PIN digitato, oppure null se si annulla.
export function chiediPin({ titolo, messaggio = '', aiuto = testi.configurazione.genitori.cifre }) {
  return new Promise((risolvi) => {
    let cifre = '';
    const puntini = crea('div', { class: 'pin-puntini', 'aria-live': 'polite' });
    const fatto = crea('button', { class: 'pulsante primario', type: 'button', disabled: true }, testi.comune.fatto);

    function aggiornaPuntini() {
      puntini.replaceChildren(...Array.from({ length: MASSIMO }, (_, i) =>
        crea('span', { class: i < cifre.length ? 'pin-puntino pieno' : 'pin-puntino' })));
      puntini.setAttribute('aria-label', `${cifre.length} cifre`);
      fatto.disabled = cifre.length < MINIMO;
    }

    function chiudi(valore) {
      document.removeEventListener('keydown', tasto);
      sfondo.remove();
      risolvi(valore);
    }

    function premi(c) {
      if (c === 'cancella') cifre = cifre.slice(0, -1);
      else if (cifre.length < MASSIMO) cifre += c;
      aggiornaPuntini();
    }

    // Anche la tastiera fisica, per chi usa l'iPad con la tastiera.
    function tasto(evento) {
      if (/^\d$/.test(evento.key)) premi(evento.key);
      else if (evento.key === 'Backspace') premi('cancella');
      else if (evento.key === 'Enter' && cifre.length >= MINIMO) chiudi(cifre);
      else if (evento.key === 'Escape') chiudi(null);
      else return;
      evento.preventDefault();
    }

    const tasti = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'vuoto', '0', 'cancella'].map((c) => {
      if (c === 'vuoto') return crea('span');
      const etichetta = c === 'cancella' ? '⌫' : c;
      return crea('button', {
        class: 'pin-tasto', type: 'button',
        'aria-label': c === 'cancella' ? 'Cancella l\'ultima cifra' : c,
        onclick: () => premi(c),
      }, etichetta);
    });

    fatto.addEventListener('click', () => chiudi(cifre));

    const finestra = crea('div', { class: 'pin-finestra', role: 'dialog', 'aria-modal': 'true', 'aria-label': titolo, tabindex: '-1' }, [
      crea('h2', {}, titolo),
      crea('p', { class: messaggio ? 'pin-messaggio errore' : 'pin-messaggio' }, messaggio || aiuto),
      puntini,
      crea('div', { class: 'pin-tasti' }, tasti),
      crea('div', { class: 'pin-azioni' }, [
        crea('button', { class: 'pulsante', type: 'button', onclick: () => chiudi(null) }, testi.comune.annulla),
        fatto,
      ]),
    ]);
    const sfondo = crea('div', { class: 'pin-sfondo' }, finestra);

    aggiornaPuntini();
    // Il campo che aveva il cursore lo perde: sull'iPad si chiude la tastiera di sistema
    // e le cifre non finiscono nel campo sotto il tastierino.
    document.activeElement?.blur?.();
    document.addEventListener('keydown', tasto);
    document.body.append(sfondo);
    finestra.focus({ preventScroll: true });
  });
}
