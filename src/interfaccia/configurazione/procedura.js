// Configurazione iniziale guidata in 11 passi (sezione 4).
// Ogni modifica si salva da sola nella bozza, così la configurazione si interrompe e si riprende.

import { crea } from '../componenti/dom.js';
import { pulsante } from '../componenti/moduli.js';
import { passoGenitori } from './passo-genitori.js';
import { passoGiocatrice } from './passo-giocatrice.js';
import { passoCalendario } from './passo-calendario.js';
import { testi } from '../../testi/it.js';

export const TOTALE_PASSI = 11;
export const CHIAVE_BOZZA = 'bozzaConfigurazione';

const PASSI = {
  1: passoGenitori,
  2: passoGiocatrice,
  3: passoCalendario,
};
// Dove trovare in testi.configurazione la descrizione di ciascun passo.
const TESTI_PASSI = { 1: 'genitori', 2: 'giocatrice', 3: 'calendario' };

// I passi non ancora costruiti: si vedono, ma non si può andare oltre.
const passoInCostruzione = {
  inCostruzione: true,
  disegna: () => crea('section', { class: 'scheda' }, crea('p', {}, testi.configurazione.inCostruzione)),
};

export function creaProcedura({ archivio, bozza }) {
  const t = testi.configurazione;
  const schermo = crea('main', { class: 'schermo procedura' });
  let errori = [];
  let attesa = null;

  const salva = () => {
    clearTimeout(attesa);
    return archivio.scriviStato(CHIAVE_BOZZA, bozza);
  };
  const salvaTraPoco = () => {
    clearTimeout(attesa);
    attesa = setTimeout(salva, 300);
  };
  // Se l'app va in secondo piano mentre si scrive, si salva subito.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') salva();
  });

  const ctx = {
    bozza,
    modifica(cambia, { ridisegna = false } = {}) {
      cambia(bozza);
      salvaTraPoco();
      if (ridisegna) disegna();
    },
    // Testo dell'errore per un campo, se dopo "Avanti" quel campo è da correggere.
    errore(codice, indice, filtro) {
      const trovato = errori.find((e) => e.codice === codice
        && (indice == null || e.indice === indice)
        && (!filtro || filtro(e)));
      return trovato ? testi.errori[codice] : null;
    },
  };

  function vaiA(passo) {
    bozza.passo = passo;
    errori = [];
    salva();
    disegna();
    window.scrollTo({ top: 0 });
  }

  function avanti() {
    const passo = PASSI[bozza.passo];
    errori = passo?.controlla?.(bozza) ?? [];
    if (errori.length) {
      disegna();
      schermo.querySelector('.con-errore, .campo-errore')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    vaiA(Math.min(TOTALE_PASSI, bozza.passo + 1));
  }

  function disegna() {
    const n = bozza.passo;
    const passo = PASSI[n] ?? passoInCostruzione;
    const avanzamento = crea('ol', { class: 'avanzamento', 'aria-label': t.passoDi(n, TOTALE_PASSI) },
      Array.from({ length: TOTALE_PASSI }, (_, i) =>
        crea('li', { class: i + 1 < n ? 'fatto' : i + 1 === n ? 'attuale' : '' })));

    schermo.replaceChildren(...[
      crea('header', { class: 'intestazione-passo' }, [
        crea('p', { class: 'sopratitolo' }, t.passoDi(n, TOTALE_PASSI)),
        avanzamento,
        crea('h1', {}, t.titoli[n]),
        t[TESTI_PASSI[n]]?.descrizione ? crea('p', { class: 'descrizione' }, t[TESTI_PASSI[n]].descrizione) : null,
      ]),
      errori.length ? crea('p', { class: 'avviso-errori', role: 'alert' }, t.correggi) : null,
      passo.disegna(ctx),
      crea('nav', { class: 'navigazione-passi' }, [
        n > 1 ? pulsante(`‹ ${testi.comune.indietro}`, () => vaiA(n - 1)) : crea('span'),
        crea('p', { class: 'nota' }, t.salvataggioAutomatico),
        pulsante(`${testi.comune.avanti} ›`, avanti, { classe: 'primario', disattivo: Boolean(passo.inCostruzione) }),
      ]),
    ].filter(Boolean));
  }

  salva();
  disegna();
  return schermo;
}
