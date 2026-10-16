// Verifiche dell'archivio nel browser: IndexedDB non esiste in Node, quindi queste prove
// si eseguono aprendo verifiche/archivio.html. Usano un archivio separato, cancellato alla fine.

import { apriArchivio, cancellaArchivio } from '../src/dati/archivio.js';
import { nuovaVersione, versioneDelGiorno } from '../src/regole/versioni.js';

const NOME = 'stelline-verifica';
const risultati = [];

function uguale(attuale, atteso, descrizione) {
  const ok = JSON.stringify(attuale) === JSON.stringify(atteso);
  risultati.push({ ok, descrizione, dettaglio: ok ? '' : `atteso ${JSON.stringify(atteso)}, trovato ${JSON.stringify(attuale)}` });
}

async function verifica(descrizione, prova) {
  try {
    await prova();
  } catch (errore) {
    risultati.push({ ok: false, descrizione, dettaglio: `errore: ${errore.message}` });
  }
}

await cancellaArchivio(NOME);

await verifica('un record salvato si rilegge, con id e data di modifica', async () => {
  const a = await apriArchivio(NOME);
  const salvato = await a.salva('registrazioni', { giorno: '2026-10-12', comportamento: 'ca-1', eseguito: true });
  uguale(typeof salvato.id, 'string', 'id generato');
  uguale(typeof salvato.modificatoIl, 'number', 'data di modifica presente');
  const letto = await a.leggi('registrazioni', salvato.id);
  uguale(letto.comportamento, 'ca-1', 'record riletto');
  a.chiudi();
});

await verifica('i dati restano dopo aver chiuso e riaperto l\'archivio', async () => {
  const a = await apriArchivio(NOME);
  const tutte = await a.tutti('registrazioni');
  uguale(tutte.length, 1, 'una registrazione dopo la riapertura');
  a.chiudi();
});

await verifica('lettura per giorno', async () => {
  const a = await apriArchivio(NOME);
  await a.salva('movimentiStelline', { giorno: '2026-10-12', tipo: 'accredito', quantita: 1 });
  await a.salva('movimentiStelline', { giorno: '2026-10-13', tipo: 'accredito', quantita: 2 });
  await a.salva('movimentiStelline', { giorno: '2026-10-13', tipo: 'spesa', quantita: -1 });
  uguale((await a.delGiorno('movimentiStelline', '2026-10-13')).length, 2, 'due movimenti martedì');
  uguale((await a.delGiorno('movimentiStelline', '2026-10-14')).length, 0, 'nessun movimento mercoledì');
  a.chiudi();
});

await verifica('scrittura insieme: registrazione e movimento vanno salvati entrambi o nessuno', async () => {
  const a = await apriArchivio(NOME);
  const [reg, mov] = await a.scriviInsieme([
    { contenitore: 'registrazioni', record: { giorno: '2026-10-14', comportamento: 'ca-2' } },
    { contenitore: 'movimentiStelline', record: { giorno: '2026-10-14', tipo: 'accredito', quantita: 1 } },
  ]);
  uguale(Boolean(reg.id && mov.id), true, 'entrambi salvati');

  // Una scrittura con un errore (contenitore inesistente) non deve lasciare nulla a metà.
  let fallita = false;
  try {
    await a.scriviInsieme([
      { contenitore: 'registrazioni', record: { giorno: '2026-10-15', comportamento: 'ca-3' } },
      { contenitore: 'riscatti', record: { giorno: '2026-10-15', id: 42n } }, // chiave non valida
    ]);
  } catch {
    fallita = true;
  }
  uguale(fallita, true, 'la scrittura con errore viene rifiutata');
  uguale((await a.delGiorno('registrazioni', '2026-10-15')).length, 0, 'nessun dato a metà');
  a.chiudi();
});

await verifica('eliminazione di un record (per l\'Annulla)', async () => {
  const a = await apriArchivio(NOME);
  const r = await a.salva('registrazioni', { giorno: '2026-10-16', comportamento: 'ca-4' });
  await a.elimina('registrazioni', r.id);
  uguale(await a.leggi('registrazioni', r.id), undefined, 'record eliminato');
  a.chiudi();
});

await verifica('valori singoli dello stato', async () => {
  const a = await apriArchivio(NOME);
  await a.scriviStato('fase', 'configurazione');
  await a.scriviStato('ultimoGenitore', 'g1');
  uguale(await a.leggiStato('fase'), 'configurazione', 'fase');
  await a.scriviStato('fase', 'settimana0');
  uguale(await a.leggiStato('fase'), 'settimana0', 'fase aggiornata');
  uguale(await a.leggiStato('inesistente'), undefined, 'valore assente');
  a.chiudi();
});

await verifica('versioni della configurazione salvate e rilette: la modifica vale da domani', async () => {
  const a = await apriArchivio(NOME);
  const v1 = nuovaVersione([], { costoBlocco: 5 }, 'Genitore A', new Date(2026, 9, 10, 9).getTime());
  await a.salva('configurazioni', v1);
  const v2 = nuovaVersione(await a.tutti('configurazioni'), { costoBlocco: 6 }, 'Genitore B', new Date(2026, 9, 12, 15).getTime());
  await a.salva('configurazioni', v2);
  const versioni = await a.tutti('configurazioni');
  uguale(versioni.map((v) => v.numero), [1, 2], 'due versioni');
  uguale(versioneDelGiorno('2026-10-12', versioni).contenuto.costoBlocco, 5, 'oggi vale ancora la 1');
  uguale(versioneDelGiorno('2026-10-13', versioni).contenuto.costoBlocco, 6, 'domani vale la 2');
  a.chiudi();
});

await verifica('i file (come disegni e audio) si salvano e si rileggono integri', async () => {
  const a = await apriArchivio(NOME);
  const byte = new Uint8Array(256 * 1024).map((_, i) => i % 251);
  await a.scriviStato('fileProva', new Blob([byte]));
  const letto = new Uint8Array(await (await a.leggiStato('fileProva')).arrayBuffer());
  uguale(letto.length, byte.length, 'stessa dimensione');
  uguale(letto.every((v, i) => v === byte[i]), true, 'stesso contenuto');
  a.chiudi();
});

await verifica('cancellazione totale', async () => {
  await cancellaArchivio(NOME);
  const a = await apriArchivio(NOME);
  uguale((await a.tutti('registrazioni')).length, 0, 'archivio vuoto');
  a.chiudi();
});

await cancellaArchivio(NOME);

const falliti = risultati.filter((r) => !r.ok);
document.getElementById('riepilogo').textContent =
  `${risultati.length - falliti.length} verifiche superate su ${risultati.length}${falliti.length ? ' — ATTENZIONE' : ''}`;
document.getElementById('riepilogo').className = falliti.length ? 'ko' : 'ok';
document.getElementById('risultati').replaceChildren(...risultati.map((r) => {
  const li = document.createElement('li');
  li.className = r.ok ? 'ok' : 'ko';
  li.textContent = `${r.ok ? '✓' : '✗'} ${r.descrizione}${r.dettaglio ? ` (${r.dettaglio})` : ''}`;
  return li;
}));
window.esitoVerifiche = { superate: risultati.length - falliti.length, totali: risultati.length, falliti };
