// Scheda a tutto schermo per creare o modificare un premio del listino (sezione 4, passo 7).
// Si lavora su una copia: le modifiche entrano nella bozza solo con "Salva".

import { crea } from '../componenti/dom.js';
import {
  campoTesto, contatoreNumerico, sceltaPulsanti, selettore, interruttore, pulsante, sezione,
} from '../componenti/moduli.js';
import { apriScheda, chiediConferma } from '../componenti/finestre.js';
import { controllaPremio, FAMIGLIE, MODALITA } from '../../regole/configurazione-gioco.js';
import { ICONE_PREMI, percorsoIconaPremio } from '../../risorse/icone-premi.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.listino;

function sceltaIcona(premio, errore) {
  const griglia = crea('div', { class: 'griglia-icone', role: 'radiogroup', 'aria-label': t.icona });
  const disegna = () => griglia.replaceChildren(...ICONE_PREMI.map((icona) => crea('button', {
    type: 'button',
    role: 'radio',
    class: icona.id === premio.icona ? 'scelta-icona attiva' : 'scelta-icona',
    'aria-checked': String(icona.id === premio.icona),
    'aria-label': icona.etichetta,
    onclick: () => { premio.icona = icona.id; disegna(); },
  }, crea('img', { src: percorsoIconaPremio(icona.id), alt: '', width: 48, height: 48 }))));
  disegna();
  return crea('div', { class: errore ? 'campo con-errore' : 'campo' }, [
    griglia,
    errore ? crea('p', { class: 'campo-errore' }, errore) : null,
  ]);
}

export function apriSchedaPremio({ premio: originale, categorie, nuovo, alSalvataggio, alEliminazione }) {
  const premio = structuredClone(originale);
  let errori = [];
  const errore = (codice) => (errori.some((e) => e.codice === codice) ? testi.errori[codice] : null);

  const azioni = [
    !nuovo
      ? pulsante(t.elimina, async () => {
        if (await chiediConferma({ domanda: t.confermaElimina, si: testi.comune.elimina, no: testi.comune.annulla })) {
          scheda.chiudi();
          alEliminazione();
        }
      }, { classe: 'leggero pericolo' })
      : crea('span'),
    crea('div', { class: 'azioni-destra' }, [
      pulsante(testi.comune.annulla, () => scheda.chiudi()),
      pulsante(t.salva, () => {
        errori = controllaPremio(premio, categorie);
        if (errori.length) {
          disegna();
          scheda.corpo.querySelector('.con-errore')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        scheda.chiudi();
        alSalvataggio(premio);
      }, { classe: 'primario' }),
    ]),
  ];
  const scheda = apriScheda({ titolo: nuovo ? t.titoloNuovo : t.titoloModifica, azioni });

  function disegna() {
    const scorrimento = scheda.corpo.scrollTop;
    const schermo = premio.categoria != null;
    scheda.corpo.replaceChildren(
      errori.length ? crea('p', { class: 'avviso-errori', role: 'alert' }, testi.configurazione.correggi) : '',
      crea('div', { class: 'griglia-due' }, [
        sezione(t.sezioneDescrizione, [
          campoTesto({
            etichetta: t.nome, valore: premio.nome, segnaposto: t.nomeEsempio, maxlength: 50,
            errore: errore('premio-nome-mancante'), alCambio: (v) => { premio.nome = v; },
          }),
          sceltaPulsanti({
            etichetta: t.famiglia, valore: premio.famiglia,
            opzioni: FAMIGLIE.map((v) => ({ valore: v, testo: t.famiglie[v] })),
            spiegazione: (v) => t.famiglieSpiegazione[v],
            alCambio: (v) => { premio.famiglia = v; },
          }),
        ]),
        sezione(t.icona, [sceltaIcona(premio, errore('premio-icona-mancante'))]),
      ]),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.come, [
          sceltaPulsanti({
            etichetta: t.come, valore: premio.modalita,
            opzioni: MODALITA.map((v) => ({ valore: v, testo: t.modalita[v] })),
            spiegazione: (v) => t.modalitaSpiegazione[v],
            alCambio: (v) => { premio.modalita = v; disegna(); },
          }),
          premio.modalita === 'stelline'
            ? contatoreNumerico({
              etichetta: t.costo, valore: premio.costo, minimo: 1, massimo: 100,
              errore: errore('premio-costo'), alCambio: (n) => { premio.costo = n; },
            })
            : null,
          premio.modalita === 'raro'
            ? contatoreNumerico({
              etichetta: t.ogniStagioni, valore: premio.ogniStagioni, minimo: 1, massimo: 10, formato: t.stagioni,
              errore: errore('premio-ogni-stagioni'), alCambio: (n) => { premio.ogniStagioni = n; },
            })
            : null,
        ]),
        sezione(t.schermo, [
          interruttore({
            etichetta: t.schermo,
            attivo: schermo,
            alCambio: (v) => {
              premio.categoria = v ? categorie[0]?.id ?? null : null;
              premio.minuti = v ? 20 : null;
              disegna();
            },
          }),
          crea('p', { class: 'nota' }, t.schermoSpiegazione),
          schermo
            ? crea('div', { class: 'riga-campi' }, [
              selettore({
                etichetta: t.categoria, valore: premio.categoria,
                opzioni: categorie.map((c) => ({ valore: c.id, testo: c.nome })),
                errore: errore('premio-categoria'), alCambio: (v) => { premio.categoria = v; },
              }),
              contatoreNumerico({
                etichetta: t.minutiPremio, valore: premio.minuti ?? 20, minimo: 5, massimo: 240, passo: 5,
                formato: testi.configurazione.economia.minuti,
                errore: errore('premio-minuti'), alCambio: (n) => { premio.minuti = n; },
              }),
            ])
            : null,
        ]),
      ]),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.dopo, [
          sceltaPulsanti({
            etichetta: t.dopo, valore: premio.riutilizzabile ? 'resta' : 'esaurisce',
            opzioni: ['esaurisce', 'resta'].map((v) => ({ valore: v, testo: t.dopoOpzioni[v] })),
            spiegazione: t.dopoSpiegazione,
            alCambio: (v) => { premio.riutilizzabile = v === 'resta'; },
          }),
        ]),
        sezione(t.euro, [
          campoTesto({
            etichetta: t.euro, valore: premio.euro == null ? '' : String(premio.euro).replace('.', ','),
            tipo: 'text', maxlength: 8, errore: errore('premio-euro'),
            alCambio: (v) => {
              const testo = v.trim().replace(',', '.');
              premio.euro = testo === '' ? null : Number(testo);
            },
          }),
          crea('p', { class: 'nota' }, t.euroSpiegazione),
        ]),
      ]),
    );
    scheda.corpo.scrollTop = scorrimento;
  }

  disegna();
}
