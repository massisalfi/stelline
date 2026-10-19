// Schermata Oggi e registrazione rapida (RF-G02, RF-G03): regole pure, senza schermo né archivio.
//
// Registrazione salvata: {
//   id, comportamento, giorno (di competenza), giornoRegistrazione, quando (istante), genitore,
//   eseguito, solleciti (numero o 'oltre'), stellinaAccettata, dubbio, nota,
//   valida, stelline (nel portafoglio), punti (esperienza), versioneConfigurazione
// }

import { effetti } from './registrazione.js';
import { accreditoDaRegistrazione } from './portafoglio.js';
import { stellineNelGiorno } from './giorno.js';

// Stato di un comportamento nella lista di Oggi (RF-G02).
//   'automatico' · 'da fare' · 'eseguito' · 'non eseguito' · 'rifiutata'
export function statoInOggi(statoGiorno, registrazione) {
  if (!registrazione) return statoGiorno === 'automatico' ? 'automatico' : 'da fare';
  if (!registrazione.valida) return 'non eseguito';
  return registrazione.stellinaAccettata === false ? 'rifiutata' : 'eseguito';
}

// Le scelte del genitore bastano per salvare? (RF-G03)
// Eseguito o no è obbligatorio; se eseguito servono anche i solleciti (0 è già proposto).
export function sceltePronte(scelte) {
  if (scelte.eseguito === false) return true;
  if (scelte.eseguito !== true) return false;
  return Number.isInteger(scelte.solleciti) || scelte.solleciti === 'oltre';
}

// Costruisce la registrazione e i movimenti che ne derivano, pronti per l'archivio.
// "giorno" è il giorno di competenza (oggi o ieri), "giornoRegistrazione" il giorno in cui si registra.
export function nuovaRegistrazione({
  id, comportamento, calendario, scelte, genitore, giorno, giornoRegistrazione, quando, versione,
}) {
  const eseguito = scelte.eseguito === true;
  const registrazione = {
    id,
    comportamento: comportamento.id,
    giorno,
    giornoRegistrazione,
    quando,
    genitore,
    eseguito,
    solleciti: eseguito ? scelte.solleciti : null,
    stellinaAccettata: eseguito ? scelte.stellinaAccettata !== false : null,
    dubbio: Boolean(scelte.dubbio),
    nota: (scelte.nota ?? '').trim(),
    versioneConfigurazione: versione,
  };
  const esito = effetti(registrazione, {
    massimoSolleciti: comportamento.massimoSolleciti,
    stelline: stellineNelGiorno(comportamento, giorno, calendario),
  });
  registrazione.valida = esito.valida;
  registrazione.stelline = esito.stellinePortafoglio;
  registrazione.punti = esito.puntiEsperienza;

  const movimenti = [];
  const accredito = accreditoDaRegistrazione(registrazione, esito, comportamento.validita);
  if (accredito) movimenti.push({ id: `${id}-stelline`, ...accredito });
  const punti = esito.puntiEsperienza > 0
    ? [{ id: `${id}-punti`, giorno: giornoRegistrazione, quantita: esito.puntiEsperienza, origine: { registrazione: id } }]
    : [];
  return { registrazione, movimenti, punti };
}

// Minuti di schermo già riscattati oggi per categoria, per la testata di Oggi.
export function minutiPerCategoria(categorie, minutiOggi) {
  return categorie.map((c) => ({ id: c.id, nome: c.nome, usati: minutiOggi[c.id] ?? 0, limite: c.limite }));
}
