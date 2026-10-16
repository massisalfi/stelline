// Libreria di icone originali per i comportamenti (risorse/icone/comportamenti).
// Il disegno a mano delle icone arriverà con l'editor di disegno (M2, RF-B08).

export const ICONE_COMPORTAMENTI = [
  { id: 'giochi', etichetta: 'Giochi' },
  { id: 'sapone', etichetta: 'Sapone' },
  { id: 'scarpe', etichetta: 'Scarpe' },
  { id: 'vestiti', etichetta: 'Vestiti' },
  { id: 'pigiama', etichetta: 'Pigiama' },
  { id: 'zaino', etichetta: 'Zaino' },
  { id: 'piatto', etichetta: 'Piatto e posate' },
  { id: 'tavola', etichetta: 'Tavola' },
  { id: 'acqua', etichetta: 'Bicchiere d\'acqua' },
  { id: 'spazzolino', etichetta: 'Spazzolino' },
  { id: 'doccia', etichetta: 'Doccia' },
  { id: 'letto', etichetta: 'Letto' },
  { id: 'sveglia', etichetta: 'Sveglia' },
  { id: 'clessidra', etichetta: 'Clessidra' },
  { id: 'porta', etichetta: 'Porta' },
  { id: 'libri', etichetta: 'Libri' },
  { id: 'colori', etichetta: 'Colori' },
  { id: 'pianta', etichetta: 'Pianta' },
  { id: 'pesce', etichetta: 'Pesce' },
  { id: 'zampa', etichetta: 'Animali' },
  { id: 'carrello', etichetta: 'Spesa' },
  { id: 'cesto', etichetta: 'Cesto della biancheria' },
  { id: 'sole', etichetta: 'Sole' },
  { id: 'luna', etichetta: 'Luna' },
];

export function percorsoIcona(id) {
  return `risorse/icone/comportamenti/${id}.svg`;
}

export function iconaEsiste(id) {
  return ICONE_COMPORTAMENTI.some((i) => i.id === id);
}
