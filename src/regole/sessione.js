// Sessione dei genitori (requisiti, sezione 3 e RF-G01).
// Si entra dall'area della bambina con un gesto discreto, poi profilo e PIN; l'app propone
// l'ultimo profilo usato. La sessione si chiude dopo 2 minuti senza tocchi, anche durante il timer.

export const INATTIVITA_MASSIMA_MS = 2 * 60 * 1000;
export const PRESSIONE_PROLUNGATA_MS = 1500;

// Vero se dall'ultima attività sono passati più di 2 minuti (o se l'orologio è tornato indietro
// in modo strano: per prudenza la sessione si chiude).
export function sessioneScaduta(ultimaAttivita, adesso, limite = INATTIVITA_MASSIMA_MS) {
  const trascorso = adesso - ultimaAttivita;
  return trascorso > limite || trascorso < -60 * 1000;
}

// Il profilo da proporre all'accesso: l'ultimo usato, se esiste ancora; altrimenti il primo.
export function profiloProposto(genitori, ultimoId) {
  return genitori.find((g) => g.id === ultimoId) ?? genitori[0] ?? null;
}
