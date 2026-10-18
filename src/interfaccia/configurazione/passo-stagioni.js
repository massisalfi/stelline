// Configurazione, passo 8: stagioni e boss (sezione 4). I premi del boss e raro vengono dal listino.

import { crea } from '../componenti/dom.js';
import { contatoreNumerico, sceltaPulsanti, selettore, sezione } from '../componenti/moduli.js';
import { controllaStagioni } from '../../regole/configurazione-gioco.js';
import { percorsoIconaPremio } from '../../risorse/icone-premi.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.stagioni;

function premiDi(premi, modalita, vuoto, extra = () => '') {
  const scelti = premi.filter((p) => p.modalita === modalita);
  if (!scelti.length) return [crea('p', { class: 'nota' }, vuoto)];
  return scelti.map((p) => crea('p', { class: 'premio-in-linea' }, [
    p.icona ? crea('img', { src: percorsoIconaPremio(p.icona), alt: '', width: 32, height: 32 }) : null,
    `${p.nome}${extra(p)}`,
  ]));
}

export const passoStagioni = {
  controlla: (bozza) => controllaStagioni(bozza.stagioni, bozza.comportamenti),

  disegna(ctx) {
    const { stagioni, comportamenti, premi } = ctx.bozza;
    const { boss } = stagioni;
    const attivi = comportamenti.filter((c) => c.stato === 'attivo');

    return crea('div', { class: 'colonna' }, [
      crea('div', { class: 'griglia-due' }, [
        sezione(t.durata, [
          contatoreNumerico({
            valore: stagioni.settimane, minimo: 4, massimo: 6, formato: t.settimane,
            errore: ctx.errore('stagione-settimane'),
            alCambio: (n) => ctx.modifica((b) => { b.stagioni.settimane = n; }),
          }),
        ], t.durataSpiegazione),
        sezione(t.premi, [
          crea('span', { class: 'etichetta' }, t.premioBoss),
          ...premiDi(premi, 'boss', t.nessunPremioBoss),
          crea('span', { class: 'etichetta' }, t.premioRaro),
          ...premiDi(premi, 'raro', t.nessunPremioRaro, (p) => ` (${testi.configurazione.listino.stagioni(p.ogniStagioni)})`),
        ]),
      ]),
      sezione(t.obiettivo, [
        sceltaPulsanti({
          etichetta: t.obiettivo, valore: boss.tipo,
          opzioni: ['percentuale', 'comportamento'].map((v) => ({ valore: v, testo: t.tipi[v] })),
          alCambio: (v) => ctx.modifica((b) => {
            b.stagioni.boss.tipo = v;
            if (v === 'comportamento' && !b.stagioni.boss.comportamento) b.stagioni.boss.comportamento = attivi[0]?.id ?? null;
          }, { ridisegna: true }),
        }),
        boss.tipo === 'percentuale'
          ? contatoreNumerico({
            etichetta: t.percentuale, valore: boss.percentuale, minimo: 50, massimo: 100, passo: 5, formato: t.percentualeValore,
            errore: ctx.errore('boss-percentuale'),
            alCambio: (n) => ctx.modifica((b) => { b.stagioni.boss.percentuale = n; }),
          })
          : crea('div', { class: 'colonna-stretta' }, [
            selettore({
              etichetta: t.comportamento, valore: boss.comportamento,
              opzioni: attivi.map((c) => ({ valore: c.id, testo: c.nome })),
              errore: ctx.errore('boss-comportamento'),
              alCambio: (v) => ctx.modifica((b) => { b.stagioni.boss.comportamento = v; }),
            }),
            contatoreNumerico({
              etichetta: t.giorni, valore: boss.giorni, minimo: 1, massimo: 7, formato: t.giorniValore,
              errore: ctx.errore('boss-giorni'),
              alCambio: (n) => ctx.modifica((b) => { b.stagioni.boss.giorni = n; }),
            }),
            crea('p', { class: 'nota' }, t.comportamentoSpiegazione),
          ]),
      ]),
    ]);
  },
};
