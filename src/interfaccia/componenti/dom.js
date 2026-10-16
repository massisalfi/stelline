// Piccolo aiuto per creare elementi della pagina senza scrivere HTML come testo.
// Il testo viene sempre inserito come testo semplice, mai interpretato come HTML.

export function crea(tag, attributi = {}, figli = []) {
  const elemento = document.createElement(tag);
  for (const [nome, valore] of Object.entries(attributi)) {
    if (valore === false || valore == null) continue;
    if (nome.startsWith('on') && typeof valore === 'function') {
      elemento.addEventListener(nome.slice(2), valore);
    } else {
      elemento.setAttribute(nome, valore === true ? '' : String(valore));
    }
  }
  for (const figlio of [].concat(figli)) {
    if (figlio == null || figlio === false) continue;
    elemento.append(figlio instanceof Node ? figlio : document.createTextNode(String(figlio)));
  }
  return elemento;
}
