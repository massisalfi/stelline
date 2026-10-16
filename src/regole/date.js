// Giorni di calendario come testo "AAAA-MM-GG", in ora locale.
// Si lavora sempre con il giorno e mai con l'ora, così il cambio dell'ora legale non sposta nulla.

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

function parti(giorno) {
  const m = FORMATO.exec(giorno);
  if (!m) throw new Error(`Giorno non valido: ${giorno}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function formatta(anno, mese, giorno) {
  return `${String(anno).padStart(4, '0')}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
}

// Il giorno di calendario (ora locale) di un istante. RN-01: il giorno va dalle 00:00 alle 23:59.
export function giornoDi(istante) {
  const d = new Date(istante);
  return formatta(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function aggiungiGiorni(giorno, n) {
  const [a, m, g] = parti(giorno);
  const d = new Date(Date.UTC(a, m - 1, g + n));
  return formatta(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export const giornoDopo = (giorno) => aggiungiGiorni(giorno, 1);
export const giornoPrima = (giorno) => aggiungiGiorni(giorno, -1);

// Giorni da "da" ad "a" (positivo se "a" viene dopo).
export function differenzaGiorni(da, a) {
  const [a1, m1, g1] = parti(da);
  const [a2, m2, g2] = parti(a);
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86400000);
}

// 1 = lunedì … 7 = domenica.
export function giornoDellaSettimana(giorno) {
  const [a, m, g] = parti(giorno);
  const d = new Date(Date.UTC(a, m - 1, g)).getUTCDay();
  return d === 0 ? 7 : d;
}

// Vero se il giorno è nell'intervallo, estremi compresi. "al" assente = intervallo senza fine.
export function nellIntervallo(giorno, dal, al) {
  return giorno >= dal && (al == null || giorno <= al);
}

export function valido(giorno) {
  if (typeof giorno !== 'string' || !FORMATO.test(giorno)) return false;
  const [a, m, g] = parti(giorno);
  return aggiungiGiorni(giorno, 0) === formatta(a, m, g);
}
