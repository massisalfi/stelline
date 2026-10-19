// Suoni dell'app, creati al momento con Web Audio: nessun file audio e nessun suono di terzi.
// Solo suoni allegri: nessun suono di errore o di allarme (sezione 10 dei requisiti).
// Safari suona solo dopo un tocco: preparaSuoni() va chiamata dentro il gestore del tocco.

export const PASSO_STELLINE_MS = 320;

// Note di una scala allegra (pentatonica), una per ogni stellina, dalla più bassa alla più alta.
const NOTE = [1046.5, 1318.5, 1568, 1760, 2093];

let contesto = null;

export function preparaSuoni() {
  const Contesto = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Contesto) return;
  try {
    contesto ??= new Contesto();
    if (contesto.state !== 'running') contesto.resume().catch(() => {});
  } catch {
    contesto = null;
  }
}

// Una nota di campanello: attacco rapido e coda morbida.
function campanello(frequenza, inizio, forza, durata = 0.9) {
  const inviluppo = contesto.createGain();
  inviluppo.gain.setValueAtTime(0.0001, inizio);
  inviluppo.gain.exponentialRampToValueAtTime(forza, inizio + 0.015);
  inviluppo.gain.exponentialRampToValueAtTime(0.0001, inizio + durata);
  inviluppo.connect(contesto.destination);
  for (const [multiplo, peso] of [[1, 1], [2.01, 0.3], [3, 0.08]]) {
    const oscillatore = contesto.createOscillator();
    const parziale = contesto.createGain();
    oscillatore.type = 'sine';
    oscillatore.frequency.value = frequenza * multiplo;
    parziale.gain.value = peso;
    oscillatore.connect(parziale).connect(inviluppo);
    oscillatore.start(inizio);
    oscillatore.stop(inizio + durata + 0.05);
  }
}

// Un campanello per ogni stellina, al ritmo dell'animazione, poi un piccolo luccichio finale.
//   suoni: { attivi, volume 0–100 } dalla configurazione (passo 2)
export function suonaStelline(quante, suoni) {
  if (!contesto || contesto.state !== 'running' || !suoni?.attivi || !(suoni.volume > 0)) return;
  const forza = 0.28 * Math.min(suoni.volume, 100) / 100;
  const partenza = contesto.currentTime + 0.12;
  const passo = PASSO_STELLINE_MS / 1000;
  for (let i = 0; i < quante; i++) campanello(NOTE[i % NOTE.length], partenza + i * passo, forza);
  const fine = partenza + quante * passo + 0.1;
  [2637, 3136, 3520].forEach((frequenza, i) => campanello(frequenza, fine + i * 0.07, forza * 0.35, 0.5));
}
