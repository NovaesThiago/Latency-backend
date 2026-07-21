import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeProfile, FeatureSnapshot } from './adaptation';

test('retorna o perfil padrão quando não há observações', () => {
  const profile = computeProfile([]);
  assert.equal(profile.preferredRoute, 'NORTE');
  assert.equal(profile.aggressiveRatio, 0.5);
  assert.equal(profile.trainingUsageRatio, 0.5);
});

test('identifica a rota mais jogada pelo adversário', () => {
  const observations: FeatureSnapshot[] = [
    { actionType: 'MOVER', route: 'CENTRAL' },
    { actionType: 'MOVER', route: 'CENTRAL' },
    { actionType: 'MOVER', route: 'SUL' },
  ];

  const profile = computeProfile(observations);
  assert.equal(profile.preferredRoute, 'CENTRAL');
});

test('calcula a proporção de jogadas agressivas (invocar/mover vs. passar turno)', () => {
  const observations: FeatureSnapshot[] = [
    { actionType: 'INVOCAR', route: 'NORTE' },
    { actionType: 'MOVER', route: 'NORTE' },
    { actionType: 'PASSAR_TURNO' },
    { actionType: 'PASSAR_TURNO' },
  ];

  const profile = computeProfile(observations);
  assert.equal(profile.aggressiveRatio, 0.5);
});

test('calcula a proporção de movimentos que usaram subrota de treino', () => {
  const observations: FeatureSnapshot[] = [
    { actionType: 'MOVER', route: 'NORTE', usedTrainingSubroute: true },
    { actionType: 'MOVER', route: 'NORTE', usedTrainingSubroute: false },
    { actionType: 'INVOCAR', route: 'NORTE' },
  ];

  const profile = computeProfile(observations);
  assert.equal(profile.trainingUsageRatio, 0.5);
});
