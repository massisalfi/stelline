// Crea la "fotografia" dei dati salvati dalla versione attuale: test/compatibilita/<versione>.json.
// Uso, prima di ogni pubblicazione:  node strumenti/fotografia-dati.js
//
// Le fotografie delle versioni già pubblicate non si modificano mai (RNF-16): se il file esiste,
// lo strumento si ferma. Quando l'app salverà nuovi tipi di dati (registrazioni, movimenti, album…)
// questo strumento va esteso perché la fotografia li contenga tutti.

import { existsSync, writeFileSync } from 'node:fs';
import { VERSIONE } from '../src/versione.js';
import { nuovaBozza } from '../src/regole/configurazione.js';
import { importaModello, importaListino } from '../src/modello-esempio.js';
import { creaImpronta } from '../src/sicurezza/pin.js';
import { avvioSettimana0 } from '../src/regole/riepilogo.js';

const destinazione = new URL(`../test/compatibilita/${VERSIONE}.json`, import.meta.url);
if (existsSync(destinazione)) {
  console.log(`La fotografia della versione ${VERSIONE} esiste già e non si modifica.`);
  console.log('Se state preparando una versione nuova, aumentate prima VERSIONE in src/versione.js e sw.js.');
  process.exit(0);
}

// Dati inventati, come li inserirebbe un genitore arrivato al punto più avanzato della configurazione.
const bozza = nuovaBozza();
bozza.genitori[0].nome = 'Genitore di prova A';
bozza.genitori[0].pin = await creaImpronta('1111');
bozza.genitori[1].nome = 'Genitore di prova B';
bozza.genitori[1].pin = await creaImpronta('2222');
bozza.giocatrice.nome = 'Giocatrice di prova';
bozza.giocatrice.eta = 7;
bozza.giocatrice.voce.velocita = 0.9;
bozza.giocatrice.voce.tono = 1.3;
bozza.giocatrice.suoni.volume = 60;
bozza.tipiGiorno[3].nome = 'Vacanze';
bozza.tipiGiorno.push({ id: 'tipo-5', nome: 'Giorno dai nonni', colore: '#5c7a3a' });
bozza.calendario.settimana[6] = 'tipo-5';
bozza.calendario.eccezioni = [
  { nome: 'Vacanze di Natale', dal: '2026-12-23', al: '2027-01-06', tipo: 'vacanza' },
  { nome: 'Ponte', dal: '2026-12-08', al: '', tipo: 'festivo' },
];
bozza.revisione = { giorno: 7, ora: '19:30' };
importaModello(bozza);
importaListino(bozza);
// Anche il tipo di giorno aggiunto ha i suoi comportamenti, così la configurazione si può avviare.
for (const ca of bozza.comportamenti) ca.perTipo['tipo-5'] = { previsto: true, stelline: 1, automatica: false };
bozza.economia.categorie.push({ id: 'categoria-3', nome: 'Film', limite: 60, tolleranza: 70 });
bozza.economia.confermaRiscatto = 'schermo';
bozza.stagioni.boss = { tipo: 'comportamento', comportamento: bozza.comportamenti[0].id, giorni: 4, percentuale: 80 };
bozza.sorprese.contenuti.creature = false;
bozza.alert.a8.giorni = 10;
bozza.passo = 10;

// Gli stessi dati dopo "Avvia la settimana 0": prima versione della configurazione, fase, data di inizio.
const completa = structuredClone(bozza);
completa.passo = 11;
const { versione, inizio } = avvioSettimana0(completa, new Date(2026, 9, 19, 20, 0).getTime());

const fotografia = {
  versione: VERSIONE,
  descrizione: `Dati salvati dalla versione ${VERSIONE}, con contenuti inventati.`,
  // Durante la configurazione: la bozza.
  stato: { bozzaConfigurazione: bozza },
  // Dopo l'avvio della settimana 0: niente bozza, la configurazione salvata come versione.
  avviata: {
    stato: { fase: 'settimana0', inizioSettimana0: inizio, ultimoGenitore: 'genitore-2' },
    configurazioni: [versione],
  },
};
writeFileSync(destinazione, `${JSON.stringify(fotografia, null, 2)}\n`);
console.log(`Creata test/compatibilita/${VERSIONE}.json`);
