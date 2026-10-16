// RNF-15: aperta in Safari, l'app non mostra configurazione né dati,
// ma invita ad aprirla dall'icona sulla schermata Home (che ha il suo archivio).

import { testi } from '../testi/it.js';
import { crea } from './componenti/dom.js';

export function schermataApriDallIcona() {
  const t = testi.apriDallIcona;
  const elenco = (passi) => crea('ol', { class: 'istruzioni' }, passi.map((p) => crea('li', {}, p)));
  return crea('main', { class: 'schermo schermo-centrato' }, [
    crea('img', { class: 'logo', src: 'risorse/icone/app-512.png', alt: '', width: 120, height: 120 }),
    crea('h1', {}, t.titolo),
    crea('p', { class: 'testo-grande' }, t.spiegazione),
    crea('div', { class: 'griglia-due istruzioni-icona' }, [
      crea('section', { class: 'scheda' }, [crea('h2', {}, t.seCeIcona), elenco(t.seCeIconaPassi)]),
      crea('section', { class: 'scheda' }, [crea('h2', {}, t.seNonCe), elenco(t.seNonCePassi)]),
    ]),
  ]);
}
