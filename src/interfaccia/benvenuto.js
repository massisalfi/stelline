// Schermata mostrata al primo avvio, prima della configurazione iniziale.

import { testi } from '../testi/it.js';
import { crea } from './componenti/dom.js';

export function schermataBenvenuto() {
  const t = testi.benvenuto;
  return crea('main', { class: 'schermo schermo-centrato' }, [
    crea('img', { class: 'logo', src: 'risorse/icone/app-512.png', alt: '', width: 160, height: 160 }),
    crea('h1', {}, t.titolo),
    crea('p', { class: 'testo-grande' }, t.descrizione),
    crea('p', { class: 'nota' }, t.inCostruzione),
  ]);
}
