// Area genitori: schermata Oggi (RF-G02) con la registrazione rapida (RF-G03).
// In alto il portafoglio di oggi e i minuti di schermo già riscattati; poi i comportamenti
// del giorno in ordine di momento, ciascuno con il suo stato. «Ieri» serve per le registrazioni in ritardo.

import { crea } from '../componenti/dom.js';
import { pulsante, sceltaPulsanti, sezione } from '../componenti/moduli.js';
import { apriScheda } from '../componenti/finestre.js';
import { apriSchedaRegistrazione } from './scheda-registrazione.js';
import { comportamentiDelGiorno, stellineNelGiorno } from '../../regole/giorno.js';
import { statoInOggi, nuovaRegistrazione, minutiPerCategoria } from '../../regole/oggi.js';
import { saldo } from '../../regole/portafoglio.js';
import { minutiDelGiorno } from '../../regole/riscatto.js';
import { giornoPrima } from '../../regole/date.js';
import { versioneDelGiorno, ultimaVersione } from '../../regole/versioni.js';
import { annullabile, SECONDI_ANNULLA } from '../../regole/registrazione.js';
import { caricaConfigurazione, salvaNuovaVersione } from '../../dati/configurazione.js';
import { datiDelGiorno, salvaRegistrazione, annullaRegistrazione } from '../../dati/registro.js';
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

// Crea la schermata e la ridisegna da sola dopo ogni registrazione.
export async function creaAreaGenitori({ archivio, genitore, inizio, alUscita, adesso = () => Date.now() }) {
  const schermo = crea('main', { class: 'schermo area-genitori' });
  const avvisoAnnulla = crea('div', { class: 'barra-annulla', hidden: true, role: 'status' });
  let vista = 'oggi';
  let conto = null;

  async function disegna() {
    const { oggi, versioni } = await caricaConfigurazione(archivio, adesso());
    const giorno = vista === 'oggi' ? oggi : giornoPrima(oggi);
    const versione = versioneDelGiorno(giorno, versioni);
    const configurazione = versione?.contenuto ?? null;
    const genitori = ultimaVersione(versioni)?.contenuto.genitori ?? [];
    const delGiorno = await datiDelGiorno(archivio, giorno);
    const diOggi = vista === 'oggi' ? delGiorno : await datiDelGiorno(archivio, oggi);
    const stelline = saldo(oggi, diOggi.movimenti);
    const minuti = configurazione
      ? minutiPerCategoria(configurazione.economia.categorie, minutiDelGiorno(oggi, diOggi.riscatti))
      : [];

    const voci = configurazione
      ? comportamentiDelGiorno(configurazione.comportamenti, giorno, configurazione.calendario)
      : [];
    const righe = voci.map(({ comportamento: ca, stato }) => {
      const registrazione = delGiorno.registrazioni.find((r) => r.comportamento === ca.id);
      const statoOggi = statoInOggi(stato, registrazione);
      const valore = stellineNelGiorno(ca, giorno, configurazione.calendario);
      return crea('li', {}, crea('button', {
        type: 'button',
        class: `riga-oggi stato-${statoOggi.replace(' ', '-')}`,
        onclick: () => apri(ca, stato, registrazione, { giorno, oggi, configurazione, versione, genitori }),
      }, [
        crea('img', { src: percorsoIcona(ca.icona ?? 'giochi'), alt: '', width: 44, height: 44 }),
        crea('span', { class: 'riga-oggi-testo' }, [
          crea('strong', {}, ca.nome),
          crea('span', { class: 'nota' }, `${tc.momenti[ca.momento]} · ${t.valore(valore)}`),
        ]),
        crea('span', { class: 'distintivo-stato' }, t.stati[statoOggi]),
      ]));
    });

    schermo.replaceChildren(...[
      crea('header', { class: 'testata-genitori' }, [
        crea('div', {}, [crea('p', { class: 'sopratitolo' }, tg.titolo), crea('h1', {}, tg.ciao(genitore.nome))]),
        pulsante(tg.esci, () => { fermaAnnulla(); alUscita(); }),
      ]),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.portafoglio, [
          crea('p', { class: 'portafoglio' }, stelline > 0 ? `${'★'.repeat(Math.min(stelline, 20))} ${stelline}` : t.nessunaStellina),
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
        vista === 'ieri' ? crea('p', { class: 'nota' }, t.ieriSpiegazione) : null,
        righe.length ? crea('ul', { class: 'elenco-oggi' }, righe) : crea('p', { class: 'nota' }, t.nessuno),
      ]),
      crea('p', { class: 'nota sicurezza' }, tg.sicurezza),
      avvisoAnnulla,
    ].filter(Boolean));
  }

  function apri(ca, stato, registrazione, contesto) {
    if (registrazione) return mostraRegistrazione(ca, registrazione, contesto.genitori);
    if (stato === 'automatico') return mostraInfo(ca.nome, t.automaticoSpiegazione);
    apriSchedaRegistrazione({
      comportamento: ca,
      suggerimenti: contesto.configurazione.suggerimentiDubbio,
      alSalvataggio: async (scelte) => {
        const quando = adesso();
        const dati = nuovaRegistrazione({
          id: crypto.randomUUID(),
          comportamento: ca,
          calendario: contesto.configurazione.calendario,
          scelte,
          genitore: genitore.id,
          giorno: contesto.giorno,
          giornoRegistrazione: contesto.oggi,
          quando,
          versione: contesto.versione.numero,
        });
        await salvaRegistrazione(archivio, dati);
        await disegna();
        offriAnnulla(ca.nome, dati);
      },
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

  // Annulla per 10 secondi dopo il salvataggio (RF-G03): poi la registrazione resta.
  function offriAnnulla(nome, dati) {
    fermaAnnulla();
    const aggiorna = () => {
      if (!schermo.isConnected) {
        fermaAnnulla();
        return;
      }
      const rimasti = Math.ceil((dati.registrazione.quando + SECONDI_ANNULLA * 1000 - adesso()) / 1000);
      if (!annullabile(dati.registrazione, adesso()) || rimasti <= 0) {
        fermaAnnulla();
        return;
      }
      avvisoAnnulla.replaceChildren(
        crea('span', {}, t.registrato(nome)),
        pulsante(t.annulla(rimasti), async () => {
          if (!annullabile(dati.registrazione, adesso())) return;
          fermaAnnulla();
          await annullaRegistrazione(archivio, dati);
          await disegna();
          mostraBreve(t.annullato);
        }, { classe: 'primario' }),
      );
      avvisoAnnulla.hidden = false;
    };
    aggiorna();
    conto = setInterval(aggiorna, 250);
  }

  function fermaAnnulla() {
    clearInterval(conto);
    conto = null;
    avvisoAnnulla.hidden = true;
  }

  function mostraBreve(testo) {
    avvisoAnnulla.replaceChildren(crea('span', {}, testo));
    avvisoAnnulla.hidden = false;
    setTimeout(() => { if (!conto) avvisoAnnulla.hidden = true; }, 2500);
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
