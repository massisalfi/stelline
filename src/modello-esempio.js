// Modello d'esempio, facoltativo: si importa solo su richiesta e poi si modifica (CT-01).
// Contenuti inventati e generici: nessun dato reale di una famiglia (CLAUDE.md, privacy).
// 7 comportamenti attivi (5 fissi e 2 a scelta, cioè il 30%) più 2 nel catalogo.

import { allineaAiTipi, statoDaTipo } from './regole/configurazione.js';

const ogniGiorno = (stelline = 1) => ({
  scuola: { previsto: true, stelline, automatica: false },
  weekend: { previsto: true, stelline, automatica: false },
  festivo: { previsto: true, stelline, automatica: false },
  vacanza: { previsto: true, stelline, automatica: false },
});

const soloScuola = (stelline = 1) => ({
  scuola: { previsto: true, stelline, automatica: false },
  weekend: { previsto: false, stelline, automatica: false },
  festivo: { previsto: false, stelline, automatica: false },
  vacanza: { previsto: false, stelline, automatica: false },
});

const base = {
  validita: 'oggi',
  automaticaSeDomaniNon: [],
  massimoSolleciti: 3,
  timer: null,
  laurea: { percentuale: 80, settimane: 3 },
};

export const MODELLO_ESEMPIO = [
  {
    ...base,
    nome: 'Piegare il pigiama',
    icona: 'pigiama',
    frase: 'Hai piegato il pigiama e l\'hai messo sotto il cuscino.',
    definizione: 'Conta se il pigiama è piegato e sotto il cuscino prima di uscire dalla camera. Aiuto ammesso: un adulto può ricordare dove va.',
    tipo: 'fisso',
    momento: 'mattina',
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Lavare le mani prima di pranzo',
    icona: 'sapone',
    frase: 'Ti sei lavata le mani con il sapone prima di pranzo.',
    definizione: 'Conta se le mani sono lavate con il sapone e asciugate prima di sedersi a tavola, senza bisogno di accompagnarla al lavandino.',
    tipo: 'fisso',
    momento: 'pomeriggio',
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Riordinare i giochi',
    icona: 'giochi',
    frase: 'Hai rimesso i giochi nella cesta.',
    definizione: 'Conta se i giochi usati nel pomeriggio sono nella cesta prima di cena. Aiuto ammesso: un adulto può tenere aperta la cesta.',
    tipo: 'fisso',
    momento: 'pomeriggio',
    timer: 10,
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Portare il piatto nel lavandino',
    icona: 'piatto',
    frase: 'Hai portato il tuo piatto nel lavandino.',
    definizione: 'Conta se, finita la cena, porta il proprio piatto nel lavandino senza farlo cadere. Le posate possono restare a tavola.',
    tipo: 'fisso',
    momento: 'sera',
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Mettere le scarpe in fila',
    icona: 'scarpe',
    frase: 'Hai messo le scarpe in fila vicino alla porta.',
    definizione: 'Conta se la sera le scarpe sono in fila vicino alla porta. Quando domani non c\'è scuola, la stellina arriva da sola.',
    tipo: 'fisso',
    momento: 'sera',
    validita: 'domani',
    automaticaSeDomaniNon: ['scuola'],
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Apparecchiare la tavola',
    icona: 'tavola',
    frase: 'Hai apparecchiato la tavola con i tovaglioli e i bicchieri.',
    definizione: 'Conta se mette tovaglioli e bicchieri per tutti. Piatti e posate li porta un adulto.',
    tipo: 'scelta',
    momento: 'sera',
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Dare da mangiare al pesce',
    icona: 'pesce',
    frase: 'Hai dato da mangiare al pesce.',
    definizione: 'Conta se mette un pizzico di mangime nella vasca, con un adulto presente che controlla la dose.',
    tipo: 'scelta',
    momento: 'pomeriggio',
    perTipo: soloScuola(),
  },
  {
    ...base,
    nome: 'Mettere i libri sullo scaffale',
    icona: 'libri',
    frase: 'Hai rimesso i libri sullo scaffale.',
    definizione: 'Conta se i libri sfogliati durante il giorno tornano sullo scaffale prima di andare a letto.',
    tipo: 'catalogo',
    momento: 'sera',
    perTipo: ogniGiorno(),
  },
  {
    ...base,
    nome: 'Sistemare i colori',
    icona: 'colori',
    frase: 'Hai rimesso i colori nella scatola.',
    definizione: 'Conta se, finito di disegnare, i colori sono nella scatola chiusa.',
    tipo: 'catalogo',
    momento: 'pomeriggio',
    perTipo: ogniGiorno(),
  },
];

// Aggiunge alla bozza i comportamenti del modello che non ci sono già (stesso nome),
// adattandoli ai tipi di giorno della famiglia: nei tipi nuovi partono come "non previsti".
export function importaModello(bozza) {
  const nomi = new Set(bozza.comportamenti.map((c) => c.nome.trim().toLowerCase()));
  let n = bozza.comportamenti.length;
  for (const esempio of MODELLO_ESEMPIO) {
    if (nomi.has(esempio.nome.toLowerCase())) continue;
    let id;
    do { id = `ca-${++n}`; } while (bozza.comportamenti.some((c) => c.id === id));
    bozza.comportamenti.push(allineaAiTipi(
      { ...structuredClone(esempio), id, stato: statoDaTipo(esempio.tipo) }, bozza.tipiGiorno));
  }
  return bozza;
}
