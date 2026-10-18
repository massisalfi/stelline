// Configurazione, passo 7: listino premi (sezione 4). Il blocco di schermo viene dal passo 6;
// i premi di livello formano una sequenza ordinata.

import { crea } from '../componenti/dom.js';
import { pulsante, sezione } from '../componenti/moduli.js';
import { apriSchedaPremio } from './scheda-premio.js';
import {
  controllaPremi, controllaPremio, nuovoPremio, nuovoIdPremio, sequenzaLivelli, spostaInSequenza,
} from '../../regole/configurazione-gioco.js';
import { importaListino } from '../../modello-esempio.js';
import { percorsoIconaPremio } from '../../risorse/icone-premi.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.listino;
let messaggio = '';

function riassunto(premio, categorie) {
  const parti = [t.famiglie[premio.famiglia], t.riassuntoModalita[premio.modalita](premio.modalita === 'raro' ? premio.ogniStagioni : premio.costo)];
  if (premio.categoria) {
    const categoria = categorie.find((c) => c.id === premio.categoria)?.nome ?? '';
    parti.push(`${premio.minuti} min di ${categoria.toLowerCase()}`);
  }
  if (premio.euro != null) parti.push(`${String(premio.euro).replace('.', ',')} €`);
  return parti.join(' · ');
}

export const passoListino = {
  controlla: (bozza) => controllaPremi(bozza.premi, bozza.economia.categorie),

  disegna(ctx) {
    const { bozza } = ctx;
    const categorie = bozza.economia.categorie;

    const apri = (premio) => {
      const nuovo = !premio;
      apriSchedaPremio({
        premio: premio ?? nuovoPremio(nuovoIdPremio(bozza.premi)),
        categorie,
        nuovo,
        alSalvataggio: (salvato) => ctx.modifica((b) => {
          const i = b.premi.findIndex((p) => p.id === salvato.id);
          if (i >= 0) b.premi[i] = salvato;
          else b.premi.push(salvato);
        }, { ridisegna: true }),
        alEliminazione: () => ctx.modifica((b) => { b.premi = b.premi.filter((p) => p.id !== premio.id); }, { ridisegna: true }),
      });
    };

    const schedaPremio = (premio, extra = []) => {
      const indice = bozza.premi.indexOf(premio);
      const completo = controllaPremio(premio, categorie).length === 0;
      const segnalato = ctx.errore('premio-incompleto', indice);
      return crea('div', { class: 'riga-premio' }, [
        crea('button', {
          type: 'button',
          class: `scheda-ca${completo ? '' : ' incompleta'}${segnalato ? ' con-errore' : ''}`,
          onclick: () => apri(premio),
        }, [
          premio.icona ? crea('img', { src: percorsoIconaPremio(premio.icona), alt: '', width: 56, height: 56 }) : crea('span', { class: 'icona-vuota' }),
          crea('span', { class: 'scheda-ca-testo' }, [
            crea('strong', {}, premio.nome || t.titoloNuovo),
            crea('span', { class: 'nota' }, riassunto(premio, categorie)),
            completo ? null : crea('span', { class: 'campo-errore' }, t.daCompletare),
          ]),
          crea('span', { class: 'freccia', 'aria-hidden': 'true' }, '›'),
        ]),
        ...extra,
      ]);
    };

    const livelli = sequenzaLivelli(bozza.premi);
    const altri = bozza.premi.filter((p) => p.modalita !== 'livello');
    const blocco = bozza.economia.conversione;
    const categoriaBlocco = categorie.find((c) => c.id === blocco.categoria)?.nome ?? '';

    const avviso = crea('p', { class: 'nota', 'aria-live': 'polite' }, messaggio);
    messaggio = '';

    return crea('div', { class: 'colonna' }, [
      sezione(t.sequenza, livelli.length
        ? livelli.map((premio, n) => schedaPremio(premio, [
          crea('span', { class: 'numero-livello' }, t.livelloN(n)),
          crea('span', { class: 'frecce' }, [
            pulsante('↑', () => ctx.modifica((b) => { b.premi = spostaInSequenza(b.premi, premio.id, -1); }, { ridisegna: true }),
              { etichetta: t.su, disattivo: n === 0 }),
            pulsante('↓', () => ctx.modifica((b) => { b.premi = spostaInSequenza(b.premi, premio.id, 1); }, { ridisegna: true }),
              { etichetta: t.giu, disattivo: n === livelli.length - 1 }),
          ]),
        ]))
        : [crea('p', { class: 'nota' }, t.vuoto)], t.sequenzaSpiegazione),
      sezione(t.altri, [
        crea('div', { class: 'riga-premio fissa' }, [
          crea('div', { class: 'scheda-ca fissa' }, [
            crea('img', { src: percorsoIconaPremio('televisore'), alt: '', width: 56, height: 56 }),
            crea('span', { class: 'scheda-ca-testo' }, [
              crea('strong', {}, testi.configurazione.economia.riassuntoBlocco(blocco.stelline, blocco.minuti, categoriaBlocco)),
              crea('span', { class: 'nota' }, t.bloccoFisso),
            ]),
          ]),
        ]),
        ...altri.map((premio) => schedaPremio(premio)),
      ]),
      crea('div', { class: 'riga-pulsanti' }, [
        pulsante(`+ ${t.aggiungi}`, () => apri(null), { classe: 'primario' }),
        pulsante(t.importa, () => ctx.modifica((b) => {
          const prima = b.premi.length;
          importaListino(b);
          messaggio = t.importato(b.premi.length - prima);
        }, { ridisegna: true })),
      ]),
      avviso,
    ]);
  },
};
