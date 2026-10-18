// RNF-16: con i dati di ogni versione pubblicata si disegna ogni schermata della configurazione
// e ogni scheda dei comportamenti. Un errore qui è ciò che sull'iPad farebbe "bloccare" l'app.
// Si apre dal server locale: elenca le fotografie leggendo la cartella test/compatibilita/.

import { completaBozza } from '../src/regole/configurazione.js';
import { creaProcedura, PASSI, TOTALE_PASSI } from '../src/interfaccia/configurazione/procedura.js';
import { apriSchedaComportamento } from '../src/interfaccia/configurazione/scheda-comportamento.js';
import { apriSchedaPremio } from '../src/interfaccia/configurazione/scheda-premio.js';
import { schermataSettimana0 } from '../src/interfaccia/settimana0.js';

const risultati = [];
const palco = document.getElementById('palco');
const archivioFinto = { scriviStato: async () => {}, leggiStato: async () => undefined };

async function elencoFotografie() {
  const pagina = await (await fetch('test/compatibilita/')).text();
  return [...pagina.matchAll(/href="(\d+\.\d+\.\d+\.json)"/g)].map((m) => m[1]);
}

function prova(descrizione, azione) {
  try {
    azione();
    risultati.push({ ok: true, descrizione });
  } catch (errore) {
    risultati.push({ ok: false, descrizione, dettaglio: errore.message });
  }
}

for (const nome of await elencoFotografie()) {
  const fotografia = await (await fetch(`test/compatibilita/${nome}`)).json();
  if (fotografia.avviata) {
    prova(`${fotografia.versione}: schermata della settimana 0`, () => {
      palco.replaceChildren(schermataSettimana0({ inizio: fotografia.avviata.stato.inizioSettimana0 }));
    });
  }
  const salvata = fotografia.stato.bozzaConfigurazione;
  if (!salvata) {
    risultati.push({ ok: true, descrizione: `${fotografia.versione}: nessun dato salvato da aprire` });
    continue;
  }
  const bozza = completaBozza(salvata);

  for (let passo = 1; passo <= TOTALE_PASSI; passo++) {
    prova(`${fotografia.versione}: passo ${passo}${PASSI[passo] ? '' : ' (in costruzione)'}`, () => {
      const copia = structuredClone(bozza);
      copia.passo = passo;
      palco.replaceChildren(creaProcedura({ archivio: archivioFinto, bozza: copia }));
      PASSI[passo]?.controlla?.(copia);
    });
  }

  for (const ca of bozza.comportamenti) {
    prova(`${fotografia.versione}: scheda del comportamento «${ca.nome}»`, () => {
      apriSchedaComportamento({
        comportamento: ca, tipiGiorno: bozza.tipiGiorno, voce: {}, nuovo: false,
        alSalvataggio: () => {}, alEliminazione: () => {},
      });
      document.querySelector('.scheda-sfondo')?.remove();
      document.body.classList.remove('bloccato');
    });
  }

  for (const premio of bozza.premi) {
    prova(`${fotografia.versione}: scheda del premio «${premio.nome}»`, () => {
      apriSchedaPremio({
        premio, categorie: bozza.economia.categorie, nuovo: false,
        alSalvataggio: () => {}, alEliminazione: () => {},
      });
      document.querySelector('.scheda-sfondo')?.remove();
      document.body.classList.remove('bloccato');
    });
  }
}
palco.replaceChildren();

const falliti = risultati.filter((r) => !r.ok);
const riepilogo = document.getElementById('riepilogo');
riepilogo.textContent = `${risultati.length - falliti.length} verifiche superate su ${risultati.length}${falliti.length ? ' — ATTENZIONE' : ''}`;
riepilogo.className = falliti.length ? 'ko' : 'ok';
document.getElementById('risultati').replaceChildren(...risultati.map((r) => {
  const li = document.createElement('li');
  li.className = r.ok ? 'ok' : 'ko';
  li.textContent = `${r.ok ? '✓' : '✗'} ${r.descrizione}${r.dettaglio ? ` (${r.dettaglio})` : ''}`;
  return li;
}));
window.esitoVerifiche = { superate: risultati.length - falliti.length, totali: risultati.length, falliti };
