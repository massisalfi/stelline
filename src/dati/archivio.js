// Archivio dei dati sull'iPad (IndexedDB). Nessun dato esce dal dispositivo.
// Ogni record ha un identificativo univoco e la data di modifica (RNF-13).
//
// Contenitori:
//   configurazioni     versioni della configurazione (chiave: numero)
//   registrazioni      registrazioni dei CA (indice per giorno di competenza)
//   movimentiStelline  registro delle stelline (indice per giorno del portafoglio)
//   movimentiPunti     registro dei punti esperienza
//   riscatti           premi riscattati (indice per giorno)
//   pause              periodi di pausa
//   stato              valori singoli: fase del gioco, bozza della configurazione, ultimo profilo…

export const NOME_ARCHIVIO = 'stelline';
const VERSIONE_SCHEMA = 1;

const CONTENITORI = {
  configurazioni: { keyPath: 'numero' },
  registrazioni: { keyPath: 'id', indici: ['giorno'] },
  movimentiStelline: { keyPath: 'id', indici: ['giorno'] },
  movimentiPunti: { keyPath: 'id' },
  riscatti: { keyPath: 'id', indici: ['giorno'] },
  pause: { keyPath: 'id' },
  stato: { keyPath: 'chiave' },
};

function promessa(richiesta) {
  return new Promise((risolvi, rifiuta) => {
    richiesta.onsuccess = () => risolvi(richiesta.result);
    richiesta.onerror = () => rifiuta(richiesta.error);
  });
}

function fine(transazione) {
  return new Promise((risolvi, rifiuta) => {
    transazione.oncomplete = () => risolvi();
    transazione.onerror = () => rifiuta(transazione.error);
    transazione.onabort = () => rifiuta(transazione.error ?? new Error('Operazione annullata'));
  });
}

function aggiorna(db, versionePrecedente) {
  // Versione 1: tutti i contenitori iniziali. Le versioni future aggiungeranno qui i loro passi,
  // senza mai cancellare dati esistenti.
  if (versionePrecedente < 1) {
    for (const [nome, { keyPath, indici = [] }] of Object.entries(CONTENITORI)) {
      const contenitore = db.createObjectStore(nome, { keyPath });
      for (const indice of indici) contenitore.createIndex(indice, indice);
    }
  }
}

function completa(record) {
  return {
    ...record,
    id: record.id ?? (record.numero == null && record.chiave == null ? crypto.randomUUID() : record.id),
    modificatoIl: Date.now(),
  };
}

export async function apriArchivio(nome = NOME_ARCHIVIO) {
  const richiesta = indexedDB.open(nome, VERSIONE_SCHEMA);
  richiesta.onupgradeneeded = (evento) => aggiorna(richiesta.result, evento.oldVersion);
  const db = await promessa(richiesta);
  // Se un'altra scheda aggiorna lo schema, questa si chiude invece di bloccarla.
  db.onversionchange = () => db.close();

  const archivio = {
    nome,

    async leggi(contenitore, chiave) {
      return promessa(db.transaction(contenitore).objectStore(contenitore).get(chiave));
    },

    async tutti(contenitore) {
      return promessa(db.transaction(contenitore).objectStore(contenitore).getAll());
    },

    async delGiorno(contenitore, giorno) {
      return promessa(db.transaction(contenitore).objectStore(contenitore).index('giorno').getAll(giorno));
    },

    // Salva più record in un'unica operazione: o vanno a buon fine tutti, o nessuno.
    // operazioni: [{ contenitore, record }] oppure [{ contenitore, elimina: chiave }]
    async scriviInsieme(operazioni) {
      const nomi = [...new Set(operazioni.map((o) => o.contenitore))];
      const transazione = db.transaction(nomi, 'readwrite');
      const finita = fine(transazione);
      let salvati;
      try {
        salvati = operazioni.map((o) => {
          const contenitore = transazione.objectStore(o.contenitore);
          if ('elimina' in o) {
            contenitore.delete(o.elimina);
            return null;
          }
          const record = completa(o.record);
          contenitore.put(record);
          return record;
        });
      } catch (errore) {
        // Un errore a metà annulla anche le scritture già avviate: niente dati a metà.
        transazione.abort();
        await finita.catch(() => {});
        throw errore;
      }
      await finita;
      return salvati;
    },

    async salva(contenitore, record) {
      const [salvato] = await archivio.scriviInsieme([{ contenitore, record }]);
      return salvato;
    },

    async elimina(contenitore, chiave) {
      await archivio.scriviInsieme([{ contenitore, elimina: chiave }]);
    },

    async leggiStato(chiave) {
      return (await archivio.leggi('stato', chiave))?.valore;
    },

    async scriviStato(chiave, valore) {
      await archivio.salva('stato', { chiave, valore });
    },

    chiudi() {
      db.close();
    },
  };
  return archivio;
}

// RF-G14: cancellazione totale (dopo PIN e doppia conferma, chieste dall'interfaccia).
export function cancellaArchivio(nome = NOME_ARCHIVIO) {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.deleteDatabase(nome);
    richiesta.onsuccess = () => risolvi();
    richiesta.onerror = () => rifiuta(richiesta.error);
    richiesta.onblocked = () => risolvi();
  });
}
