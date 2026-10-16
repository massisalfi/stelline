// Configurazione, passo 4: elenco dei comportamenti attesi (sezione 4). Si parte vuoti (CT-01).

import { crea } from '../componenti/dom.js';
import { pulsante } from '../componenti/moduli.js';
import { chiediConferma } from '../componenti/finestre.js';
import { apriSchedaComportamento } from './scheda-comportamento.js';
import {
  controllaComportamenti, controllaComportamento, nuovoComportamento, nuovoIdComportamento, allineaAiTipi,
} from '../../regole/configurazione.js';
import { importaModello } from '../../modello-esempio.js';
import { percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.comportamenti;

// Messaggio da mostrare una volta sola dopo l'importazione del modello.
let messaggio = '';

function voceDellaBozza(bozza) {
  const v = bozza.giocatrice.voce;
  return { velocita: v.velocita, tono: v.tono ?? 1, voce: v.id, volume: bozza.giocatrice.suoni.volume };
}

// Riassunto dei giorni: "Scuola ★ · Weekend automatica".
function riassuntoGiorni(ca, tipiGiorno) {
  const domani = (ca.automaticaSeDomaniNon ?? [])
    .map((id) => tipiGiorno.find((tipo) => tipo.id === id)?.nome)
    .filter(Boolean);
  const giorni = tipiGiorno
    .map((tipo) => {
      const r = ca.perTipo[tipo.id];
      if (r?.automatica) return `${tipo.nome} ${t.automatica}`;
      if (r?.previsto) return `${tipo.nome} ${'★'.repeat(r.stelline)}`;
      return null;
    })
    .filter(Boolean)
    .join(' · ');
  return domani.length ? `${giorni} (${t.automaticaSeDomaniNon(domani)})` : giorni;
}

export const passoComportamenti = {
  controlla: controllaComportamenti,

  disegna(ctx) {
    const { bozza } = ctx;
    // I tipi di giorno possono essere cambiati al passo 3: i comportamenti si adeguano.
    bozza.comportamenti = bozza.comportamenti.map((c) => allineaAiTipi(c, bozza.tipiGiorno));

    const avviso = crea('p', { class: 'nota', 'aria-live': 'polite' }, messaggio);
    messaggio = '';

    const apri = (indice) => {
      const nuovo = indice == null;
      apriSchedaComportamento({
        comportamento: nuovo ? nuovoComportamento(bozza.tipiGiorno, nuovoIdComportamento(bozza)) : bozza.comportamenti[indice],
        tipiGiorno: bozza.tipiGiorno,
        voce: voceDellaBozza(bozza),
        nuovo,
        alSalvataggio: (ca) => ctx.modifica((b) => {
          if (nuovo) b.comportamenti.push(ca);
          else b.comportamenti[indice] = ca;
        }, { ridisegna: true }),
        alEliminazione: () => ctx.modifica((b) => { b.comportamenti.splice(indice, 1); }, { ridisegna: true }),
      });
    };

    // VD-10: prima di creare un comportamento si chiede se la bambina lo fa già volentieri.
    const aggiungi = async () => {
      const volentieri = await chiediConferma({
        domanda: t.volentieriDomanda, spiegazione: t.volentieriSpiegazione, si: t.volentieriSi, no: t.volentieriNo,
      });
      if (volentieri) {
        const comunque = await chiediConferma({
          domanda: t.volentieriDomanda, spiegazione: t.volentieriAlbum,
          si: t.volentieriComunque, no: t.volentieriNonAggiungo,
        });
        if (!comunque) return;
      }
      apri(null);
    };

    const schede = bozza.comportamenti.map((ca, indice) => {
      const completo = controllaComportamento(ca, bozza.tipiGiorno).length === 0;
      const segnalato = ctx.errore('ca-incompleto', indice);
      return crea('button', {
        type: 'button',
        class: `scheda-ca${completo ? '' : ' incompleta'}${segnalato ? ' con-errore' : ''}`,
        onclick: () => apri(indice),
      }, [
        ca.icona ? crea('img', { src: percorsoIcona(ca.icona), alt: '', width: 56, height: 56 }) : crea('span', { class: 'icona-vuota' }),
        crea('span', { class: 'scheda-ca-testo' }, [
          crea('strong', {}, ca.nome || t.titoloNuovo),
          crea('span', { class: 'etichette' }, [
            crea('span', { class: `etichetta-tipo ${ca.tipo}` }, t.tipi[ca.tipo]),
            crea('span', {}, t.momenti[ca.momento]),
            ca.validita === 'domani' ? crea('span', {}, t.validita.domani) : null,
          ]),
          crea('span', { class: 'nota' }, riassuntoGiorni(ca, bozza.tipiGiorno)),
          completo ? null : crea('span', { class: 'campo-errore' }, t.daCompletare),
        ]),
        crea('span', { class: 'freccia', 'aria-hidden': 'true' }, '›'),
      ]);
    });

    return crea('div', { class: 'colonna' }, [
      ctx.errore('nessun-comportamento')
        ? crea('p', { class: 'campo-errore', role: 'alert' }, ctx.errore('nessun-comportamento'))
        : null,
      schede.length ? crea('div', { class: 'elenco-ca' }, schede) : crea('p', { class: 'scheda vuoto' }, t.vuoto),
      crea('div', { class: 'riga-pulsanti' }, [
        pulsante(`+ ${t.aggiungi}`, aggiungi, { classe: 'primario' }),
        pulsante(t.importa, () => {
          const prima = bozza.comportamenti.length;
          ctx.modifica((b) => {
            importaModello(b);
            messaggio = t.importato(b.comportamenti.length - prima);
          }, { ridisegna: true });
        }),
      ]),
      avviso,
    ]);
  },
};
