// Voce narrante: sintesi vocale italiana del sistema (RNF-08), che lavora sul dispositivo.

export function disponibile() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// La voce italiana del sistema, se c'è. Si preferisce una voce installata sul dispositivo.
export function voceItaliana() {
  if (!disponibile()) return null;
  const voci = window.speechSynthesis.getVoices();
  return voci.find((v) => v.lang === 'it-IT' && v.localService)
    ?? voci.find((v) => v.lang?.toLowerCase().startsWith('it'))
    ?? null;
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

// Legge un testo. velocita: 0.5–1.5 (1 = normale); volume: 0–100.
export function parla(testo, { velocita = 1, volume = 100 } = {}) {
  if (!disponibile()) return false;
  const voce = voceItaliana();
  window.speechSynthesis.cancel();
  const frase = new SpeechSynthesisUtterance(testo);
  frase.lang = 'it-IT';
  if (voce) frase.voice = voce;
  frase.rate = velocita;
  frase.volume = Math.max(0, Math.min(1, volume / 100));
  window.speechSynthesis.speak(frase);
  return Boolean(voce);
}
