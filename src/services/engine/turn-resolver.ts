import { EngineError } from './errors';
import { MapNodeData, UnitStatus } from './types';

export interface UnitState {
  id: string;
  ownerId: string;
  cardId: string;
  currentNodeId: string;
  hp: number;
  atk: number;
  level: number;
  turnsInPosition: number;
  status: UnitStatus;
}

export interface MatchState {
  player1Id: string;
  player2Id: string;
  nodes: MapNodeData[];
  units: UnitState[];
}

export interface SummonAction {
  type: 'INVOCAR';
  ownerId: string;
  cardId: string;
  atNodeId: string;
  hp: number;
  atk: number;
}

export interface MoveAction {
  type: 'MOVER';
  unitId: string;
  toNodeId: string;
}

export interface PassAction {
  type: 'PASSAR_TURNO';
}

export type TurnAction = SummonAction | MoveAction | PassAction;

export type TurnEvent =
  | { type: 'UNIDADE_INVOCADA'; unitId: string; nodeId: string }
  | { type: 'UNIDADE_MOVIDA'; unitId: string; fromNodeId: string; toNodeId: string }
  | { type: 'COMBATE_RESOLVIDO'; nodeId: string; unitIds: string[] }
  | { type: 'UNIDADE_MORTA'; unitId: string }
  | { type: 'CORE_DANIFICADO'; targetOwnerId: string; amount: number }
  | { type: 'TURNO_PASSADO' };

export interface TurnResult {
  units: UnitState[];
  events: TurnEvent[];
}

export function resolveAction(state: MatchState, action: TurnAction): TurnResult {
  switch (action.type) {
    case 'INVOCAR':
      return handleSummon(state, action);
    case 'MOVER':
      return handleMove(state, action);
    case 'PASSAR_TURNO':
      return handlePass(state);
  }
}

function handleSummon(state: MatchState, action: SummonAction): TurnResult {
  const node = findNode(state, action.atNodeId);
  if (!node) {
    throw new EngineError('Nó de invocação inválido');
  }

  const unit: UnitState = {
    id: crypto.randomUUID(),
    ownerId: action.ownerId,
    cardId: action.cardId,
    currentNodeId: action.atNodeId,
    hp: action.hp,
    atk: action.atk,
    level: 1,
    turnsInPosition: 0,
    status: 'VIVA',
  };

  const units = [...state.units, unit];
  const events: TurnEvent[] = [{ type: 'UNIDADE_INVOCADA', unitId: unit.id, nodeId: unit.currentNodeId }];

  return applyCombat({ ...state, units }, action.atNodeId, events);
}

function handleMove(state: MatchState, action: MoveAction): TurnResult {
  const unit = state.units.find((u) => u.id === action.unitId);
  if (!unit || unit.status === 'MORTA') {
    throw new EngineError('Unidade não encontrada ou morta');
  }

  const currentNode = findNode(state, unit.currentNodeId);
  if (!currentNode) {
    throw new EngineError('Unidade está em um nó inexistente');
  }

  if (!currentNode.connections.includes(action.toNodeId)) {
    throw new EngineError('Movimento inválido: destino não é adjacente à posição atual');
  }

  const units = state.units.map((u) =>
    u.id === unit.id ? { ...u, currentNodeId: action.toNodeId, turnsInPosition: 0 } : u,
  );

  const events: TurnEvent[] = [
    { type: 'UNIDADE_MOVIDA', unitId: unit.id, fromNodeId: unit.currentNodeId, toNodeId: action.toNodeId },
  ];

  const afterCombat = applyCombat({ ...state, units }, action.toNodeId, events);
  return applyCoreDamage(state, afterCombat, action.toNodeId);
}

function handlePass(state: MatchState): TurnResult {
  const units = state.units.map((u) => (u.status === 'VIVA' ? { ...u, turnsInPosition: u.turnsInPosition + 1 } : u));
  return { units, events: [{ type: 'TURNO_PASSADO' }] };
}

/**
 * Combate simultâneo: todo dano é calculado a partir do snapshot de HP/ATK do
 * início da resolução (seção "Ordem de resolução" em docs/turn-resolution.md),
 * nunca sequencialmente.
 */
function applyCombat(state: MatchState, nodeId: string, events: TurnEvent[]): TurnResult {
  const combatants = state.units.filter((u) => u.currentNodeId === nodeId && u.status === 'VIVA');
  const owners = new Set(combatants.map((u) => u.ownerId));

  if (owners.size < 2) {
    return { units: state.units, events };
  }

  const damageByOwner = new Map<string, number>();
  for (const owner of owners) {
    const incoming = combatants.filter((u) => u.ownerId !== owner).reduce((sum, u) => sum + u.atk, 0);
    damageByOwner.set(owner, incoming);
  }

  const combatantIds = new Set(combatants.map((u) => u.id));
  const units = state.units.map((u) => {
    if (!combatantIds.has(u.id)) {
      return u;
    }
    const hp = u.hp - (damageByOwner.get(u.ownerId) ?? 0);
    return hp <= 0 ? { ...u, hp, status: 'MORTA' as const } : { ...u, hp };
  });

  const nextEvents = [...events, { type: 'COMBATE_RESOLVIDO' as const, nodeId, unitIds: [...combatantIds] }];
  for (const unit of units) {
    if (combatantIds.has(unit.id) && unit.status === 'MORTA') {
      nextEvents.push({ type: 'UNIDADE_MORTA', unitId: unit.id });
    }
  }

  return { units, events: nextEvents };
}

/**
 * Dano ao core: positionIndex 0 é a base do player1, o maior positionIndex da
 * rota é a base do player2. Uma unidade sobrevivente que chega à base inimiga
 * causa dano ao core do dono daquela base.
 */
function applyCoreDamage(originalState: MatchState, result: TurnResult, nodeId: string): TurnResult {
  const node = findNode(originalState, nodeId);
  if (!node) {
    return result;
  }

  const maxPositionIndex = Math.max(...originalState.nodes.filter((n) => n.route === node.route).map((n) => n.positionIndex));
  const arrivingUnits = result.units.filter((u) => u.currentNodeId === nodeId && u.status === 'VIVA');

  const events = [...result.events];
  for (const unit of arrivingUnits) {
    if (node.positionIndex === 0 && unit.ownerId !== originalState.player1Id) {
      events.push({ type: 'CORE_DANIFICADO', targetOwnerId: originalState.player1Id, amount: unit.atk });
    } else if (node.positionIndex === maxPositionIndex && unit.ownerId !== originalState.player2Id) {
      events.push({ type: 'CORE_DANIFICADO', targetOwnerId: originalState.player2Id, amount: unit.atk });
    }
  }

  return { units: result.units, events };
}

function findNode(state: MatchState, nodeId: string): MapNodeData | undefined {
  return state.nodes.find((n) => n.id === nodeId);
}
