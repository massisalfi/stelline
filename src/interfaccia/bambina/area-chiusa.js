// Area della bambina "chiusa" (settimana 0): il gioco è nascosto e non c'è nulla da fare.
// Nell'angolo in alto a destra un pulsante discreto apre l'area genitori, ma solo con una
// pressione prolungata (RF-G01): un tocco normale non fa nulla.

import { crea } from '../componenti/dom.js';
import { testi } from '../../testi/it.js';
import { PRESSIONE_PROLUNGATA_MS } from '../../regole/sessione.js';

function pulsanteDiscreto(alPressioneProlungata) {
  let attesa = null;
  const pulsante = crea('button', {
    type: 'button',
    class: 'accesso-discreto',
    'aria-label': testi.areaChiusa.accesso,
  }, crea('span', { class: 'accesso-anello', 'aria-hidden': 'true' }));
  pulsante.style.setProperty('--durata', `${PRESSIONE_PROLUNGATA_MS}ms`);

  const ferma = () => {
    clearTimeout(attesa);
    attesa = null;
    pulsante.classList.remove('premuto');
  };
  pulsante.addEventListener('pointerdown', (evento) => {
    evento.preventDefault();
    pulsante.classList.add('premuto');
    attesa = setTimeout(() => {
      ferma();
      alPressioneProlungata();
    }, PRESSIONE_PROLUNGATA_MS);
  });
  for (const nome of ['pointerup', 'pointerleave', 'pointercancel']) pulsante.addEventListener(nome, ferma);
  // Un menu contestuale (pressione lunga di sistema) non deve comparire.
  pulsante.addEventListener('contextmenu', (evento) => evento.preventDefault());
  return pulsante;
}

export function schermataAreaChiusa({ alAccesso }) {
  return crea('main', { class: 'schermo schermo-centrato area-chiusa' }, [
    pulsanteDiscreto(alAccesso),
    crea('img', { class: 'logo grande', src: 'risorse/icone/app-512.png', alt: '', width: 200, height: 200 }),
    crea('h1', {}, testi.app.nome),
  ]);
}
