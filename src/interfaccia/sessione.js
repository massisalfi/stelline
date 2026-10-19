// Sessione dei genitori: si chiude dopo 2 minuti senza tocchi (sezione 3, CT-18),
// anche se l'iPad va in standby o l'app resta in secondo piano.

import { sessioneScaduta } from '../regole/sessione.js';

export function avviaSessione({ alScadere, adesso = () => Date.now() }) {
  let ultimaAttivita = adesso();
  let chiusa = false;
  const attivita = () => { ultimaAttivita = adesso(); };
  const controlla = () => {
    if (!chiusa && sessioneScaduta(ultimaAttivita, adesso())) {
      chiudi();
      alScadere();
    }
  };
  const alRitorno = () => { if (document.visibilityState === 'visible') controlla(); };
  const eventi = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  for (const e of eventi) window.addEventListener(e, attivita, { capture: true, passive: true });
  document.addEventListener('visibilitychange', alRitorno);
  const intervallo = setInterval(controlla, 5000);

  function chiudi() {
    chiusa = true;
    clearInterval(intervallo);
    for (const e of eventi) window.removeEventListener(e, attivita, { capture: true });
    document.removeEventListener('visibilitychange', alRitorno);
  }
  return { chiudi };
}
