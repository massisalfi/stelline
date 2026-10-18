// PIN dei genitori (RNF-06): si conserva solo un'impronta cifrata, mai il PIN.
// L'impronta si calcola con PBKDF2-SHA-256 e un "sale" casuale diverso per ogni PIN,
// così due PIN uguali hanno impronte diverse e l'impronta non si inverte facilmente.

const ITERAZIONI = 100_000;

export function pinValido(pin) {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

function esadecimale(byte) {
  return Array.from(new Uint8Array(byte), (b) => b.toString(16).padStart(2, '0')).join('');
}

function daEsadecimale(testo) {
  return new Uint8Array(testo.match(/../g).map((h) => parseInt(h, 16)));
}

async function calcola(pin, sale, iterazioni) {
  const chiave = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bit = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: iterazioni }, chiave, 256);
  return esadecimale(bit);
}

// Restituisce { impronta, sale, iterazioni }: è ciò che si salva nell'archivio.
export async function creaImpronta(pin, sale = crypto.getRandomValues(new Uint8Array(16))) {
  if (!pinValido(pin)) throw new Error('Il PIN deve avere da 4 a 6 cifre');
  return { impronta: await calcola(pin, sale, ITERAZIONI), sale: esadecimale(sale), iterazioni: ITERAZIONI };
}

export async function verificaPin(pin, salvato) {
  if (!pinValido(pin) || !salvato?.impronta) return false;
  const calcolata = await calcola(pin, daEsadecimale(salvato.sale), salvato.iterazioni ?? ITERAZIONI);
  // Confronto a tempo costante: non rivela quante cifre iniziali sono giuste.
  let diverse = calcolata.length ^ salvato.impronta.length;
  for (let i = 0; i < calcolata.length; i++) diverse |= calcolata.charCodeAt(i) ^ salvato.impronta.charCodeAt(i);
  return diverse === 0;
}

// Il genitore a cui appartiene il PIN, oppure null. Serve per entrare dove occorre il PIN
// di uno dei due genitori, ad esempio per riprendere la configurazione.
export async function genitoreDelPin(pin, genitori) {
  for (const genitore of genitori) {
    if (genitore.pin?.impronta && await verificaPin(pin, genitore.pin)) return genitore;
  }
  return null;
}
