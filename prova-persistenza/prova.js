// Prova tecnica di conservazione dei dati su iPad (requisiti, sezione 13).
// Usa archivi con nomi diversi da quelli dell'app vera e non contiene dati personali.
//
// Versione 3: lo stesso segno viene salvato in tre archivi diversi, per capire cosa si perde:
//   - "grande":   IndexedDB con un file da 5 MB (come un audio o un disegno);
//   - "testo":    IndexedDB con solo testo;
//   - "semplice": localStorage, l'archivio più elementare del browser.
// Ogni archivio tiene anche il proprio diario delle aperture; il service worker annota
// gli aggiornamenti nell'archivio "testo".

const VERSIONE = 3;
const NOME_ARCHIVIO = 'prova-persistenza';
const NOME_TESTO = 'prova-persistenza-testo';
const CHIAVE_SEMPLICE = 'prova-persistenza-semplice';
const MEGABYTE = 1024 * 1024;
const DIMENSIONE_FILE = 5 * MEGABYTE;

const $ = (id) => document.getElementById(id);

// --- IndexedDB ----------------------------------------------------------------

function apri(nome) {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.open(nome, 1);
    richiesta.onupgradeneeded = () => richiesta.result.createObjectStore('dati');
    richiesta.onsuccess = () => risolvi(richiesta.result);
    richiesta.onerror = () => rifiuta(richiesta.error);
  });
}

async function leggi(nome, chiave) {
  const db = await apri(nome);
  return new Promise((risolvi, rifiuta) => {
    const richiesta = db.transaction('dati').objectStore('dati').get(chiave);
    richiesta.onsuccess = () => { db.close(); risolvi(richiesta.result); };
    richiesta.onerror = () => { db.close(); rifiuta(richiesta.error); };
  });
}

async function scrivi(nome, chiave, valore) {
  const db = await apri(nome);
  return new Promise((risolvi, rifiuta) => {
    const tx = db.transaction('dati', 'readwrite');
    tx.objectStore('dati').put(valore, chiave);
    tx.oncomplete = () => { db.close(); risolvi(); };
    tx.onerror = () => { db.close(); rifiuta(tx.error); };
  });
}

function elimina(nome) {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.deleteDatabase(nome);
    richiesta.onsuccess = () => risolvi();
    richiesta.onerror = () => rifiuta(richiesta.error);
    richiesta.onblocked = () => risolvi();
  });
}

// --- localStorage ---------------------------------------------------------------

function leggiSemplice() {
  try {
    return JSON.parse(localStorage.getItem(CHIAVE_SEMPLICE)) || {};
  } catch {
    return {};
  }
}

function scriviSemplice(valore) {
  localStorage.setItem(CHIAVE_SEMPLICE, JSON.stringify(valore));
}

// --- Utilità --------------------------------------------------------------------

function dataOra(ms) {
  return new Date(ms).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}

function mb(byte) {
  return (byte / MEGABYTE).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' MB';
}

async function impronta(blob) {
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function fileCasuale(dimensione) {
  const byte = new Uint8Array(dimensione);
  for (let i = 0; i < dimensione; i += 65536) {
    crypto.getRandomValues(byte.subarray(i, Math.min(i + 65536, dimensione)));
  }
  return new Blob([byte], { type: 'application/octet-stream' });
}

async function blobInBase64(blob) {
  const byte = new Uint8Array(await blob.arrayBuffer());
  let testo = '';
  for (let i = 0; i < byte.length; i += 32768) {
    testo += String.fromCharCode.apply(null, byte.subarray(i, i + 32768));
  }
  return btoa(testo);
}

function base64InBlob(base64) {
  const testo = atob(base64);
  const byte = new Uint8Array(testo.length);
  for (let i = 0; i < testo.length; i++) byte[i] = testo.charCodeAt(i);
  return new Blob([byte], { type: 'application/octet-stream' });
}

function avvisa(testo) {
  $('messaggio').textContent = testo;
}

function installata() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function crea(tag, classe, testo) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (testo != null) elemento.textContent = testo;
  return elemento;
}

// --- Lettura dei tre archivi ------------------------------------------------------

// Ogni lettura è protetta: se un archivio dà errore, gli altri si leggono lo stesso.
async function rileva() {
  const stato = {};

  try {
    const prova = await leggi(NOME_ARCHIVIO, 'prova');
    stato.grande = {
      presente: !!prova,
      salvatoIl: prova?.salvatoIl,
      dimensione: prova?.file?.size,
      integro: prova ? (await impronta(prova.file)) === prova.impronta : false,
      aperture: (await leggi(NOME_ARCHIVIO, 'aperture')) || [],
    };
  } catch (errore) {
    stato.grande = { presente: false, errore: errore.message, aperture: [] };
  }

  try {
    const segno = await leggi(NOME_TESTO, 'segno');
    stato.testo = {
      presente: !!segno,
      salvatoIl: segno?.salvatoIl,
      aperture: (await leggi(NOME_TESTO, 'aperture')) || [],
      eventi: (await leggi(NOME_TESTO, 'eventi')) || [],
    };
  } catch (errore) {
    stato.testo = { presente: false, errore: errore.message, aperture: [], eventi: [] };
  }

  const semplice = leggiSemplice();
  stato.semplice = {
    presente: !!semplice.segno,
    salvatoIl: semplice.segno?.salvatoIl,
    aperture: semplice.aperture || [],
  };

  return stato;
}

async function registraApertura(stato) {
  const apertura = {
    quando: Date.now(),
    come: installata() ? 'app' : 'Safari',
    versione: VERSIONE,
    presenti: {
      grande: stato.grande.presente && stato.grande.integro,
      testo: stato.testo.presente,
      semplice: stato.semplice.presente,
    },
  };
  // Ogni scrittura è indipendente: un errore in un archivio non ferma le altre.
  await Promise.allSettled([
    scrivi(NOME_ARCHIVIO, 'aperture', [...stato.grande.aperture, apertura]),
    scrivi(NOME_TESTO, 'aperture', [...stato.testo.aperture, apertura]),
    (async () => {
      const semplice = leggiSemplice();
      scriviSemplice({ ...semplice, aperture: [...(semplice.aperture || []), apertura] });
    })(),
  ]);
}

// --- Stato a schermo ------------------------------------------------------------

function rigaArchivio(nome, archivio) {
  const ok = archivio.presente && archivio.integro !== false;
  let dettaglio;
  if (archivio.errore) dettaglio = `errore di lettura (${archivio.errore})`;
  else if (!archivio.presente) dettaglio = 'assente';
  else {
    dettaglio = `presente, salvato il ${dataOra(archivio.salvatoIl)}`;
    if (archivio.dimensione != null) {
      dettaglio += `, file da ${mb(archivio.dimensione)} ${archivio.integro ? 'integro' : 'NON integro'}`;
    }
  }
  const li = crea('li', ok ? 'si' : 'no');
  li.append(crea('span', 'segno', ok ? '✓' : '✗'), `${nome}: ${dettaglio}`);
  return li;
}

function testoApertura(a) {
  let testo = `${a.come}, versione ${a.versione}`;
  if (a.presenti) {
    const p = a.presenti;
    const sn = (v) => (v ? 'sì' : 'no');
    testo += ` — dati: grande ${sn(p.grande)} · testo ${sn(p.testo)} · semplice ${sn(p.semplice)}`;
  }
  return testo;
}

async function mostraStato() {
  const stato = await rileva();
  const { grande, testo, semplice } = stato;
  const tutti = [grande, testo, semplice];

  const esito = $('esito');
  esito.classList.remove('si', 'no');
  if (tutti.every((a) => a.presente && a.integro !== false)) {
    esito.classList.add('si');
    $('esito-titolo').textContent = 'Dato di prova presente in tutti e tre gli archivi';
  } else if (tutti.some((a) => a.presente)) {
    esito.classList.add('no');
    $('esito-titolo').textContent = 'Dato di prova presente solo in parte';
  } else {
    esito.classList.add('no');
    $('esito-titolo').textContent = 'Nessun dato di prova';
  }
  $('esito-archivi').replaceChildren(
    rigaArchivio('Archivio con file grande', grande),
    rigaArchivio('Archivio di solo testo', testo),
    rigaArchivio('Archivio semplice', semplice),
  );

  const righe = [
    ['Aperta come', installata() ? 'app dalla schermata Home' : 'pagina di Safari'],
    ['Conservazione persistente', navigator.storage?.persisted
      ? ((await navigator.storage.persisted()) ? 'concessa' : 'non concessa')
      : 'non disponibile'],
  ];
  if (navigator.storage?.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    righe.push(['Spazio usato', mb(usage)], ['Spazio disponibile', mb(quota)]);
  }
  righe.push(['Aperture registrate',
    `grande ${grande.aperture.length} · testo ${testo.aperture.length} · semplice ${semplice.aperture.length}`]);
  righe.push(['Connessione', navigator.onLine ? 'presente' : 'assente (offline)']);

  $('stato').replaceChildren(...righe.flatMap(([etichetta, valore]) => [
    crea('dt', null, etichetta),
    crea('dd', null, valore),
  ]));

  // Diario: le aperture dell'archivio che ne ricorda di più, più gli aggiornamenti.
  const aperture = tutti.map((a) => a.aperture).sort((a, b) => b.length - a.length)[0];
  const voci = [
    ...aperture.map((a) => ({ quando: a.quando, testo: testoApertura(a) })),
    ...testo.eventi.map((e) => ({ quando: e.quando, testo: e.testo, evento: true })),
  ].sort((a, b) => b.quando - a.quando);
  $('aperture').replaceChildren(...voci.map((v) =>
    crea('li', v.evento ? 'evento' : null, `${dataOra(v.quando)} — ${v.testo}`)));
}

// --- Azioni -----------------------------------------------------------------------

async function salvaProva() {
  avvisa('Salvataggio in corso…');
  const salvatoIl = Date.now();
  const file = fileCasuale(DIMENSIONE_FILE);
  await scrivi(NOME_ARCHIVIO, 'prova', { salvatoIl, impronta: await impronta(file), file });
  await scrivi(NOME_TESTO, 'segno', { salvatoIl, versione: VERSIONE });
  scriviSemplice({ ...leggiSemplice(), segno: { salvatoIl, versione: VERSIONE } });
  avvisa('Dato di prova salvato nei tre archivi.');
}

async function chiediPersistenza() {
  if (!navigator.storage?.persist) {
    avvisa('Questo browser non permette di chiedere la conservazione persistente.');
    return;
  }
  const concessa = await navigator.storage.persist();
  avvisa(concessa ? 'Conservazione persistente concessa.' : 'Il sistema non ha concesso la conservazione persistente.');
}

// Il file esportato ha un'estensione propria: l'app File non prova ad aprirlo come testo.
async function esporta() {
  const prova = await leggi(NOME_ARCHIVIO, 'prova');
  if (!prova) {
    avvisa('Non c\'è nessun dato da esportare.');
    return;
  }
  avvisa('Preparazione del file…');
  const contenuto = JSON.stringify({
    formato: NOME_ARCHIVIO,
    versione: VERSIONE,
    salvatoIl: prova.salvatoIl,
    impronta: prova.impronta,
    aperture: (await leggi(NOME_ARCHIVIO, 'aperture')) || [],
    file: await blobInBase64(prova.file),
  });
  const nome = `prova-dati-${new Date().toISOString().slice(0, 10)}.provadati`;
  const file = new File([contenuto], nome, { type: 'application/octet-stream' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      avvisa('Condivisione completata. Il file è nell\'app File: non serve aprirlo.');
    } catch (errore) {
      avvisa(errore.name === 'AbortError' ? 'Esportazione annullata.' : `Errore: ${errore.message}`);
    }
    return;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  avvisa('File scaricato (il foglio di condivisione non era disponibile).');
}

async function importa(evento) {
  const scelto = evento.target.files[0];
  evento.target.value = '';
  if (!scelto) return;
  avvisa('Lettura del file…');
  try {
    const dati = JSON.parse(await scelto.text());
    if (dati.formato !== NOME_ARCHIVIO) throw new Error('il file non è un backup di questa prova');
    const file = base64InBlob(dati.file);
    if ((await impronta(file)) !== dati.impronta) throw new Error('il file risulta danneggiato');
    await scrivi(NOME_ARCHIVIO, 'prova', { salvatoIl: dati.salvatoIl, impronta: dati.impronta, file });
    await scrivi(NOME_TESTO, 'segno', { salvatoIl: dati.salvatoIl, versione: dati.versione });
    scriviSemplice({ ...leggiSemplice(), segno: { salvatoIl: dati.salvatoIl, versione: dati.versione } });
    const attuali = (await leggi(NOME_ARCHIVIO, 'aperture')) || [];
    const unite = [...dati.aperture, ...attuali]
      .filter((a, i, tutte) => tutte.findIndex((b) => b.quando === a.quando) === i)
      .sort((a, b) => a.quando - b.quando);
    await scrivi(NOME_ARCHIVIO, 'aperture', unite);
    avvisa('Importazione completata: il dato è integro.');
  } catch (errore) {
    avvisa(`Importazione non riuscita: ${errore.message}.`);
  }
  await mostraStato();
}

async function cancellaTutto() {
  if (!confirm('Cancellare tutti i dati della prova?')) return;
  if (!confirm('Confermate di nuovo: i dati della prova saranno eliminati.')) return;
  await elimina(NOME_ARCHIVIO);
  await elimina(NOME_TESTO);
  localStorage.removeItem(CHIAVE_SEMPLICE);
  if ('serviceWorker' in navigator) {
    for (const registrazione of await navigator.serviceWorker.getRegistrations()) {
      if (registrazione.scope.includes('/prova-persistenza/')) await registrazione.unregister();
    }
  }
  if ('caches' in window) {
    for (const nome of await caches.keys()) {
      if (nome.startsWith('prova-persistenza-')) await caches.delete(nome);
    }
  }
  avvisa('Dati cancellati. Ora potete eliminare l\'icona dalla schermata Home.');
  $('esito').classList.remove('si');
  $('esito').classList.add('no');
  $('esito-titolo').textContent = 'Dati della prova cancellati';
  $('esito-archivi').replaceChildren();
  for (const pulsante of document.querySelectorAll('button')) pulsante.disabled = true;
}

// --- Avvio ------------------------------------------------------------------------

function collega(id, azione) {
  $(id).addEventListener('click', async () => {
    try {
      await azione();
    } catch (errore) {
      avvisa(`Errore: ${errore.message}`);
    }
    if (id !== 'cancella') await mostraStato();
  });
}

$('versione').textContent = `Versione ${VERSIONE}.`;
collega('salva', salvaProva);
collega('persistente', chiediPersistenza);
collega('esporta', esporta);
collega('cancella', cancellaTutto);
$('importa').addEventListener('change', importa);
window.addEventListener('online', mostraStato);
window.addEventListener('offline', mostraStato);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

(async () => {
  await registraApertura(await rileva());
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
    await navigator.storage.persist();
  }
  await mostraStato();
})().catch((errore) => avvisa(`Errore all'avvio: ${errore.message}`));
