// Scheda di dettaglio di un comportamento (RF-G03, RF-G07): si apre toccando il nome nella lista di Oggi.
// Serve quando c'è qualcosa da annotare: solleciti, stellina rifiutata, dubbio, nota.
// Il caso più frequente non passa da qui: basta la stellina accanto al nome, con la conferma.
// Non c'è il «No»: se il comportamento non è stato fatto non si registra nulla.

import { crea } from '../componenti/dom.js';
import { sceltaPulsanti, interruttore, areaTesto, pulsante, sezione } from '../componenti/moduli.js';
import { apriScheda } from '../componenti/finestre.js';
import { sceltePredefinite } from '../../regole/oggi.js';
import { percorsoIcona } from '../../risorse/icone-comportamenti.js';
import { testi } from '../../testi/it.js';

const t = testi.oggi;

// alSalvataggio(scelte) salva e chiude; alDefinizione(testo) salva la definizione mancante.
export function apriSchedaRegistrazione({ comportamento: ca, suggerimenti, alSalvataggio, alDefinizione }) {
  const scelte = sceltePredefinite();
  let definizioneScritta = '';
  let definizioneSalvata = false;

  const salva = pulsante(t.salvaConStellina, async () => {
    salva.disabled = true;
    scheda.chiudi();
    await alSalvataggio({ ...scelte });
  }, { classe: 'primario' });

  const scheda = apriScheda({
    titolo: ca.nome,
    azioni: [crea('span'), crea('div', { class: 'azioni-destra' }, [pulsante(testi.comune.annulla, () => scheda.chiudi()), salva])],
  });

  const opzioniSolleciti = [
    ...Array.from({ length: ca.massimoSolleciti + 1 }, (_, n) => ({ valore: n, testo: String(n) })),
    { valore: 'oltre', testo: t.oltre(ca.massimoSolleciti) },
  ];

  // Il pulsante dice se la bambina riceve la stellina.
  function aggiornaSalva() {
    const conStellina = scelte.solleciti !== 'oltre' && scelte.stellinaAccettata;
    salva.textContent = conStellina ? t.salvaConStellina : t.salvaSenzaStellina;
  }

  function disegna() {
    const valida = scelte.solleciti !== 'oltre';
    aggiornaSalva();
    scheda.corpo.replaceChildren(...[
      crea('div', { class: 'testata-registrazione' }, [
        crea('img', { src: percorsoIcona(ca.icona ?? 'giochi'), alt: '', width: 64, height: 64 }),
        ca.definizione?.trim()
          ? crea('div', {}, [crea('span', { class: 'etichetta' }, t.cosaConta), crea('p', { class: 'nota' }, ca.definizione)])
          : null,
      ]),
      crea('p', { class: 'nota' }, t.dettaglioSpiegazione),
      sezione(t.solleciti, [
        sceltaPulsanti({
          etichetta: t.solleciti, valore: scelte.solleciti, opzioni: opzioniSolleciti, nascondiEtichetta: true,
          spiegazione: (v) => (v === 'oltre' ? t.oltreSpiegazione : ''),
          alCambio: (v) => { scelte.solleciti = v; disegna(); },
        }),
      ]),
      valida
        ? sezione(t.stellina, [
          sceltaPulsanti({
            etichetta: t.stellina, valore: scelte.stellinaAccettata ? 'accettata' : 'rifiutata', nascondiEtichetta: true,
            opzioni: [{ valore: 'accettata', testo: t.accettata }, { valore: 'rifiutata', testo: t.rifiutata }],
            spiegazione: (v) => (v === 'rifiutata' ? t.rifiutataSpiegazione : ''),
            alCambio: (v) => { scelte.stellinaAccettata = v === 'accettata'; aggiornaSalva(); },
          }),
        ])
        : null,
      sezione(t.dubbioENota, [
        interruttore({ etichetta: t.dubbio, attivo: scelte.dubbio, alCambio: (v) => { scelte.dubbio = v; disegna(); } }),
        scelte.dubbio ? crea('p', { class: 'nota' }, t.dubbioSpiegazione) : null,
        scelte.dubbio
          ? crea('div', { class: 'suggerimenti' }, [
            crea('span', { class: 'etichetta' }, t.suggerimenti),
            crea('ol', { class: 'istruzioni' }, suggerimenti.map((s) => crea('li', {}, s))),
          ])
          : null,
        // RF-G07: un dubbio su un comportamento senza definizione propone di scriverla.
        scelte.dubbio && !ca.definizione?.trim()
          ? crea('div', { class: 'proposta-definizione' }, [
            areaTesto({
              etichetta: t.senzaDefinizione, valore: definizioneScritta, righe: 3,
              segnaposto: testi.configurazione.comportamenti.definizioneEsempio,
              alCambio: (v) => { definizioneScritta = v; },
            }),
            definizioneSalvata
              ? crea('p', { class: 'esito ok' }, `✓ ${t.definizioneSalvata}`)
              : pulsante(t.salvaDefinizione, async () => {
                if (!definizioneScritta.trim()) return;
                await alDefinizione(definizioneScritta.trim());
                definizioneSalvata = true;
                disegna();
              }),
          ])
          : null,
        areaTesto({ etichetta: t.nota, valore: scelte.nota, righe: 2, segnaposto: t.notaEsempio, alCambio: (v) => { scelte.nota = v; } }),
      ]),
    ].filter(Boolean));
  }

  disegna();
}
