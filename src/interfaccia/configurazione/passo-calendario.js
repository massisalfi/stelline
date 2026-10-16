// Configurazione, passo 3: tipi di giorno, settimana tipo, eccezioni e revisione settimanale (sezione 4).

import { crea } from '../componenti/dom.js';
import { campoTesto, campoData, campoOra, selettore, pulsante, sezione } from '../componenti/moduli.js';
import {
  controllaCalendario, tipoEliminabile, nuovoIdTipo, COLORI_TIPI,
} from '../../regole/configurazione.js';
import { testi } from '../../testi/it.js';

const t = testi.configurazione.calendario;
const GIORNI = [1, 2, 3, 4, 5, 6, 7];

function opzioniTipi(bozza) {
  return bozza.tipiGiorno.map((tipo) => ({ valore: tipo.id, testo: tipo.nome.trim() || '…' }));
}

function campione(colore) {
  const elemento = crea('span', { class: 'campione', 'aria-hidden': 'true' });
  elemento.style.backgroundColor = colore;
  return elemento;
}

export const passoCalendario = {
  controlla: controllaCalendario,

  disegna(ctx) {
    const { bozza } = ctx;
    const contenitore = crea('div', { class: 'colonna' });

    // Il nome di un tipo compare anche nei menu: si aggiorna lì senza ridisegnare la pagina.
    const aggiornaMenu = (id, nome) => {
      for (const opzione of contenitore.querySelectorAll(`option[value="${CSS.escape(id)}"]`)) {
        opzione.textContent = nome.trim() || '…';
      }
    };

    const righeTipi = bozza.tipiGiorno.map((tipo, indice) => {
      const messaggio = crea('p', { class: 'campo-errore', hidden: true }, t.tipoInUso);
      const colore = pulsante(campione(tipo.colore), () => {
        const prossimo = COLORI_TIPI[(COLORI_TIPI.indexOf(tipo.colore) + 1) % COLORI_TIPI.length];
        ctx.modifica((b) => { b.tipiGiorno[indice].colore = prossimo; }, { ridisegna: true });
      }, { classe: 'pulsante-colore', etichetta: t.colore });
      return crea('div', { class: 'riga-tipo' }, [
        colore,
        campoTesto({
          etichetta: t.nomeTipo,
          valore: tipo.nome,
          maxlength: 24,
          errore: ctx.errore('nome-tipo-mancante', indice) ?? ctx.errore('nome-tipo-ripetuto', indice),
          alCambio: (valore) => {
            ctx.modifica((b) => { b.tipiGiorno[indice].nome = valore; });
            aggiornaMenu(tipo.id, valore);
          },
        }),
        pulsante(testi.comune.elimina, () => {
          if (!tipoEliminabile(ctx.bozza, tipo.id)) {
            messaggio.hidden = false;
            return;
          }
          ctx.modifica((b) => { b.tipiGiorno.splice(indice, 1); }, { ridisegna: true });
        }, { classe: 'leggero' }),
        messaggio,
      ]);
    });

    contenitore.append(
      crea('div', { class: 'griglia-due' }, [
        sezione(t.tipi, [
          ...righeTipi,
          ctx.errore('nessun-tipo') ? crea('p', { class: 'campo-errore' }, ctx.errore('nessun-tipo')) : null,
          pulsante(`+ ${t.aggiungiTipo}`, () => {
            ctx.modifica((b) => {
              b.tipiGiorno.push({
                id: nuovoIdTipo(b),
                nome: t.nuovoTipo,
                colore: COLORI_TIPI[b.tipiGiorno.length % COLORI_TIPI.length],
              });
            }, { ridisegna: true });
          }),
        ], t.tipiSpiegazione),
        sezione(t.settimana, GIORNI.map((giorno) => selettore({
          etichetta: testi.comune.giorno(giorno),
          valore: bozza.calendario.settimana[giorno],
          opzioni: opzioniTipi(bozza),
          errore: ctx.errore('giorno-senza-tipo', null, (e) => e.giorno === giorno),
          alCambio: (valore) => ctx.modifica((b) => { b.calendario.settimana[giorno] = valore; }),
        })).map((campo) => {
          campo.classList.add('campo-riga');
          return campo;
        }), t.settimanaSpiegazione),
      ]),
      sezione(t.eccezioni, [
        ...(bozza.calendario.eccezioni.length === 0 ? [crea('p', { class: 'nota' }, t.nessunaEccezione)] : []),
        ...bozza.calendario.eccezioni.map((eccezione, indice) => crea('div', { class: 'riga-eccezione' }, [
          campoTesto({
            area: 'nome',
            etichetta: t.nomeEccezione,
            valore: eccezione.nome ?? '',
            alCambio: (valore) => ctx.modifica((b) => { b.calendario.eccezioni[indice].nome = valore; }),
          }),
          campoData({
            area: 'dal',
            etichetta: t.dal,
            valore: eccezione.dal,
            errore: ctx.errore('eccezione-dal-mancante', indice),
            alCambio: (valore) => ctx.modifica((b) => { b.calendario.eccezioni[indice].dal = valore; }),
          }),
          campoData({
            area: 'al',
            etichetta: t.al,
            valore: eccezione.al ?? '',
            errore: ctx.errore('eccezione-al-prima-di-dal', indice) ?? ctx.errore('eccezione-al-non-valido', indice),
            alCambio: (valore) => ctx.modifica((b) => { b.calendario.eccezioni[indice].al = valore; }),
          }),
          selettore({
            area: 'tipo',
            etichetta: t.tipo,
            valore: eccezione.tipo,
            opzioni: opzioniTipi(bozza),
            errore: ctx.errore('eccezione-senza-tipo', indice),
            alCambio: (valore) => ctx.modifica((b) => { b.calendario.eccezioni[indice].tipo = valore; }),
          }),
          pulsante(testi.comune.elimina, () => {
            ctx.modifica((b) => { b.calendario.eccezioni.splice(indice, 1); }, { ridisegna: true });
          }, { classe: 'leggero area-elimina' }),
        ])),
        pulsante(`+ ${t.aggiungiEccezione}`, () => {
          ctx.modifica((b) => {
            b.calendario.eccezioni.push({ nome: '', dal: '', al: '', tipo: b.tipiGiorno.find((x) => x.id === 'festivo')?.id ?? b.tipiGiorno[0]?.id });
          }, { ridisegna: true });
        }),
      ], t.eccezioniSpiegazione),
      sezione(t.revisione, [
        crea('div', { class: 'riga-campi' }, [
          selettore({
            etichetta: t.giornoRevisione,
            valore: bozza.revisione.giorno,
            opzioni: GIORNI.map((g) => ({ valore: g, testo: testi.comune.giorno(g) })),
            errore: ctx.errore('revisione-giorno'),
            alCambio: (valore) => ctx.modifica((b) => { b.revisione.giorno = Number(valore); }),
          }),
          campoOra({
            etichetta: t.oraRevisione,
            valore: bozza.revisione.ora,
            errore: ctx.errore('revisione-ora'),
            alCambio: (valore) => ctx.modifica((b) => { b.revisione.ora = valore; }),
          }),
        ]),
      ], t.revisioneSpiegazione),
    );
    return contenitore;
  },
};
