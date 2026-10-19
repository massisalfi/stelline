// Area genitori, primo nucleo (passo 12): chi è entrato, la settimana 0, i comportamenti di oggi
// in sola lettura. La registrazione arriva con il passo 13.

import { crea } from '../componenti/dom.js';
import { pulsante, sezione } from '../componenti/moduli.js';
import { comportamentiDelGiorno } from '../../regole/giorno.js';
import { percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { testi } from '../../testi/it.js';

const t = testi.areaGenitori;
const tc = testi.configurazione.comportamenti;

export function dataLeggibile(giorno) {
  const [a, m, g] = giorno.split('-').map(Number);
  return new Date(a, m - 1, g).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function schermataAreaGenitori({ genitore, configurazione, oggi, inizio, pause = [], alUscita }) {
  const elenco = configurazione
    ? comportamentiDelGiorno(configurazione.comportamenti, oggi, configurazione.calendario, pause)
    : [];
  const righe = elenco.map(({ comportamento: ca, stato }) => crea('li', { class: 'riga-oggi' }, [
    crea('img', { src: percorsoIcona(ca.icona ?? 'giochi'), alt: '', width: 40, height: 40 }),
    crea('span', { class: 'riga-oggi-testo' }, [
      crea('strong', {}, ca.nome),
      crea('span', { class: 'nota' }, `${tc.momenti[ca.momento]} · ${t.stati[stato]}`),
    ]),
  ]));

  return crea('main', { class: 'schermo area-genitori' }, [
    crea('header', { class: 'testata-genitori' }, [
      crea('div', {}, [
        crea('p', { class: 'sopratitolo' }, t.titolo),
        crea('h1', {}, t.ciao(genitore.nome)),
      ]),
      pulsante(t.esci, alUscita),
    ]),
    configurazione
      ? crea('div', { class: 'colonna' }, [
        sezione(t.settimana0, [
          inizio ? crea('p', {}, t.iniziata(dataLeggibile(inizio))) : null,
          crea('p', { class: 'nota' }, t.spiegazione),
        ]),
        sezione(t.oggi(dataLeggibile(oggi)), [
          righe.length ? crea('ul', { class: 'elenco-oggi' }, righe) : crea('p', { class: 'nota' }, t.nessuno),
          crea('p', { class: 'nota' }, t.prossimo),
        ]),
      ])
      : crea('p', { class: 'avviso-errori' }, t.nonTrovata),
    crea('p', { class: 'nota sicurezza' }, t.sicurezza),
  ]);
}
