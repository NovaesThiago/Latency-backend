import { MatchState } from '../turn-resolver';

export const CPU_OWNER_ID = 'CPU';

/** Fase 3: com 3 rotas independentes, a CPU (regra fixa) sempre joga na mesma rota fixa. */
const DEFAULT_ROUTE = 'NORTE';

export type CpuAction =
  | { type: 'INVOCAR'; cardId: string; atNodeId: string }
  | { type: 'MOVER'; unitId: string; toNodeId: string }
  | { type: 'PASSAR_TURNO' };

/**
 * Fase 2: heurística de regra fixa (NÃO adaptativa, seção 8 do plano trata a
 * versão ponderada/adaptativa como Fase 4 — este bot é o fallback que garante
 * uma partida vs CPU sempre jogável).
 *
 * Regra: se a CPU não tem unidade em campo, invoca a primeira carta de unidade
 * disponível na base da CPU na rota padrão (maior positionIndex daquela rota).
 * Caso contrário, avança a primeira unidade que conseguir se mover em direção
 * à base do player1 (menor positionIndex). Sem opções, passa o turno.
 */
export function decideCpuAction(state: MatchState, availableUnitCardIds: string[]): CpuAction {
  const cpuUnits = state.units.filter((u) => u.ownerId === CPU_OWNER_ID && u.status === 'VIVA');

  if (cpuUnits.length === 0) {
    if (availableUnitCardIds.length === 0) {
      return { type: 'PASSAR_TURNO' };
    }
    const routeNodes = state.nodes.filter((n) => n.route === DEFAULT_ROUTE);
    const cpuBaseNode = routeNodes.reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));
    return { type: 'INVOCAR', cardId: availableUnitCardIds[0], atNodeId: cpuBaseNode.id };
  }

  const nodesById = new Map(state.nodes.map((n) => [n.id, n]));
  for (const unit of cpuUnits) {
    const currentNode = nodesById.get(unit.currentNodeId);
    if (!currentNode) {
      continue;
    }

    const advanceOptions = currentNode.connections
      .map((neighborId) => nodesById.get(neighborId))
      .filter((neighbor): neighbor is NonNullable<typeof neighbor> => !!neighbor)
      .filter((neighbor) => neighbor.positionIndex < currentNode.positionIndex)
      .sort((a, b) => b.positionIndex - a.positionIndex);

    if (advanceOptions.length > 0) {
      return { type: 'MOVER', unitId: unit.id, toNodeId: advanceOptions[0].id };
    }
  }

  return { type: 'PASSAR_TURNO' };
}
