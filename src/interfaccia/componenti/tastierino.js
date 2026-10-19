// Tastierino per il PIN, con tasti grandi.
// È fatto dall'app invece di usare la tastiera di sistema, così l'iPad non propone
// di salvare il PIN tra le password e non compare la tastiera completa.

import { crea } from './dom.js';
import { testi } from '../../testi/it.js';

const MASSIMO = 6;
const MINIMO = 4;

// Tastierino da inserire in una schermata. alFatto(pin) riceve il PIN completo;
// alAnnulla, se c'è, mostra il pulsante Annulla.
export function creaTastierino({ aiuto = testi.configurazione.genitori.cifre, messaggio = '', alFatto, alAnnulla }) {
  let cifre = '';
  const avviso = crea('p', { class: 'pin-messaggio', 'aria-live': 'polite' });
  const puntini = crea('div', { class: 'pin-puntini' });
  const fatto = crea('button', { class: 'pulsante primario', type: 'button', disabled: true }, testi.comune.fatto);

  const mostraAvviso = (testo, errore) => {
    avviso.textContent = testo;
    avviso.classList.toggle('errore', Boolean(errore));
  };

  function aggiornaPuntini() {
    puntini.replaceChildren(...Array.from({ length: MASSIMO }, (_, i) =>
      crea('span', { class: i < cifre.length ? 'pin-puntino pieno' : 'pin-puntino' })));
    puntini.setAttribute('aria-label', `${cifre.length} cifre`);
    fatto.disabled = cifre.length < MINIMO;
  }

  function conferma() {
    if (cifre.length < MINIMO) return;
    const pin = cifre;
    cifre = '';
    aggiornaPuntini();
    alFatto(pin);
  }

  function premi(c) {
    if (c === 'cancella') cifre = cifre.slice(0, -1);
    else if (cifre.length < MASSIMO) cifre += c;
    aggiornaPuntini();
  }

  // Anche la tastiera fisica, per chi usa l'iPad con la tastiera. L'ascolto si toglie
  // da solo quando il tastierino non è più sullo schermo.
  function tasto(evento) {
    if (!elemento.isConnected) {
      document.removeEventListener('keydown', tasto);
      return;
    }
    if (/^\d$/.test(evento.key)) premi(evento.key);
    else if (evento.key === 'Backspace') premi('cancella');
    else if (evento.key === 'Enter') conferma();
    else if (evento.key === 'Escape' && alAnnulla) alAnnulla();
    else return;
    evento.preventDefault();
  }

  const tasti = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'vuoto', '0', 'cancella'].map((c) => {
    if (c === 'vuoto') return crea('span');
    return crea('button', {
      class: 'pin-tasto', type: 'button',
      'aria-label': c === 'cancella' ? 'Cancella l\'ultima cifra' : c,
      onclick: () => premi(c),
    }, c === 'cancella' ? '⌫' : c);
  });
  fatto.addEventListener('click', conferma);

  const elemento = crea('div', { class: 'pin-tastierino' }, [
    avviso,
    puntini,
    crea('div', { class: 'pin-tasti' }, tasti),
    crea('div', { class: 'pin-azioni' }, [
      alAnnulla ? crea('button', { class: 'pulsante', type: 'button', onclick: alAnnulla }, testi.comune.annulla) : null,
      fatto,
    ]),
  ]);

  mostraAvviso(messaggio || aiuto, Boolean(messaggio));
  aggiornaPuntini();
  document.activeElement?.blur?.();
  document.addEventListener('keydown', tasto);

  return {
    elemento,
    errore: (testo) => mostraAvviso(testo, true),
    aiuto: (testo) => mostraAvviso(testo, false),
  };
}

// Mostra il tastierino in una finestra sopra la pagina e restituisce il PIN, oppure null se si annulla.
export function chiediPin({ titolo, messaggio = '', aiuto = testi.configurazione.genitori.cifre }) {
  return new Promise((risolvi) => {
    const chiudi = (valore) => {
      sfondo.remove();
      risolvi(valore);
    };
    const tastierino = creaTastierino({ aiuto, messaggio, alFatto: (pin) => chiudi(pin), alAnnulla: () => chiudi(null) });
    const finestra = crea('div', { class: 'pin-finestra', role: 'dialog', 'aria-modal': 'true', 'aria-label': titolo, tabindex: '-1' }, [
      crea('h2', {}, titolo),
      tastierino.elemento,
    ]);
    const sfondo = crea('div', { class: 'pin-sfondo' }, finestra);
    document.body.append(sfondo);
    finestra.focus({ preventScroll: true });
  });
}
