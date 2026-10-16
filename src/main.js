// Avvio dell'app: service worker, richiesta di conservazione persistente, prima schermata.

import { VERSIONE } from './versione.js';
import { testi } from './testi/it.js';
import { crea } from './interfaccia/componenti/dom.js';
import { schermataBenvenuto } from './interfaccia/benvenuto.js';

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

mostra(schermataBenvenuto());
chiediConservazione();
avviaServiceWorker().catch(() => {});
