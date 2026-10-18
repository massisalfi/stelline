// Avvio dell'app: service worker, richiesta di conservazione persistente, prima schermata.

import { VERSIONE } from './versione.js';
import { testi } from './testi/it.js';
import { crea } from './interfaccia/componenti/dom.js';
import { schermataBenvenuto } from './interfaccia/benvenuto.js';
import { schermataApriDallIcona } from './interfaccia/apri-dall-icona.js';
import { creaProcedura, CHIAVE_BOZZA } from './interfaccia/configurazione/procedura.js';
import { apriArchivio } from './dati/archivio.js';
import { avviaSettimana0 } from './dati/avvio.js';
import { schermataSettimana0 } from './interfaccia/settimana0.js';
import { nuovaBozza, completaBozza } from './regole/configurazione.js';

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
      alInizio: () => {
        try {
          mostra(creaProcedura({
            archivio,
            bozza: bozza ?? nuovaBozza(),
            alAvvio: async (completa) => {
              const { inizio } = await avviaSettimana0(archivio, completa);
              window.scrollTo({ top: 0 });
              mostra(schermataSettimana0({ inizio }));
            },
          }));
        } catch (errore) {
          mostraErrore(errore);
        }
      },
    }));
    return;
  }

  if (fase === 'settimana0') {
    mostra(schermataSettimana0({ inizio: await archivio.leggiStato('inizioSettimana0') }));
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
