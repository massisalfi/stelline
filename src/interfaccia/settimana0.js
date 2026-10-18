// Schermata della settimana 0, finché non arrivano l'area della bambina "chiusa" e la registrazione
// (passi 12 e 13). Non mostra nulla del gioco.

import { testi } from '../testi/it.js';
import { crea } from './componenti/dom.js';

function dataLeggibile(giorno) {
  const [a, m, g] = giorno.split('-').map(Number);
  return new Date(a, m - 1, g).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function schermataSettimana0({ inizio }) {
  const t = testi.settimana0;
  return crea('main', { class: 'schermo schermo-centrato' }, [
    crea('img', { class: 'logo', src: 'risorse/icone/app-512.png', alt: '', width: 140, height: 140 }),
    crea('h1', {}, t.titolo),
    inizio ? crea('p', { class: 'testo-grande' }, t.iniziata(dataLeggibile(inizio))) : null,
    crea('p', { class: 'testo-grande' }, t.spiegazione),
    crea('p', { class: 'nota' }, t.prossimo),
  ]);
}
