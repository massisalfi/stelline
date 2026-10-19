// Avvio dell'app: service worker, richiesta di conservazione persistente, prima schermata.

import { VERSIONE } from './versione.js';
import { testi } from './testi/it.js';
import { crea } from './interfaccia/componenti/dom.js';
import { schermataBenvenuto } from './interfaccia/benvenuto.js';
import { schermataApriDallIcona } from './interfaccia/apri-dall-icona.js';
import { creaProcedura, CHIAVE_BOZZA } from './interfaccia/configurazione/procedura.js';
import { apriArchivio } from './dati/archivio.js';
import { avviaSettimana0 } from './dati/avvio.js';
import { caricaConfigurazione } from './dati/configurazione.js';
import { schermataAreaChiusa } from './interfaccia/bambina/area-chiusa.js';
import { schermataAccesso } from './interfaccia/genitori/accesso.js';
import { creaAreaGenitori } from './interfaccia/genitori/area-genitori.js';
import { aggiornaGiornata } from './dati/registro.js';
import { avviaSessione } from './interfaccia/sessione.js';
import { nuovaBozza, completaBozza, servePinPerRiprendere } from './regole/configurazione.js';
import { chiediPin } from './interfaccia/componenti/tastierino.js';
import { genitoreDelPin } from './sicurezza/pin.js';

const radice = document.getElementById('app');

function piede() {
  const offline = crea('span', { class: 'piede-offline', hidden: navigator.onLine }, testi.stato.offline);
  const aggiorna = () => { offline.hidden = navigator.onLine; };
  window.addEventListener('online', aggiorna);
  window.addEventListener('offline', aggiorna);
  return crea('footer', { class: 'piede' }, [
    crea('span', {}, `${testi.app.versione(VERSIONE)} · ${testi.app.soloQui}`),
    offline,
  ]);
}

function mostra(schermata) {
  radice.replaceChildren(schermata, piede());
}

// Sul Mac di sviluppo (localhost) si lavora nel browser:
//   ?safari  mostra la schermata che compare in Safari;
//   ?offline attiva la copia offline (di norma spenta, per vedere subito il codice nuovo).
const SVILUPPO = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const PARAMETRI = new URLSearchParams(window.location.search);

// RNF-15: l'app vera si apre dall'icona sulla schermata Home.
function apertaDallIcona() {
  const installata = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return installata || (SVILUPPO && !PARAMETRI.has('safari'));
}

// RNF-04: si chiede al sistema di non cancellare i dati per liberare spazio.
async function chiediConservazione() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Se il browser non lo consente, l'app funziona comunque; il pannello mostrerà lo stato.
  }
}

// Una versione nuova si attiva solo all'avvio (prima che qualcuno tocchi lo schermo)
// o al ritorno nell'app, mai a metà di un'azione.
async function avviaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (SVILUPPO && !PARAMETRI.has('offline')) {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    return;
  }
  let toccato = false;
  window.addEventListener('pointerdown', () => { toccato = true; }, { once: true, capture: true });

  // Al primo avvio la copia offline si prepara senza ricaricare la pagina:
  // si ricarica solo quando una versione nuova sostituisce quella in uso.
  const aggiornamento = Boolean(navigator.serviceWorker.controller);
  let ricaricata = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!aggiornamento || ricaricata) return;
    ricaricata = true;
    window.location.reload();
  });
  const registrazione = await navigator.serviceWorker.register('sw.js');
  const attivaInAttesa = () => registrazione.waiting?.postMessage('attiva');
  attivaInAttesa();
  registrazione.addEventListener('updatefound', () => {
    const nuovo = registrazione.installing;
    nuovo?.addEventListener('statechange', () => {
      if (nuovo.state === 'installed' && navigator.serviceWorker.controller && !toccato) attivaInAttesa();
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    attivaInAttesa();
    registrazione.update().catch(() => {});
  });
}

async function avvia() {
  if (!apertaDallIcona()) {
    mostra(schermataApriDallIcona());
    return;
  }
  chiediConservazione();
  const archivio = await apriArchivio();
  const fase = (await archivio.leggiStato('fase')) ?? 'configurazione';

  if (fase === 'configurazione') {
    const salvata = await archivio.leggiStato(CHIAVE_BOZZA);
    const bozza = salvata ? completaBozza(salvata) : null;
    mostra(schermataBenvenuto({
      bozza,
      alInizio: async () => {
        if (servePinPerRiprendere(bozza) && !(await pinPerRiprendere(bozza.genitori))) return;
        try {
          mostra(creaProcedura({
            archivio,
            bozza: bozza ?? nuovaBozza(),
            alAvvio: async (completa) => {
              await avviaSettimana0(archivio, completa);
              window.scrollTo({ top: 0 });
              await mostraAreaChiusa(archivio);
            },
          }));
        } catch (errore) {
          mostraErrore(errore);
        }
      },
    }));
    return;
  }

  if (fase === 'settimana0') await mostraAreaChiusa(archivio);
}

// Area della bambina "chiusa": un gesto discreto porta all'accesso dei genitori (RF-G01).
// All'apertura si aggiornano le stelline automatiche di oggi e le scadenze (RN-05, RN-06).
async function mostraAreaChiusa(archivio) {
  chiudiFinestre();
  const { oggi, versioni } = await caricaConfigurazione(archivio);
  await aggiornaGiornata(archivio, versioni, oggi);
  mostra(schermataAreaChiusa({ alAccesso: () => mostraAccesso(archivio) }));
}

// Le schede e i tastierini aperti sopra la pagina si chiudono quando la sessione finisce.
function chiudiFinestre() {
  for (const finestra of document.querySelectorAll('.scheda-sfondo, .pin-sfondo')) finestra.remove();
  document.body.classList.remove('bloccato');
}

async function mostraAccesso(archivio) {
  const { ultima } = await caricaConfigurazione(archivio);
  if (!ultima?.genitori?.length) {
    mostraErrore(new Error(testi.areaGenitori.nonTrovata));
    return;
  }
  const torna = () => mostraAreaChiusa(archivio);
  // Anche la schermata del PIN torna all'area della bambina dopo 2 minuti senza tocchi.
  const attesa = avviaSessione({ alScadere: torna });
  mostra(schermataAccesso({
    genitori: ultima.genitori,
    ultimoId: await archivio.leggiStato('ultimoGenitore'),
    alRitorno: () => { attesa.chiudi(); torna(); },
    alAccesso: async (genitore) => {
      attesa.chiudi();
      await archivio.scriviStato('ultimoGenitore', genitore.id);
      await mostraAreaGenitori(archivio, genitore);
    },
  }));
}

// Area genitori: si chiude dopo 2 minuti senza tocchi, o con "Esci" (sezione 3, CT-18).
async function mostraAreaGenitori(archivio, genitore) {
  const { oggi, versioni } = await caricaConfigurazione(archivio);
  await aggiornaGiornata(archivio, versioni, oggi);
  const sessione = avviaSessione({ alScadere: () => mostraAreaChiusa(archivio) });
  window.scrollTo({ top: 0 });
  mostra(await creaAreaGenitori({
    archivio,
    genitore,
    inizio: await archivio.leggiStato('inizioSettimana0'),
    alUscita: () => { sessione.chiudi(); mostraAreaChiusa(archivio); },
  }));
}

// Chiede il PIN di uno dei due genitori finché è giusto; false se si annulla.
async function pinPerRiprendere(genitori) {
  let messaggio = '';
  for (;;) {
    const pin = await chiediPin({ titolo: testi.benvenuto.pinTitolo, aiuto: testi.benvenuto.pinSpiegazione, messaggio });
    if (pin == null) return false;
    if (await genitoreDelPin(pin, genitori)) return true;
    messaggio = testi.benvenuto.pinSbagliato;
  }
}

// Se qualcosa va storto lo si dice, invece di lasciare lo schermo fermo.
function mostraErrore(errore) {
  mostra(crea('main', { class: 'schermo schermo-centrato' }, [
    crea('h1', {}, testi.stato.erroreTitolo),
    crea('p', { class: 'testo-grande' }, testi.stato.erroreSpiegazione),
    crea('p', { class: 'nota' }, String(errore?.message ?? errore)),
  ]));
}
window.addEventListener('error', (evento) => mostraErrore(evento.error ?? evento.message));
window.addEventListener('unhandledrejection', (evento) => mostraErrore(evento.reason));

avviaServiceWorker().catch(() => {});
avvia().catch(mostraErrore);
