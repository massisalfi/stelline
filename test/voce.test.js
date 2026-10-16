// Scelta della voce narrante: si preferiscono le voci italiane più naturali.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { qualitaVoce, ordinaVoci } from '../src/voce/voce.js';
import { testi } from '../src/testi/it.js';

const voce = (name, voiceURI, lang = 'it-IT') => ({ name, voiceURI, lang });

test('qualità della voce riconosciuta dall\'identificativo o dal nome', () => {
  assert.equal(qualitaVoce(voce('Federica', 'com.apple.voice.premium.it-IT.Federica')), 'premium');
  assert.equal(qualitaVoce(voce('Alice', 'com.apple.voice.enhanced.it-IT.Alice')), 'migliorata');
  assert.equal(qualitaVoce(voce('Alice (Migliorata)', 'x')), 'migliorata');
  assert.equal(qualitaVoce(voce('Alice', 'com.apple.voice.compact.it-IT.Alice')), 'base');
});

test('solo voci italiane, dalla più naturale alla più semplice', () => {
  const ordinate = ordinaVoci([
    voce('Luca', 'com.apple.voice.compact.it-IT.Luca'),
    voce('Samantha', 'com.apple.voice.compact.en-US.Samantha', 'en-US'),
    voce('Alice', 'com.apple.voice.enhanced.it-IT.Alice'),
    voce('Federica', 'com.apple.voice.premium.it-IT.Federica'),
    voce('Alice', 'com.apple.voice.compact.it-IT.Alice', 'it_IT'),
  ]);
  assert.deepEqual(ordinate.map((v) => v.voiceURI), [
    'com.apple.voice.premium.it-IT.Federica',
    'com.apple.voice.enhanced.it-IT.Alice',
    'com.apple.voice.compact.it-IT.Alice',
    'com.apple.voice.compact.it-IT.Luca',
  ]);
});

test('nel menu il nome della voce è pulito e indica la qualità', () => {
  const nome = testi.configurazione.giocatrice.nomeVoce;
  assert.equal(nome('Grandma (italiano (Italia))', 'base'), 'Grandma');
  assert.equal(nome('Federica', 'premium'), 'Federica · Premium');
  assert.equal(nome('Alice (Migliorata)', 'migliorata'), 'Alice · Migliorata');
});
