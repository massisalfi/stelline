// Area genitori: schermata Oggi (RF-G02) con la registrazione (RF-G03, RF-G04).
// In alto il portafoglio di oggi (e le stelline già guadagnate per domani) e i minuti di schermo
// già riscattati; poi i comportamenti del giorno in ordine di momento.
// Accanto a ogni comportamento da registrare c'è la stellina: un tocco, la conferma, la festa.
// Toccando il nome si apre la scheda di dettaglio (solleciti, rifiuto, dubbio, nota).
// «Ieri» serve per le registrazioni in ritardo.

import { crea } from '../componenti/dom.js';
import { pulsante, sceltaPulsanti, sezione } from '../componenti/moduli.js';
import { apriScheda, chiediConferma } from '../componenti/finestre.js';
import { disegnoStella } from '../componenti/stella.js';
import { preparaSuoni } from '../componenti/suoni.js';
import { festeggia } from '../componenti/festa.js';
import { apriSchedaRegistrazione } from './scheda-registrazione.js';
import { comportamentiDelGiorno, stellineNelGiorno } from '../../regole/giorno.js';
import { statoInOggi, sceltePredefinite, nuovaRegistrazione, minutiPerCategoria } from '../../regole/oggi.js';
import { saldo } from '../../regole/portafoglio.js';
import { minutiDelGiorno } from '../../regole/riscatto.js';
import { giornoPrima, giornoDopo } from '../../regole/date.js';
import { versioneDelGiorno, ultimaVersione } from '../../regole/versioni.js';
import { caricaConfigurazione, salvaNuovaVersione } from '../../dati/configurazione.js';
import { datiDelGiorno, salvaRegistrazione } from '../../dati/registro.js';
import { percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { testi } from '../../testi/it.js';

const t = testi.oggi;
const tg = testi.areaGenitori;
const tc = testi.configurazione.comportamenti;

export function dataLeggibile(giorno) {
  const [a, m, g] = giorno.split('-').map(Number);
  return new Date(a, m - 1, g).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ora(istante) {
  return new Date(istante).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const stelle = (n) => `${'★'.repeat(Math.min(n, 20))} ${n}`;

// Crea la schermata e la ridisegna da sola dopo ogni registrazione.
export async function creaAreaGenitori({ archivio, genitore, inizio, alUscita, adesso = () => Date.now() }) {
  const schermo = crea('main', { class: 'schermo area-genitori' });
  let vista = 'oggi';
  let registrazioneInCorso = false;

  async function disegna() {
    const { oggi, versioni } = await caricaConfigurazione(archivio, adesso());
    const giorno = vista === 'oggi' ? oggi : giornoPrima(oggi);
    const versione = versioneDelGiorno(giorno, versioni);
    const configurazione = versione?.contenuto ?? null;
    const ultima = ultimaVersione(versioni)?.contenuto;
    const genitori = ultima?.genitori ?? [];
    const delGiorno = await datiDelGiorno(archivio, giorno);
    const diOggi = vista === 'oggi' ? delGiorno : await datiDelGiorno(archivio, oggi);
    const domani = giornoDopo(oggi);
    const stelline = saldo(oggi, diOggi.movimenti);
    const perDomani = saldo(domani, (await datiDelGiorno(archivio, domani)).movimenti);
    const configurazioneOggi = versioneDelGiorno(oggi, versioni)?.contenuto;
    const minuti = configurazioneOggi
      ? minutiPerCategoria(configurazioneOggi.economia.categorie, minutiDelGiorno(oggi, diOggi.riscatti))
      : [];
    // Suoni e volume seguono l'ultima configurazione salvata (passo 2).
    const suoni = ultima?.giocatrice?.suoni;

    const voci = configurazione
      ? comportamentiDelGiorno(configurazione.comportamenti, giorno, configurazione.calendario)
      : [];
    const righe = voci.map(({ comportamento: ca, stato }) => {
      const registrazione = delGiorno.registrazioni.find((r) => r.comportamento === ca.id);
      const statoOggi = statoInOggi(stato, registrazione);
      const valore = stellineNelGiorno(ca, giorno, configurazione.calendario);
      const contesto = { giorno, oggi, configurazione, versione, genitori, suoni };
      const dettagli = [tc.momenti[ca.momento], t.valore(valore), ca.validita === 'domani' ? t.valeDomani : null];
      return crea('li', { class: `riga-oggi stato-${statoOggi.replace(' ', '-')}` }, [
        crea('button', {
          type: 'button',
          class: 'riga-oggi-apri',
          onclick: () => apri(ca, stato, registrazione, contesto),
        }, [
          crea('img', { src: percorsoIcona(ca.icona ?? 'giochi'), alt: '', width: 44, height: 44 }),
          crea('span', { class: 'riga-oggi-testo' }, [
            crea('strong', {}, ca.nome),
            crea('span', { class: 'nota' }, dettagli.filter(Boolean).join(' · ')),
          ]),
          t.stati[statoOggi] ? crea('span', { class: 'distintivo-stato' }, t.stati[statoOggi]) : null,
        ]),
        stellaDellaRiga(ca, statoOggi, contesto),
      ]);
    });

    // Ieri senza configurazione: la settimana 0 è iniziata oggi.
    const vuoto = vista === 'ieri' && !configurazione ? t.ieriPrimaDellInizio : t.nessuno;

    schermo.replaceChildren(...[
      crea('header', { class: 'testata-genitori' }, [
        crea('div', {}, [crea('p', { class: 'sopratitolo' }, tg.titolo), crea('h1', {}, tg.ciao(genitore.nome))]),
        pulsante(tg.esci, () => alUscita()),
      ]),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.portafoglio, [
          crea('p', { class: 'portafoglio' }, stelline > 0 ? stelle(stelline) : t.nessunaStellina),
          perDomani > 0 ? crea('p', { class: 'per-domani' }, t.perDomani(stelle(perDomani))) : null,
          ...minuti.map((m) => crea('p', { class: 'nota' }, `${m.nome}: ${t.minuti(m.usati, m.limite)}`)),
        ]),
        sezione(tg.settimana0, [
          inizio ? crea('p', {}, tg.iniziata(dataLeggibile(inizio))) : null,
          crea('p', { class: 'nota' }, tg.spiegazione),
        ]),
      ]),
      crea('section', { class: 'scheda' }, [
        crea('div', { class: 'testata-elenco' }, [
          crea('h2', {}, `${t.elenco} · ${dataLeggibile(giorno)}`),
          sceltaPulsanti({
            etichetta: t.elenco, valore: vista, nascondiEtichetta: true,
            opzioni: [{ valore: 'oggi', testo: t.giorni.oggi }, { valore: 'ieri', testo: t.giorni.ieri }],
            alCambio: (v) => { vista = v; disegna(); },
          }),
        ]),
        righe.length ? crea('p', { class: 'nota' }, vista === 'ieri' ? t.ieriSpiegazione : t.comeSiRegistra) : null,
        righe.length ? crea('ul', { class: 'elenco-oggi' }, righe) : crea('p', { class: 'nota' }, vuoto),
      ]),
      crea('p', { class: 'nota sicurezza' }, tg.sicurezza),
    ].filter(Boolean));
  }

  // Da registrare: stellina vuota da toccare. Data: stellina piena. Automatica: piena e più chiara.
  // Rifiutata: solo il contorno. Oltre i solleciti: nessuna stellina.
  function stellaDellaRiga(ca, statoOggi, contesto) {
    if (statoOggi === 'da fare') {
      return crea('button', {
        type: 'button',
        class: 'stella-registra',
        'aria-label': t.daiStellina(ca.nome),
        onclick: () => {
          preparaSuoni(); // dentro il tocco: Safari suona solo così
          registraStellina(ca, contesto);
        },
      }, disegnoStella('vuota'));
    }
    const classe = { eseguito: '', automatico: 'automatica', rifiutata: 'vuota spenta' }[statoOggi];
    return crea('span', { class: 'stella-riga' }, classe === undefined ? [] : disegnoStella(classe));
  }

  async function registraStellina(ca, contesto) {
    const avviso = contesto.giorno !== contesto.oggi ? t.conferma.ieri : ca.validita === 'domani' ? t.conferma.domani : null;
    const confermata = await chiediConferma({
      domanda: t.conferma.domanda(ca.nome),
      spiegazione: [t.conferma.spiegazione, avviso].filter(Boolean).join(' '),
      si: t.conferma.si,
      no: testi.comune.annulla,
    });
    if (confermata) await registra(ca, contesto, sceltePredefinite());
  }

  // Salva la registrazione; se la bambina riceve stelline, festa con animazione e suono (RF-G04).
  async function registra(ca, contesto, scelte) {
    if (registrazioneInCorso) return;
    registrazioneInCorso = true;
    try {
      const { registrazioni } = await datiDelGiorno(archivio, contesto.giorno);
      if (registrazioni.some((r) => r.comportamento === ca.id)) return; // già registrato (doppio tocco)
      const dati = nuovaRegistrazione({
        id: crypto.randomUUID(),
        comportamento: ca,
        calendario: contesto.configurazione.calendario,
        scelte,
        genitore: genitore.id,
        giorno: contesto.giorno,
        giornoRegistrazione: contesto.oggi,
        quando: adesso(),
        versione: contesto.versione.numero,
      });
      await salvaRegistrazione(archivio, dati);
      const festa = dati.registrazione.stelline > 0
        ? festeggia({
          stelline: dati.registrazione.stelline,
          suoni: contesto.suoni,
          etichetta: dati.movimenti[0]?.giorno > contesto.oggi ? t.festaDomani : null,
        })
        : null;
      await disegna();
      await festa;
    } finally {
      registrazioneInCorso = false;
    }
  }

  function apri(ca, stato, registrazione, contesto) {
    if (registrazione) return mostraRegistrazione(ca, registrazione, contesto.genitori);
    if (stato === 'automatico') return mostraInfo(ca.nome, t.automaticoSpiegazione);
    preparaSuoni();
    apriSchedaRegistrazione({
      comportamento: ca,
      suggerimenti: contesto.configurazione.suggerimentiDubbio,
      alSalvataggio: (scelte) => registra(ca, contesto, scelte),
      // RF-G07: la definizione scritta durante un dubbio entra in una nuova versione, valida da domani.
      alDefinizione: async (testo) => {
        const { versioni } = await caricaConfigurazione(archivio, adesso());
        const contenuto = structuredClone(ultimaVersione(versioni).contenuto);
        const daAggiornare = contenuto.comportamenti.find((c) => c.id === ca.id);
        if (daAggiornare) daAggiornare.definizione = testo;
        await salvaNuovaVersione(archivio, contenuto, genitore.nome, adesso());
      },
    });
  }

  function mostraInfo(titolo, testo) {
    const scheda = apriScheda({ titolo, azioni: [crea('span'), pulsante(testi.comune.fatto, () => scheda.chiudi(), { classe: 'primario' })] });
    scheda.corpo.replaceChildren(crea('p', {}, testo));
  }

  function mostraRegistrazione(ca, r, genitori) {
    const r2 = t.riepilogo;
    const chi = genitori.find((g) => g.id === r.genitore)?.nome ?? '';
    const righe = [
      r.eseguito ? r2.eseguito(r.solleciti) : r2.nonEseguito,
      !r.valida ? r2.nonValida : r.stellinaAccettata === false ? r2.rifiutata : r2.stellina(r.stelline),
      r.dubbio ? r2.dubbio : null,
      r.nota ? `«${r.nota}»` : null,
      r2.chi(chi, ora(r.quando)),
    ].filter(Boolean);
    const scheda = apriScheda({ titolo: `${ca.nome} · ${t.giaRegistrato}`, azioni: [crea('span'), pulsante(testi.comune.fatto, () => scheda.chiudi(), { classe: 'primario' })] });
    scheda.corpo.replaceChildren(
      crea('ul', { class: 'righe-riepilogo' }, righe.map((x) => crea('li', {}, x))),
      crea('p', { class: 'nota' }, t.correzioniInArrivo),
    );
  }

  await disegna();
  return schermo;
}
