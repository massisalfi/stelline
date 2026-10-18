// Configurazione, passo 6: economia (sezione 4). Conversione stelline → minuti, soglia dei livelli,
// limiti di schermo per categoria, tetto totale, conferma del genitore al riscatto.

import { crea } from '../componenti/dom.js';
import { campoTesto, contatoreNumerico, selettore, sceltaPulsanti, pulsante, sezione } from '../componenti/moduli.js';
import { controllaEconomia } from '../../regole/configurazione-gioco.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.economia;

function nuovoIdCategoria(categorie) {
  let n = categorie.length + 1;
  while (categorie.some((c) => c.id === `categoria-${n}`)) n++;
  return `categoria-${n}`;
}

export const passoEconomia = {
  controlla: (bozza) => controllaEconomia(bozza.economia),

  disegna(ctx) {
    const e = ctx.bozza.economia;
    const contenitore = crea('div', { class: 'colonna' });
    const riassunto = crea('p', { class: 'riassunto', 'aria-live': 'polite' });
    const aggiornaRiassunto = () => {
      const categoria = e.categorie.find((c) => c.id === e.conversione.categoria)?.nome ?? '…';
      riassunto.textContent = t.riassuntoBlocco(e.conversione.stelline, e.conversione.minuti, categoria);
    };
    aggiornaRiassunto();
    const opzioniCategorie = () => e.categorie.map((c) => ({ valore: c.id, testo: c.nome.trim() || '…' }));

    const righeCategorie = e.categorie.map((categoria, indice) => {
      const messaggio = crea('p', { class: 'campo-errore', hidden: true }, t.categoriaInUso);
      return crea('div', { class: 'riga-categoria' }, [
        campoTesto({
          etichetta: t.nomeCategoria, valore: categoria.nome, maxlength: 24,
          errore: ctx.errore('categoria-nome-mancante', indice) ?? ctx.errore('categoria-nome-ripetuto', indice),
          alCambio: (v) => {
            ctx.modifica((b) => { b.economia.categorie[indice].nome = v; });
            for (const o of contenitore.querySelectorAll(`option[value="${CSS.escape(categoria.id)}"]`)) o.textContent = v.trim() || '…';
            aggiornaRiassunto();
          },
        }),
        contatoreNumerico({
          etichetta: t.limite, valore: categoria.limite, minimo: 0, massimo: 600, passo: 5, formato: t.minuti,
          errore: ctx.errore('categoria-limite', indice),
          alCambio: (n) => ctx.modifica((b) => { b.economia.categorie[indice].limite = n; }),
        }),
        contatoreNumerico({
          etichetta: t.tolleranza, valore: categoria.tolleranza, minimo: 0, massimo: 600, passo: 5, formato: t.minuti,
          errore: ctx.errore('categoria-tolleranza', indice),
          alCambio: (n) => ctx.modifica((b) => { b.economia.categorie[indice].tolleranza = n; }),
        }),
        pulsante(testi.comune.elimina, () => {
          const inUso = e.conversione.categoria === categoria.id || ctx.bozza.premi.some((p) => p.categoria === categoria.id);
          if (inUso) {
            messaggio.hidden = false;
            return;
          }
          ctx.modifica((b) => { b.economia.categorie.splice(indice, 1); }, { ridisegna: true });
        }, { classe: 'leggero' }),
        messaggio,
      ]);
    });

    contenitore.append(
      crea('div', { class: 'griglia-due' }, [
        sezione(t.conversione, [
          crea('div', { class: 'riga-campi' }, [
            contatoreNumerico({
              etichetta: t.stellinePerBlocco, valore: e.conversione.stelline, minimo: 1, massimo: 50,
              errore: ctx.errore('conversione-stelline'),
              alCambio: (n) => { ctx.modifica((b) => { b.economia.conversione.stelline = n; }); aggiornaRiassunto(); },
            }),
            contatoreNumerico({
              etichetta: t.minutiPerBlocco, valore: e.conversione.minuti, minimo: 5, massimo: 240, passo: 5, formato: t.minuti,
              errore: ctx.errore('conversione-minuti'),
              alCambio: (n) => { ctx.modifica((b) => { b.economia.conversione.minuti = n; }); aggiornaRiassunto(); },
            }),
          ]),
          selettore({
            etichetta: t.categoriaBlocco, valore: e.conversione.categoria, opzioni: opzioniCategorie(),
            errore: ctx.errore('conversione-categoria'),
            alCambio: (v) => { ctx.modifica((b) => { b.economia.conversione.categoria = v; }); aggiornaRiassunto(); },
          }),
          riassunto,
        ], t.conversioneSpiegazione),
        sezione(t.livello, [
          contatoreNumerico({
            valore: e.sogliaLivello, minimo: 5, massimo: 1000, passo: 5, formato: t.punti,
            errore: ctx.errore('soglia-livello'),
            alCambio: (n) => ctx.modifica((b) => { b.economia.sogliaLivello = n; }),
          }),
        ], t.livelloSpiegazione),
      ]),
      sezione(t.categorie, [
        ...righeCategorie,
        pulsante(`+ ${t.aggiungiCategoria}`, () => ctx.modifica((b) => {
          b.economia.categorie.push({ id: nuovoIdCategoria(b.economia.categorie), nome: t.nuovaCategoria, limite: 30, tolleranza: 35 });
        }, { ridisegna: true })),
      ], t.categorieSpiegazione),
      crea('div', { class: 'griglia-due' }, [
        sezione(t.tetto, [
          contatoreNumerico({
            valore: e.tettoTotale, minimo: 5, massimo: 900, passo: 5, formato: t.minuti,
            errore: ctx.errore('tetto-totale'),
            alCambio: (n) => ctx.modifica((b) => { b.economia.tettoTotale = n; }),
          }),
        ], t.tettoSpiegazione),
        sezione(t.conferma, [
          sceltaPulsanti({
            etichetta: t.conferma, valore: e.confermaRiscatto,
            opzioni: ['tutti', 'schermo', 'nessuno'].map((v) => ({ valore: v, testo: t.confermaOpzioni[v] })),
            alCambio: (v) => ctx.modifica((b) => { b.economia.confermaRiscatto = v; }),
          }),
        ], t.confermaSpiegazione),
      ]),
    );
    return contenitore;
  },
};
