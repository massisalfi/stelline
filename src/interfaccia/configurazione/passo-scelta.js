// Configurazione, passo 5: scelta della bambina (sezione 4). Il 30% dei CA attivi è "a scelta" (RN-14);
// il catalogo deve offrirne almeno due in più. Qui si bilancia; il blocco vero è nel riepilogo.

import { crea } from '../componenti/dom.js';
import { sceltaPulsanti, sezione } from '../componenti/moduli.js';
import { verificaProporzione, verificaCatalogo } from '../../regole/proporzione.js';
import { statoDaTipo } from '../../regole/configurazione.js';
import { percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.scelta;
const tc = testi.configurazione.comportamenti;

export const passoScelta = {
  disegna(ctx) {
    const { bozza } = ctx;
    const p = verificaProporzione(bozza.comportamenti);
    const cat = verificaCatalogo(bozza.comportamenti);

    let stato;
    if (p.ok) stato = crea('p', { class: 'esito ok' }, `✓ ${t.ok(p.aScelta)}`);
    else if (p.aScelta > p.richiesti) stato = crea('p', { class: 'esito ko' }, t.troppi(p.aScelta, p.richiesti));
    else stato = crea('p', { class: 'esito ko' }, t.pochi(p.aScelta, p.richiesti));

    return crea('div', { class: 'colonna' }, [
      crea('div', { class: 'griglia-due' }, [
        sezione(t.conteggio(p.attivi, p.richiesti), [stato]),
        sezione(t.catalogo(cat.disponibili, cat.richiesti), [
          crea('p', { class: cat.ok ? 'esito ok' : 'esito avviso' }, cat.ok ? `✓ ${t.catalogoOk}` : t.catalogoPochi),
        ]),
      ]),
      sezione(t.elenco, bozza.comportamenti.map((ca, indice) => crea('div', { class: 'riga-scelta' }, [
        crea('img', { src: percorsoIcona(ca.icona ?? 'giochi'), alt: '', width: 44, height: 44 }),
        sceltaPulsanti({
          etichetta: ca.nome,
          valore: ca.tipo,
          opzioni: ['fisso', 'scelta', 'catalogo'].map((v) => ({ valore: v, testo: tc.tipi[v] })),
          alCambio: (v) => ctx.modifica((b) => {
            b.comportamenti[indice].tipo = v;
            b.comportamenti[indice].stato = statoDaTipo(v);
          }, { ridisegna: true }),
        }),
      ]))),
    ]);
  },
};
