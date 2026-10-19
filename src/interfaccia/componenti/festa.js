// Festa della stellina (RF-G04): animazione a tutto schermo e suono, subito dopo la conferma.
// Una stellina grande per ogni stellina guadagnata, con le scintille; per la bambina non c'è nulla da leggere.
// Si chiude da sola dopo pochi secondi, oppure con un tocco.

import { crea } from './dom.js';
import { disegnoStella } from './stella.js';
import { suonaStelline, PASSO_STELLINE_MS } from './suoni.js';

const MASSIMO_VISIBILI = 5;
const SCINTILLE = 8;
const DURATA_MS = 2400;
const USCITA_MS = 300;

function stellaConScintille(indice) {
  const scintille = Array.from({ length: SCINTILLE }, (_, i) => {
    const scintilla = disegnoStella('scintilla');
    scintilla.style.setProperty('--angolo', `${(360 / SCINTILLE) * i + (indice % 2) * 22}deg`);
    return scintilla;
  });
  const stella = crea('div', { class: 'festa-stella' }, [...scintille, disegnoStella()]);
  stella.style.setProperty('--ritardo', `${indice * PASSO_STELLINE_MS}ms`);
  return stella;
}

// stelline: quante ne ha guadagnate; suoni: { attivi, volume }; etichetta: riga facoltativa per il genitore.
// Restituisce una promessa che si risolve quando la festa è finita.
export function festeggia({ stelline, suoni, etichetta }) {
  return new Promise((risolvi) => {
    const quante = Math.max(1, Math.min(stelline, MASSIMO_VISIBILI));
    const sfondo = crea('div', { class: 'festa', role: 'status', 'aria-label': etichetta ?? '★'.repeat(stelline) }, [
      crea('div', { class: 'festa-stelline' }, Array.from({ length: quante }, (_, i) => stellaConScintille(i))),
      etichetta ? crea('p', { class: 'festa-etichetta' }, etichetta) : null,
    ]);
    let chiusa = false;
    const chiudi = () => {
      if (chiusa) return;
      chiusa = true;
      clearTimeout(attesa);
      sfondo.classList.add('esce');
      setTimeout(() => { sfondo.remove(); risolvi(); }, USCITA_MS);
    };
    const attesa = setTimeout(chiudi, DURATA_MS + (quante - 1) * PASSO_STELLINE_MS);
    sfondo.addEventListener('click', chiudi);
    document.body.append(sfondo);
    suonaStelline(quante, suoni);
  });
}
