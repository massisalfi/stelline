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

## Test

Servono Node.js 20 o successivo. Dalla cartella del progetto:

```bash
node --test
```

## Licenza

Codice e risorse grafiche originali. Eventuali librerie di terzi sono incluse con il loro file di licenza.
