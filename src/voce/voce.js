// Voce narrante: sintesi vocale italiana del sistema (RNF-08), che lavora sul dispositivo.
// Sull'iPad si possono scaricare voci italiane "Migliorate" o "Premium", molto più naturali
// di quelle di base: l'app le elenca e le preferisce.

export function disponibile() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Qualità di una voce, dal suo identificativo o dal nome: 'premium', 'migliorata' o 'base'.
export function qualitaVoce(voce) {
  const testo = `${voce.voiceURI ?? ''} ${voce.name ?? ''}`.toLowerCase();
  if (testo.includes('premium')) return 'premium';
  if (/enhanced|migliorat|avanzat/.test(testo)) return 'migliorata';
  return 'base';
}

const ORDINE_QUALITA = { premium: 0, migliorata: 1, base: 2 };

// Le voci italiane, dalla più naturale alla più semplice.
export function ordinaVoci(voci) {
  return voci
    .filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('it'))
    .sort((a, b) => ORDINE_QUALITA[qualitaVoce(a)] - ORDINE_QUALITA[qualitaVoce(b)]
      || a.name.localeCompare(b.name, 'it'));
}

export function vociItaliane() {
  return disponibile() ? ordinaVoci(window.speechSynthesis.getVoices()) : [];
}

// La voce scelta, se c'è ancora sul dispositivo; altrimenti la migliore disponibile.
export function voceDaUsare(idVoce) {
  const voci = vociItaliane();
  return voci.find((v) => v.voiceURI === idVoce) ?? voci[0] ?? null;
}

// Su iPad l'elenco delle voci arriva qualche istante dopo l'apertura.
export function attendiVoci(massimoMs = 1500) {
  if (!disponibile() || window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((risolvi) => {
    const fine = () => { window.speechSynthesis.removeEventListener('voiceschanged', fine); risolvi(); };
    window.speechSynthesis.addEventListener('voiceschanged', fine);
    setTimeout(fine, massimoMs);
  });
}

// Legge un testo.
//   velocita: 0.5–1.5 (1 = normale)   tono: 0.5–2 (1 = normale; più alto = più "da cartone")
//   volume: 0–100                      voce: identificativo della voce scelta
export function parla(testo, { velocita = 1, tono = 1, volume = 100, voce } = {}) {
  if (!disponibile()) return false;
  const scelta = voceDaUsare(voce);
  window.speechSynthesis.cancel();
  const frase = new SpeechSynthesisUtterance(testo);
  frase.lang = 'it-IT';
  if (scelta) frase.voice = scelta;
  frase.rate = velocita;
  frase.pitch = tono;
  frase.volume = Math.max(0, Math.min(1, volume / 100));
  window.speechSynthesis.speak(frase);
  return Boolean(scelta);
}
