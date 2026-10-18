// Libreria di icone originali per i premi del listino (risorse/icone/premi).

export const ICONE_PREMI = [
  { id: 'televisore', etichetta: 'Cartoni' },
  { id: 'joystick', etichetta: 'Videogioco' },
  { id: 'dado', etichetta: 'Gioco da tavolo' },
  { id: 'regalo', etichetta: 'Regalo' },
  { id: 'foto', etichetta: 'Foto' },
  { id: 'corona', etichetta: 'Corona' },
  { id: 'biglietto', etichetta: 'Biglietto' },
  { id: 'palloncino', etichetta: 'Festa' },
  { id: 'trofeo', etichetta: 'Trofeo' },
  { id: 'pennello', etichetta: 'Disegno' },
  { id: 'musica', etichetta: 'Musica' },
  { id: 'stella', etichetta: 'Stella' },
];

export function percorsoIconaPremio(id) {
  return `risorse/icone/premi/${id}.svg`;
}
