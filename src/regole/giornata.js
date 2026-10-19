// Aggiornamento della giornata alla prima apertura (RN-05, RN-06): stelline automatiche di oggi
// non ancora accreditate e scadenze dei giorni passati con un residuo.
//
// Le stelline automatiche "vale oggi" seguono la configurazione in vigore oggi; quelle "vale domani"
// nascono ieri e seguono la configurazione in vigore ieri (le modifiche non sono retroattive).

import { automaticheDelGiorno } from './automatiche.js';
import { automaticheDaAccreditare, scadenzeDaRegistrare } from './portafoglio.js';

export function movimentiDellaGiornata({ oggi, configurazioneOggi, configurazioneIeri, movimenti, pause = [] }) {
  const automatiche = [
    ...(configurazioneOggi
      ? automaticheDelGiorno(oggi, configurazioneOggi.comportamenti.filter((c) => c.validita !== 'domani'),
        configurazioneOggi.calendario, pause)
      : []),
    ...(configurazioneIeri
      ? automaticheDelGiorno(oggi, configurazioneIeri.comportamenti.filter((c) => c.validita === 'domani'),
        configurazioneIeri.calendario, pause)
      : []),
  ];
  return [...scadenzeDaRegistrare(oggi, movimenti), ...automaticheDaAccreditare(oggi, automatiche, movimenti)];
}
