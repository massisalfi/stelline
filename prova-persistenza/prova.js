// Prova tecnica di conservazione dei dati su iPad (requisiti, sezione 13).
// Usa un archivio con un nome diverso da quello dell'app vera e non contiene dati personali.

const VERSIONE = 2;
const NOME_ARCHIVIO = 'prova-persistenza';
const MEGABYTE = 1024 * 1024;
const DIMENSIONE_FILE = 5 * MEGABYTE;

const $ = (id) => document.getElementById(id);

// --- Archivio IndexedDB -------------------------------------------------------

function apriArchivio() {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.open(NOME_ARCHIVIO, 1);
    richiesta.onupgradeneeded = () => richiesta.result.createObjectStore('dati');
    richiesta.onsuccess = () => risolvi(richiesta.result);
    richiesta.onerror = () => rifiuta(richiesta.error);
  });
}

async function leggi(chiave) {
  const db = await apriArchivio();
  return new Promise((risolvi, rifiuta) => {
    const richiesta = db.transaction('dati').objectStore('dati').get(chiave);
    richiesta.onsuccess = () => { db.close(); risolvi(richiesta.result); };
    richiesta.onerror = () => { db.close(); rifiuta(richiesta.error); };
  });
}

async function scrivi(chiave, valore) {
  const db = await apriArchivio();
  return new Promise((risolvi, rifiuta) => {
    const tx = db.transaction('dati', 'readwrite');
    tx.objectStore('dati').put(valore, chiave);
    tx.oncomplete = () => { db.close(); risolvi(); };
    tx.onerror = () => { db.close(); rifiuta(tx.error); };
  });
}

function cancellaArchivio() {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.deleteDatabase(NOME_ARCHIVIO);
    richiesta.onsuccess = () => risolvi();
    richiesta.onerror = () => rifiuta(richiesta.error);
    richiesta.onblocked = () => risolvi();
  });
}

// --- Utilità ------------------------------------------------------------------

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

// --- Stato a schermo ----------------------------------------------------------

async function mostraStato() {
  const prova = await leggi('prova');
  const aperture = (await leggi('aperture')) || [];

  const esito = $('esito');
  esito.classList.remove('si', 'no');
  if (prova) {
    const integro = (await impronta(prova.file)) === prova.impronta;
    esito.classList.add(integro ? 'si' : 'no');
    $('esito-titolo').textContent = integro ? 'Dato di prova presente' : 'Dato presente ma danneggiato';
    $('esito-dettaglio').textContent =
      `Salvato il ${dataOra(prova.salvatoIl)}. File da ${mb(prova.file.size)} ${integro ? 'integro' : 'NON integro'}.`;
  } else {
    esito.classList.add('no');
    $('esito-titolo').textContent = 'Nessun dato di prova';
    $('esito-dettaglio').textContent = aperture.length > 1
      ? 'Il dato non c\'è, ma risultano aperture precedenti.'
      : 'Premete "Salva il dato di prova" per iniziare.';
  }

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
  righe.push(['Aperture registrate', String(aperture.length)]);
  righe.push(['Connessione', navigator.onLine ? 'presente' : 'assente (offline)']);

  $('stato').replaceChildren(...righe.flatMap(([etichetta, valore]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = etichetta;
    dd.textContent = valore;
    return [dt, dd];
  }));

  $('aperture').replaceChildren(...aperture.slice().reverse().map((a) => {
    const li = document.createElement('li');
    li.textContent = `${dataOra(a.quando)} — ${a.come}, versione ${a.versione}`;
    return li;
  }));
}

// --- Azioni -------------------------------------------------------------------

async function registraApertura() {
  const aperture = (await leggi('aperture')) || [];
  aperture.push({ quando: Date.now(), come: installata() ? 'app' : 'Safari', versione: VERSIONE });
  await scrivi('aperture', aperture);
}

async function salvaProva() {
  avvisa('Salvataggio in corso…');
  const file = fileCasuale(DIMENSIONE_FILE);
  await scrivi('prova', { salvatoIl: Date.now(), impronta: await impronta(file), file });
  avvisa('Dato di prova salvato.');
}

async function chiediPersistenza() {
  if (!navigator.storage?.persist) {
    avvisa('Questo browser non permette di chiedere la conservazione persistente.');
    return;
  }
  const concessa = await navigator.storage.persist();
  avvisa(concessa ? 'Conservazione persistente concessa.' : 'Il sistema non ha concesso la conservazione persistente.');
}

async function esporta() {
  const prova = await leggi('prova');
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
    aperture: (await leggi('aperture')) || [],
    file: await blobInBase64(prova.file),
  });
  const nome = `prova-dati-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([contenuto], nome, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      avvisa('Condivisione completata. Controllate il file nell\'app File.');
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
    await scrivi('prova', { salvatoIl: dati.salvatoIl, impronta: dati.impronta, file });
    const attuali = (await leggi('aperture')) || [];
    const unite = [...dati.aperture, ...attuali]
      .filter((a, i, tutte) => tutte.findIndex((b) => b.quando === a.quando) === i)
      .sort((a, b) => a.quando - b.quando);
    await scrivi('aperture', unite);
    avvisa('Importazione completata: il dato è integro.');
  } catch (errore) {
    avvisa(`Importazione non riuscita: ${errore.message}.`);
  }
  await mostraStato();
}

async function cancellaTutto() {
  if (!confirm('Cancellare tutti i dati della prova?')) return;
  if (!confirm('Confermate di nuovo: i dati della prova saranno eliminati.')) return;
  await cancellaArchivio();
  if ('serviceWorker' in navigator) {
    for (const registrazione of await navigator.serviceWorker.getRegistrations()) {
      await registrazione.unregister();
    }
  }
  if ('caches' in window) {
    for (const nome of await caches.keys()) await caches.delete(nome);
  }
  avvisa('Dati cancellati. Ora potete eliminare l\'icona dalla schermata Home.');
  $('esito').classList.remove('si');
  $('esito').classList.add('no');
  $('esito-titolo').textContent = 'Dati della prova cancellati';
  $('esito-dettaglio').textContent = '';
  for (const pulsante of document.querySelectorAll('button')) pulsante.disabled = true;
}

// --- Avvio --------------------------------------------------------------------

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
  await registraApertura();
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
    await navigator.storage.persist();
  }
  await mostraStato();
})().catch((errore) => avvisa(`Errore all'avvio: ${errore.message}`));
