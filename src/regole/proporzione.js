// RN-14 Proporzione 70/30.
// In ogni momento i CA a scelta attivi sono il 30% dei CA attivi, arrotondato all'intero più vicino
// (le metà si arrotondano per eccesso: 5 CA attivi → 2 a scelta). Un CA laureato resta attivo
// finché non si sceglie il sostituto, quindi conta qui finché il suo stato è 'attivo'.

export function attivi(comportamenti) {
  return comportamenti.filter((c) => c.stato === 'attivo');
}

export function slotAScelta(numeroAttivi) {
  return Math.round((numeroAttivi * 3) / 10);
}

export function verificaProporzione(comportamenti) {
  const lista = attivi(comportamenti);
  const aScelta = lista.filter((c) => c.tipo === 'scelta').length;
  const richiesti = slotAScelta(lista.length);
  return { ok: aScelta === richiesti, attivi: lista.length, aScelta, richiesti };
}

// CA tra cui la bambina può scegliere: quelli a scelta e quelli del catalogo, non laureati.
// Perché la scelta sia reale devono essere almeno due in più degli slot (sezione 4, passo 5).
export function verificaCatalogo(comportamenti) {
  const disponibili = comportamenti.filter((c) =>
    (c.tipo === 'scelta' || c.tipo === 'catalogo') && c.stato !== 'laureato').length;
  const richiesti = slotAScelta(attivi(comportamenti).length) + 2;
  return { ok: disponibili >= richiesti, disponibili, richiesti };
}
