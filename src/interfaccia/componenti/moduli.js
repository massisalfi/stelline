// Campi dei moduli con etichetta e messaggio d'errore, grandi abbastanza per il dito (RNF-08).

import { crea } from './dom.js';

let contatore = 0;
const nuovoId = () => `campo-${++contatore}`;

function classeCampo(errore, area) {
  return ['campo', errore ? 'con-errore' : '', area ? `area-${area}` : ''].filter(Boolean).join(' ');
}

function messaggioErrore(errore) {
  return errore ? crea('p', { class: 'campo-errore', role: 'alert' }, errore) : null;
}

export function campoTesto({ etichetta, valore = '', alCambio, errore, segnaposto, maxlength = 40, tipo = 'text', area }) {
  const id = nuovoId();
  const input = crea('input', {
    id, type: tipo, value: valore, placeholder: segnaposto, maxlength,
    autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false',
    'aria-invalid': errore ? 'true' : null,
  });
  input.addEventListener('input', () => alCambio(input.value));
  return crea('div', { class: classeCampo(errore, area) }, [
    crea('label', { for: id }, etichetta),
    input,
    messaggioErrore(errore),
  ]);
}

export function campoData({ etichetta, valore = '', alCambio, errore, area }) {
  const id = nuovoId();
  const input = crea('input', { id, type: 'date', value: valore, 'aria-invalid': errore ? 'true' : null });
  input.addEventListener('change', () => alCambio(input.value));
  return crea('div', { class: classeCampo(errore, area) }, [
    crea('label', { for: id }, etichetta),
    input,
    messaggioErrore(errore),
  ]);
}

export function campoOra({ etichetta, valore = '', alCambio, errore, area }) {
  const id = nuovoId();
  const input = crea('input', { id, type: 'time', value: valore, 'aria-invalid': errore ? 'true' : null });
  input.addEventListener('change', () => alCambio(input.value));
  return crea('div', { class: classeCampo(errore, area) }, [
    crea('label', { for: id }, etichetta),
    input,
    messaggioErrore(errore),
  ]);
}

// opzioni: [{ valore, testo }]
export function selettore({ etichetta, valore, opzioni, alCambio, errore, nascondiEtichetta = false, area }) {
  const id = nuovoId();
  const select = crea('select', { id, 'aria-invalid': errore ? 'true' : null },
    opzioni.map((o) => crea('option', { value: o.valore, selected: String(o.valore) === String(valore) }, o.testo)));
  select.addEventListener('change', () => alCambio(select.value));
  return crea('div', { class: classeCampo(errore, area) }, [
    crea('label', { for: id, class: nascondiEtichetta ? 'solo-lettori' : null }, etichetta),
    select,
    messaggioErrore(errore),
  ]);
}

export function interruttore({ etichetta, attivo, alCambio }) {
  const id = nuovoId();
  const input = crea('input', { id, type: 'checkbox', role: 'switch', checked: attivo, class: 'interruttore' });
  input.addEventListener('change', () => alCambio(input.checked));
  return crea('div', { class: 'campo campo-riga' }, [crea('label', { for: id }, etichetta), input]);
}

export function cursore({ etichetta, valore, minimo, massimo, passo, alCambio, sinistra, destra }) {
  const id = nuovoId();
  const input = crea('input', { id, type: 'range', min: minimo, max: massimo, step: passo, value: valore });
  input.addEventListener('input', () => alCambio(Number(input.value)));
  return crea('div', { class: 'campo' }, [
    crea('label', { for: id }, etichetta),
    crea('div', { class: 'cursore' }, [
      sinistra ? crea('span', { class: 'cursore-estremo' }, sinistra) : null,
      input,
      destra ? crea('span', { class: 'cursore-estremo' }, destra) : null,
    ]),
  ]);
}

export function pulsante(testo, alClic, { classe = '', disattivo = false, etichetta } = {}) {
  return crea('button', {
    class: `pulsante ${classe}`.trim(), type: 'button', disabled: disattivo,
    'aria-label': etichetta, onclick: alClic,
  }, testo);
}

export function sezione(titolo, figli, spiegazione) {
  return crea('section', { class: 'scheda' }, [
    crea('h2', {}, titolo),
    spiegazione ? crea('p', { class: 'nota' }, spiegazione) : null,
    ...figli,
  ]);
}
