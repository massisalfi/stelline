// Configurazione, passo 11: riepilogo e validazione (sezione 4), con il pulsante "Avvia la settimana 0".

import { crea } from '../componenti/dom.js';
import { pulsante, sezione } from '../componenti/moduli.js';
import { chiediConferma } from '../componenti/finestre.js';
import { riepilogo, numeri } from '../../regole/riepilogo.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.riepilogo;
const titoli = testi.configurazione.titoli;

function testoDi(voce, bozza) {
  if (voce.codice === 'passo-da-correggere') return t.passoDaCorreggere(voce.passo, titoli[voce.passo], voce.quanti);
  const nomeTipo = (id) => bozza.tipiGiorno.find((tipo) => tipo.id === id)?.nome ?? id;
  return t.messaggi[voce.codice]?.(voce, nomeTipo) ?? voce.codice;
}

function elenco(titolo, voci, classe, ctx) {
  return crea('section', { class: `scheda elenco-riepilogo ${classe}`, role: classe === 'errori' ? 'alert' : null }, [
    crea('h2', {}, titolo),
    ...voci.map((voce) => crea('div', { class: 'voce-riepilogo' }, [
      crea('p', {}, testoDi(voce, ctx.bozza)),
      voce.passo ? pulsante(t.vaiAlPasso(voce.passo), () => ctx.vaiA(voce.passo)) : null,
    ])),
  ]);
}

function scheda(titolo, righe, passo, ctx) {
  return crea('section', { class: 'scheda scheda-riepilogo' }, [
    crea('div', { class: 'testata-riepilogo' }, [
      crea('h2', {}, titolo),
      pulsante(t.modifica, () => ctx.vaiA(passo), { classe: 'leggero' }),
    ]),
    crea('ul', { class: 'righe-riepilogo' }, righe.map((r) => crea('li', {}, r))),
  ]);
}

export const passoRiepilogo = {
  senzaAvanti: true,

  disegna(ctx) {
    const b = ctx.bozza;
    const esito = riepilogo(b);
    const n = numeri(b);
    const v = t.voci;
    const categoria = b.economia.categorie.find((c) => c.id === b.economia.conversione.categoria)?.nome.toLowerCase() ?? '';
    const boss = b.stagioni.boss.tipo === 'percentuale'
      ? v.bossPercentuale(b.stagioni.boss.percentuale)
      : v.bossComportamento(b.comportamenti.find((c) => c.id === b.stagioni.boss.comportamento)?.nome ?? '—', b.stagioni.boss.giorni);

    const avvia = pulsante(t.avvia, async () => {
      const si = await chiediConferma({
        domanda: t.confermaDomanda, spiegazione: t.confermaSpiegazione, si: t.confermaSi, no: testi.comune.annulla,
      });
      if (!si) return;
      avvia.disabled = true;
      avvia.textContent = t.inCorso;
      await ctx.avvia();
    }, { classe: 'primario grande', disattivo: !esito.avviabile });

    return crea('div', { class: 'colonna' }, [
      esito.errori.length ? elenco(t.errori, esito.errori, 'errori', ctx) : null,
      esito.avvisi.length ? elenco(t.avvisi, esito.avvisi, 'avvisi', ctx) : null,
      esito.avviabile && !esito.avvisi.length ? crea('p', { class: 'esito ok' }, `✓ ${t.tuttoOk}`) : null,
      crea('div', { class: 'griglia-riepilogo' }, [
        scheda(t.sezioni.genitori, [v.genitori(b.genitori.map((g) => g.nome.trim()))], 1, ctx),
        scheda(t.sezioni.giocatrice, [v.giocatrice(b.giocatrice.nome.trim(), b.giocatrice.eta), v.voce(b.giocatrice.voce.attiva)], 2, ctx),
        scheda(t.sezioni.calendario, [
          v.tipi(b.tipiGiorno.length), v.eccezioni(n.eccezioni),
          v.revisione(testi.comune.giorno(b.revisione.giorno).toLowerCase(), b.revisione.ora),
        ], 3, ctx),
        scheda(t.sezioni.comportamenti, [v.comportamenti(n)], 4, ctx),
        scheda(t.sezioni.economia, [
          v.blocco(b.economia.conversione.stelline, b.economia.conversione.minuti, categoria),
          v.livello(b.economia.sogliaLivello), v.tetto(b.economia.tettoTotale),
        ], 6, ctx),
        scheda(t.sezioni.listino, [v.premi(n)], 7, ctx),
        scheda(t.sezioni.stagioni, [v.stagione(b.stagioni.settimane), boss], 8, ctx),
        scheda(t.sezioni.sorprese, [v.sorprese(b.sorprese.minimo, b.sorprese.massimo), v.backup(b.alert.a8.giorni)], 9, ctx),
      ]),
      sezione(t.avvia, [crea('div', { class: 'riga-avvio' }, [avvia])], t.avviaSpiegazione),
    ]);
  },
};
