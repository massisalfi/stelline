// Scheda a tutto schermo per creare o modificare un comportamento atteso (sezione 4, passo 4).
// Si lavora su una copia: le modifiche entrano nella bozza solo con "Salva".

import { crea } from '../componenti/dom.js';
import {
  campoTesto, areaTesto, contatoreNumerico, sceltaPulsanti, interruttore, pulsante, sezione,
} from '../componenti/moduli.js';
import { apriScheda, chiediConferma } from '../componenti/finestre.js';
import { controllaComportamento, statoDaTipo, MOMENTI } from '../../regole/configurazione.js';
import { ICONE_COMPORTAMENTI, percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { parla } from '../../voce/voce.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.comportamenti;

function sceltaIcona(ca, alCambio, errore) {
  const griglia = crea('div', { class: 'griglia-icone', role: 'radiogroup', 'aria-label': t.icona });
  const disegna = () => griglia.replaceChildren(...ICONE_COMPORTAMENTI.map((icona) => crea('button', {
    type: 'button',
    role: 'radio',
    class: icona.id === ca.icona ? 'scelta-icona attiva' : 'scelta-icona',
    'aria-checked': String(icona.id === ca.icona),
    'aria-label': icona.etichetta,
    onclick: () => { alCambio(icona.id); disegna(); },
  }, crea('img', { src: percorsoIcona(icona.id), alt: '', width: 48, height: 48 }))));
  disegna();
  return crea('div', { class: errore ? 'campo con-errore' : 'campo' }, [
    crea('p', { class: 'nota' }, t.iconaSpiegazione),
    griglia,
    errore ? crea('p', { class: 'campo-errore' }, errore) : null,
  ]);
}

// Tabella "in quali giorni": una riga per tipo di giornata.
function tabellaGiorni(ca, tipiGiorno, ridisegna, errore) {
  const righe = tipiGiorno.map((tipo) => {
    const regola = ca.perTipo[tipo.id];
    const campione = crea('span', { class: 'campione', 'aria-hidden': 'true' });
    campione.style.backgroundColor = tipo.colore;
    const attivo = regola.previsto || regola.automatica;
    return crea('div', { class: attivo ? 'riga-giorno' : 'riga-giorno spenta' }, [
      crea('span', { class: 'nome-tipo' }, [campione, tipo.nome]),
      interruttore({
        etichetta: t.previsto,
        attivo: regola.previsto,
        alCambio: (v) => { regola.previsto = v; ridisegna(); },
      }),
      attivo
        ? contatoreNumerico({
          etichetta: t.quanteStelline, valore: regola.stelline, minimo: 1, massimo: 10,
          formato: (n) => '★'.repeat(Math.min(n, 5)) + (n > 5 ? ` ${n}` : ''),
          alCambio: (n) => { regola.stelline = n; },
        })
        : crea('span', { class: 'nota' }, t.nonPrevisto),
      interruttore({
        etichetta: t.automaticaEtichetta,
        attivo: regola.automatica,
        alCambio: (v) => { regola.automatica = v; ridisegna(); },
      }),
    ]);
  });
  return crea('div', { class: errore ? 'campo con-errore' : 'campo' }, [
    ...righe,
    errore ? crea('p', { class: 'campo-errore' }, errore) : null,
  ]);
}

function regolaGiornoDopo(ca, tipiGiorno, ridisegna) {
  const attiva = ca.automaticaSeDomaniNon.length > 0;
  return crea('div', { class: 'campo' }, [
    interruttore({
      etichetta: t.regolaDomani,
      attivo: attiva,
      alCambio: (v) => {
        ca.automaticaSeDomaniNon = v ? [tipiGiorno.find((x) => x.id === 'scuola')?.id ?? tipiGiorno[0].id] : [];
        ridisegna();
      },
    }),
    crea('p', { class: 'nota' }, t.regolaDomaniSpiegazione),
    attiva
      ? crea('div', { class: 'segmenti a-capo' }, tipiGiorno.map((tipo) => {
        const scelto = ca.automaticaSeDomaniNon.includes(tipo.id);
        return crea('button', {
          type: 'button',
          class: scelto ? 'segmento attivo' : 'segmento',
          'aria-pressed': String(scelto),
          onclick: () => {
            ca.automaticaSeDomaniNon = scelto
              ? ca.automaticaSeDomaniNon.filter((id) => id !== tipo.id)
              : [...ca.automaticaSeDomaniNon, tipo.id];
            ridisegna();
          },
        }, tipo.nome);
      }))
      : null,
  ]);
}

// Apre la scheda. alSalvataggio(ca) riceve il comportamento completo; alEliminazione è facoltativo.
export function apriSchedaComportamento({ comportamento, tipiGiorno, voce, nuovo, alSalvataggio, alEliminazione }) {
  const ca = structuredClone(comportamento);
  let errori = [];
  const errore = (codice) => (errori.some((e) => e.codice === codice) ? testi.errori[codice] : null);

  const salva = pulsante(t.salva, () => {
    errori = controllaComportamento(ca, tipiGiorno);
    if (errori.length) {
      disegna();
      scheda.corpo.querySelector('.con-errore')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    ca.stato = statoDaTipo(ca.tipo);
    scheda.chiudi();
    alSalvataggio(ca);
  }, { classe: 'primario' });

  const azioni = [
    !nuovo && alEliminazione
      ? pulsante(t.elimina, async () => {
        if (await chiediConferma({ domanda: t.confermaElimina, si: testi.comune.elimina, no: testi.comune.annulla })) {
          scheda.chiudi();
          alEliminazione();
        }
      }, { classe: 'leggero pericolo' })
      : crea('span'),
    crea('div', { class: 'azioni-destra' }, [pulsante(testi.comune.annulla, () => scheda.chiudi()), salva]),
  ];
  const scheda = apriScheda({ titolo: nuovo ? t.titoloNuovo : t.titoloModifica, azioni });

  function disegna() {
    const scorrimento = scheda.corpo.scrollTop;
    scheda.corpo.replaceChildren(
      errori.length ? crea('p', { class: 'avviso-errori', role: 'alert' }, testi.configurazione.correggi) : '',
      crea('div', { class: 'griglia-due' }, [
        sezione(t.sezioneDescrizione, [
          campoTesto({
            etichetta: t.nome, valore: ca.nome, segnaposto: t.nomeEsempio, maxlength: 40,
            errore: errore('ca-nome-mancante'), alCambio: (v) => { ca.nome = v; },
          }),
          areaTesto({
            etichetta: t.frase, valore: ca.frase, spiegazione: t.fraseSpiegazione, righe: 2, maxlength: 160,
            errore: errore('ca-frase-mancante'), alCambio: (v) => { ca.frase = v; },
          }),
          pulsante(t.ascoltaFrase, () => parla(ca.frase || ca.nome, voce)),
          areaTesto({
            etichetta: t.definizione, valore: ca.definizione, spiegazione: t.definizioneSpiegazione,
            segnaposto: t.definizioneEsempio, righe: 4,
            alCambio: (v) => { ca.definizione = v; },
          }),
        ]),
        sezione(t.icona, [sceltaIcona(ca, (id) => { ca.icona = id; }, errore('ca-icona-mancante'))]),
      ]),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.sezioneOrganizzazione, [
          sceltaPulsanti({
            etichetta: t.tipo, valore: ca.tipo,
            opzioni: ['fisso', 'scelta', 'catalogo'].map((v) => ({ valore: v, testo: t.tipi[v] })),
            spiegazione: (v) => t.tipiSpiegazione[v],
            alCambio: (v) => { ca.tipo = v; },
          }),
          sceltaPulsanti({
            etichetta: t.momento, valore: ca.momento,
            opzioni: MOMENTI.map((v) => ({ valore: v, testo: t.momenti[v] })),
            alCambio: (v) => { ca.momento = v; },
          }),
          sceltaPulsanti({
            etichetta: t.quando, valore: ca.validita, spiegazione: t.validitaSpiegazione,
            opzioni: ['oggi', 'domani'].map((v) => ({ valore: v, testo: t.validita[v] })),
            alCambio: (v) => { ca.validita = v; },
          }),
        ]),
        sezione(t.sezioneSolleciti, [
          contatoreNumerico({
            etichetta: t.solleciti, valore: ca.massimoSolleciti, minimo: 0, massimo: 10,
            errore: errore('ca-solleciti'), alCambio: (n) => { ca.massimoSolleciti = n; },
          }),
          crea('p', { class: 'nota' }, t.sollecitiSpiegazione),
          interruttore({
            etichetta: t.timer,
            attivo: ca.timer != null,
            alCambio: (v) => { ca.timer = v ? 10 : null; disegna(); },
          }),
          crea('p', { class: 'nota' }, t.timerSpiegazione),
          ca.timer != null
            ? contatoreNumerico({
              valore: ca.timer, minimo: 1, massimo: 120, formato: t.minuti,
              errore: errore('ca-timer'), alCambio: (n) => { ca.timer = n; },
            })
            : null,
        ]),
      ]),
      sezione(t.giorni, [
        tabellaGiorni(ca, tipiGiorno, disegna, errore('ca-nessun-giorno') ?? errore('ca-stelline')),
        regolaGiornoDopo(ca, tipiGiorno, disegna),
      ], t.giorniSpiegazione),
      sezione(t.laurea, [
        crea('div', { class: 'riga-campi' }, [
          contatoreNumerico({
            valore: ca.laurea.percentuale, minimo: 50, massimo: 100, passo: 5, formato: t.percentuale,
            errore: errore('ca-laurea'), alCambio: (n) => { ca.laurea.percentuale = n; },
          }),
          contatoreNumerico({
            valore: ca.laurea.settimane, minimo: 1, massimo: 12, formato: t.settimane,
            alCambio: (n) => { ca.laurea.settimane = n; },
          }),
        ]),
      ], t.laureaSpiegazione),
    );
    scheda.corpo.scrollTop = scorrimento;
  }

  disegna();
}
