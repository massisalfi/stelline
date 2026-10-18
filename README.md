# Stelline

Web app installabile per iPad: un sistema di token economy gamificato per una famiglia, con un'area per i genitori e un'area di gioco per una bambina che sta imparando a leggere.

- Funziona offline e si installa da Safari con "Aggiungi alla schermata Home".
- Nessun dato lascia il dispositivo: niente server, account, analytics o risorse esterne.
- Comportamenti, premi e regole si configurano nell'app al primo avvio; il repository non contiene dati personali.

## Struttura

- `index.html`, `manifest.webmanifest`, `sw.js`: l'app e il suo funzionamento offline.
- `src/regole/`: regole di calcolo pure, senza interfaccia, coperte da test.
- `src/dati/`: archivio locale (IndexedDB) e backup.
- `src/interfaccia/`: schermate dei genitori, della configurazione e della bambina.
- `src/testi/`: tutti i testi in italiano.
- `risorse/`: icone e suoni originali.
- `test/`: test automatici.

## Copia offline

Ogni file dell'app deve essere nell'elenco della copia offline in `sw.js`. Dopo aver aggiunto o tolto un file:

```bash
node strumenti/elenco-offline.js
```

Un test controlla che l'elenco sia completo.

## Compatibilità dei dati

Ogni nuova versione deve aprire i dati salvati da tutte le versioni precedenti. In `test/compatibilita/` c'è una fotografia dei dati salvati da ogni versione pubblicata (contenuti inventati), che non si modifica mai. Prima di ogni pubblicazione:

1. aumentare la versione in `src/versione.js` e `sw.js`;
2. `node strumenti/fotografia-dati.js` (fotografia della nuova versione);
3. `node strumenti/elenco-offline.js`;
4. `node --test` (tutti i test, compresi quelli di compatibilità);
5. aprire `verifiche/compatibilita.html` dal server locale: ogni schermata viene disegnata con i dati di ogni versione.

## Test

Servono Node.js 20 o successivo. Dalla cartella del progetto:

```bash
node --test
```

Sul Mac l'app si prova da un server locale (`localhost`). Lì la copia offline è spenta, così si vede subito il codice nuovo; si accende aggiungendo `?offline` all'indirizzo. Con `?safari` si vede la schermata che compare quando l'app è aperta in Safari invece che dall'icona.

Le verifiche che richiedono il browser (archivio IndexedDB) si eseguono aprendo `verifiche/archivio.html` dal server locale: usano un archivio separato, cancellato alla fine.

## Licenza

Codice e risorse grafiche originali. Eventuali librerie di terzi sono incluse con il loro file di licenza.
