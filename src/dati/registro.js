// Registrazioni e registro delle stelline e dei punti nell'archivio (RF-G03, RN-06).

import { movimentiDellaGiornata } from '../regole/giornata.js';
import { versioneDelGiorno } from '../regole/versioni.js';
import { giornoPrima } from '../regole/date.js';

// Alla prima apertura della giornata: stelline automatiche di oggi e scadenze dei giorni passati.
export async function aggiornaGiornata(archivio, versioni, oggi, pause = []) {
  const movimenti = await archivio.tutti('movimentiStelline');
  const nuovi = movimentiDellaGiornata({
    oggi,
    configurazioneOggi: versioneDelGiorno(oggi, versioni)?.contenuto,
    configurazioneIeri: versioneDelGiorno(giornoPrima(oggi), versioni)?.contenuto,
    movimenti,
    pause,
  });
  if (nuovi.length) await archivio.scriviInsieme(nuovi.map((record) => ({ contenitore: 'movimentiStelline', record })));
  return nuovi;
}

export async function datiDelGiorno(archivio, giorno) {
  return {
    registrazioni: await archivio.delGiorno('registrazioni', giorno),
    movimenti: await archivio.delGiorno('movimentiStelline', giorno),
    riscatti: await archivio.delGiorno('riscatti', giorno),
  };
}

// Registrazione, stelline e punti si salvano insieme: o tutto, o niente.
export async function salvaRegistrazione(archivio, { registrazione, movimenti, punti }) {
  await archivio.scriviInsieme([
    { contenitore: 'registrazioni', record: registrazione },
    ...movimenti.map((record) => ({ contenitore: 'movimentiStelline', record })),
    ...punti.map((record) => ({ contenitore: 'movimentiPunti', record })),
  ]);
}

// Annulla dei primi 10 secondi (RF-G03): la registrazione sparisce del tutto, senza lasciare traccia.
export async function annullaRegistrazione(archivio, { registrazione, movimenti, punti }) {
  await archivio.scriviInsieme([
    { contenitore: 'registrazioni', elimina: registrazione.id },
    ...movimenti.map((m) => ({ contenitore: 'movimentiStelline', elimina: m.id })),
    ...punti.map((p) => ({ contenitore: 'movimentiPunti', elimina: p.id })),
  ]);
}
