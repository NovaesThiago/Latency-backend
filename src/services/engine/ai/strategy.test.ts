import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateMap } from '../map-generator';
import { MatchState, UnitState } from '../turn-resolver';
import { CPU_OWNER_ID, decideCpuAction } from './strategy';

const PLAYER1 = 'player-1';
const NODES = generateMap('seed-cpu').nodes;
const NORTE_NODES = [...NODES].filter((n) => n.route === 'NORTE').sort((a, b) => a.positionIndex - b.positionIndex);

function buildState(units: UnitState[] = []): MatchState {
  return { player1Id: PLAYER1, player2Id: CPU_OWNER_ID, nodes: NODES, units };
}

test('invoca uma unidade na base da CPU (rota NORTE) quando não tem unidades em campo', () => {
  const state = buildState();
  const action = decideCpuAction(state, ['card-worm']);

  const cpuBaseNode = NORTE_NODES[NORTE_NODES.length - 1];

  assert.deepEqual(action, { type: 'INVOCAR', cardId: 'card-worm', atNodeId: cpuBaseNode.id });
});

test('passa o turno se não tem unidades nem cartas disponíveis', () => {
  const action = decideCpuAction(buildState(), []);
  assert.deepEqual(action, { type: 'PASSAR_TURNO' });
});

test('avança a unidade da CPU em direção à base do player1', () => {
  const cpuBase = NORTE_NODES[NORTE_NODES.length - 1];
  const oneStepIn = NORTE_NODES[NORTE_NODES.length - 2];

  const unit: UnitState = {
    id: 'cpu-unit',
    ownerId: CPU_OWNER_ID,
    cardId: 'card-worm',
    currentNodeId: cpuBase.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const action = decideCpuAction(buildState([unit]), ['card-worm']);

  assert.deepEqual(action, { type: 'MOVER', unitId: 'cpu-unit', toNodeId: oneStepIn.id });
});

test('no gateway, prioriza a subrota de treino quando o adversário raramente treina', () => {
  const nodesById = new Map(NORTE_NODES.map((n) => [n.id, n]));
  const gateway = NORTE_NODES.filter(
    (n) => n.subrouteType === 'DIRETA' && n.connections.some((id) => nodesById.get(id)?.subrouteType === 'TREINAMENTO'),
  ).reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));
  const trainingNeighbor = gateway.connections.map((id) => nodesById.get(id)!).find((n) => n.subrouteType === 'TREINAMENTO')!;

  const unit: UnitState = {
    id: 'cpu-unit',
    ownerId: CPU_OWNER_ID,
    cardId: 'card-worm',
    currentNodeId: gateway.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const action = decideCpuAction(buildState([unit]), [], {
    preferredRoute: 'NORTE',
    aggressiveRatio: 0.5,
    trainingUsageRatio: 0.1,
  });

  assert.deepEqual(action, { type: 'MOVER', unitId: 'cpu-unit', toNodeId: trainingNeighbor.id });
});

test('no gateway, prioriza a subrota direta quando o adversário já treina bastante', () => {
  const nodesById = new Map(NORTE_NODES.map((n) => [n.id, n]));
  const gateway = NORTE_NODES.filter(
    (n) => n.subrouteType === 'DIRETA' && n.connections.some((id) => nodesById.get(id)?.subrouteType === 'TREINAMENTO'),
  ).reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));
  const directNeighbor = gateway.connections.map((id) => nodesById.get(id)!).find((n) => n.subrouteType === 'DIRETA')!;

  const unit: UnitState = {
    id: 'cpu-unit',
    ownerId: CPU_OWNER_ID,
    cardId: 'card-worm',
    currentNodeId: gateway.id,
    hp: 4,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const action = decideCpuAction(buildState([unit]), [], {
    preferredRoute: 'NORTE',
    aggressiveRatio: 0.5,
    trainingUsageRatio: 0.9,
  });

  assert.deepEqual(action, { type: 'MOVER', unitId: 'cpu-unit', toNodeId: directNeighbor.id });
});

test('invoca na base da rota preferida do perfil, não sempre NORTE', () => {
  const centralNodes = NODES.filter((n) => n.route === 'CENTRAL').sort((a, b) => a.positionIndex - b.positionIndex);
  const centralBase = centralNodes[centralNodes.length - 1];

  const action = decideCpuAction(buildState(), ['card-worm'], {
    preferredRoute: 'CENTRAL',
    aggressiveRatio: 0.5,
    trainingUsageRatio: 0.5,
  });

  assert.deepEqual(action, { type: 'INVOCAR', cardId: 'card-worm', atNodeId: centralBase.id });
});

test('ignora unidades mortas da CPU ao decidir a ação', () => {
  const cpuBase = NORTE_NODES[NORTE_NODES.length - 1];
  const deadUnit: UnitState = {
    id: 'cpu-unit-morta',
    ownerId: CPU_OWNER_ID,
    cardId: 'card-worm',
    currentNodeId: cpuBase.id,
    hp: 0,
    atk: 2,
    level: 1,
    turnsInPosition: 0,
    status: 'MORTA',
  };

  const action = decideCpuAction(buildState([deadUnit]), ['card-worm']);
  assert.deepEqual(action, { type: 'INVOCAR', cardId: 'card-worm', atNodeId: cpuBase.id });
});
