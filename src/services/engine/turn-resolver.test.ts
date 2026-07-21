import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateMap } from './map-generator';
import { MatchState, resolveAction, UnitState } from './turn-resolver';

const PLAYER1 = 'player-1';
const PLAYER2 = 'player-2';
const SHARED_NODES = generateMap('seed-teste').nodes;

function buildState(units: UnitState[] = []): MatchState {
  return { player1Id: PLAYER1, player2Id: PLAYER2, nodes: SHARED_NODES, units };
}

test('invoca uma unidade no nó indicado', () => {
  const state = buildState();
  const [node] = state.nodes;

  const result = resolveAction(state, {
    type: 'INVOCAR',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    atNodeId: node.id,
    hp: 4,
    atk: 2,
  });

  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].currentNodeId, node.id);
  assert.equal(result.units[0].status, 'VIVA');
  assert.ok(result.events.some((e) => e.type === 'UNIDADE_INVOCADA'));
});

test('rejeita invocação em nó inexistente', () => {
  const state = buildState();
  assert.throws(() =>
    resolveAction(state, {
      type: 'INVOCAR',
      ownerId: PLAYER1,
      cardId: 'card-worm',
      atNodeId: 'nó-inexistente',
      hp: 4,
      atk: 2,
    }),
  );
});

test('move uma unidade para um nó adjacente e reseta turnsInPosition', () => {
  const state = buildState();
  const [nodeA, nodeB] = state.nodes;
  const unit: UnitState = {
    id: 'unit-1',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: nodeA.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 3,
    status: 'VIVA',
  };

  const result = resolveAction(buildState([unit]), { type: 'MOVER', unitId: unit.id, toNodeId: nodeB.id });

  assert.equal(result.units[0].currentNodeId, nodeB.id);
  assert.equal(result.units[0].turnsInPosition, 0);
});

test('rejeita movimento para nó não adjacente', () => {
  const state0 = buildState();
  const [nodeA, , nodeC] = state0.nodes;
  const unit: UnitState = {
    id: 'unit-1',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: nodeA.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  assert.throws(() => resolveAction(buildState([unit]), { type: 'MOVER', unitId: unit.id, toNodeId: nodeC.id }));
});

test('rejeita mover unidade morta ou inexistente', () => {
  const state = buildState();
  const [nodeA, nodeB] = state.nodes;
  const deadUnit: UnitState = {
    id: 'unit-1',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: nodeA.id,
    hp: 0,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'MORTA',
  };

  assert.throws(() =>
    resolveAction(buildState([deadUnit]), { type: 'MOVER', unitId: deadUnit.id, toNodeId: nodeB.id }),
  );
  assert.throws(() => resolveAction(buildState(), { type: 'MOVER', unitId: 'inexistente', toNodeId: nodeB.id }));
});

test('combate simultâneo: ambas as unidades tomam dano ao colidir no mesmo nó', () => {
  const state0 = buildState();
  const [nodeA, nodeB] = state0.nodes;

  const attacker: UnitState = {
    id: 'attacker',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: nodeA.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };
  const defender: UnitState = {
    id: 'defender',
    ownerId: PLAYER2,
    cardId: 'card-firewall',
    currentNodeId: nodeB.id,
    hp: 3,
    atk: 1,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const result = resolveAction(buildState([attacker, defender]), {
    type: 'MOVER',
    unitId: attacker.id,
    toNodeId: nodeB.id,
  });

  const updatedAttacker = result.units.find((u) => u.id === 'attacker')!;
  const updatedDefender = result.units.find((u) => u.id === 'defender')!;

  assert.equal(updatedAttacker.hp, 3); // 4 - 1 (atk do defensor)
  assert.equal(updatedDefender.hp, 1); // 3 - 2 (atk do atacante)
  assert.equal(updatedAttacker.status, 'VIVA');
  assert.equal(updatedDefender.status, 'VIVA');
  assert.ok(result.events.some((e) => e.type === 'COMBATE_RESOLVIDO'));
});

test('unidade que morre em combate fica com status MORTA e gera evento', () => {
  const state0 = buildState();
  const [nodeA, nodeB] = state0.nodes;

  const attacker: UnitState = {
    id: 'attacker',
    ownerId: PLAYER1,
    cardId: 'card-ransomware',
    currentNodeId: nodeA.id,
    hp: 6,
    atk: 6,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };
  const defender: UnitState = {
    id: 'defender',
    ownerId: PLAYER2,
    cardId: 'card-honeypot',
    currentNodeId: nodeB.id,
    hp: 3,
    atk: 1,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const result = resolveAction(buildState([attacker, defender]), {
    type: 'MOVER',
    unitId: attacker.id,
    toNodeId: nodeB.id,
  });

  const updatedDefender = result.units.find((u) => u.id === 'defender')!;
  assert.equal(updatedDefender.status, 'MORTA');
  assert.ok(result.events.some((e) => e.type === 'UNIDADE_MORTA' && e.unitId === 'defender'));
});

test('unidade sobrevivente que chega à base inimiga causa dano ao core', () => {
  const state0 = buildState();
  const lastIndex = state0.nodes.length - 1;
  const beforeLast = state0.nodes[lastIndex - 1];
  const last = state0.nodes[lastIndex];

  const attacker: UnitState = {
    id: 'attacker',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: beforeLast.id,
    hp: 4,
    atk: 3,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const result = resolveAction(buildState([attacker]), {
    type: 'MOVER',
    unitId: attacker.id,
    toNodeId: last.id,
  });

  assert.ok(
    result.events.some((e) => e.type === 'CORE_DANIFICADO' && e.targetOwnerId === PLAYER2 && e.amount === 3),
  );
});

test('passar o turno incrementa turnsInPosition de unidades vivas', () => {
  const unit: UnitState = {
    id: 'unit-1',
    ownerId: PLAYER1,
    cardId: 'card-worm',
    currentNodeId: 'node-x',
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 1,
    status: 'VIVA',
  };

  const result = resolveAction(buildState([unit]), { type: 'PASSAR_TURNO' });

  assert.equal(result.units[0].turnsInPosition, 2);
  assert.ok(result.events.some((e) => e.type === 'TURNO_PASSADO'));
});
