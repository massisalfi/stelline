// Schermata mostrata al primo avvio, prima e durante la configurazione iniziale.

import { testi } from '../testi/it.js';
import { crea } from './componenti/dom.js';
import { pulsante } from './componenti/moduli.js';

export function schermataBenvenuto({ bozza, alInizio }) {
  const t = testi.benvenuto;
  const testo = bozza ? t.riprendi(bozza.passo) : t.inizia;
  return crea('main', { class: 'schermo schermo-centrato' }, [
    crea('img', { class: 'logo', src: 'risorse/icone/app-512.png', alt: '', width: 160, height: 160 }),
    crea('h1', {}, t.titolo),
    crea('p', { class: 'testo-grande' }, t.descrizione),
    pulsante(testo, alInizio, { classe: 'primario grande' }),
  ]);
}
