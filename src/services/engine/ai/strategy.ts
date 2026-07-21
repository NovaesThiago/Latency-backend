import { MatchState } from '../turn-resolver';
import { AiProfileSummary } from './adaptation';

export const CPU_OWNER_ID = 'CPU';

const DEFAULT_PROFILE: AiProfileSummary = {
  preferredRoute: 'NORTE',
  aggressiveRatio: 0.5,
  trainingUsageRatio: 0.5,
};

export type CpuAction =
  | { type: 'INVOCAR'; cardId: string; atNodeId: string }
  | { type: 'MOVER'; unitId: string; toNodeId: string }
  | { type: 'PASSAR_TURNO' };

/**
 * Fase 4 / seção 8 do plano: heurística ponderada (NÃO ML) — os pesos vêm do
 * `profile` calculado em adaptation.ts a partir do histórico do adversário.
 * Sem profile (ou partida nova sem observações), cai no perfil padrão, que
 * reproduz o comportamento fixo da Fase 2/3.
 *
 * Regra: se a CPU não tem unidade em campo, invoca a primeira carta de unidade
 * disponível na base da CPU, na rota preferida do adversário (para "cobrir" a
 * rota mais usada). Caso contrário, avança a primeira unidade que conseguir se
 * mover em direção à base do player1; num ponto de bifurcação/reconvergência,
 * prioriza a subrota de treino se o adversário costuma avançar sem treinar
 * (para tentar superá-lo em atributos), ou a subrota direta caso contrário
 * (para não ficar para trás enquanto o adversário treina). Sem opções, passa
 * o turno.
 */
export function decideCpuAction(
  state: MatchState,
  availableUnitCardIds: string[],
  profile: AiProfileSummary = DEFAULT_PROFILE,
): CpuAction {
  const cpuUnits = state.units.filter((u) => u.ownerId === CPU_OWNER_ID && u.status === 'VIVA');

  if (cpuUnits.length === 0) {
    if (availableUnitCardIds.length === 0) {
      return { type: 'PASSAR_TURNO' };
    }
    const routeNodes = state.nodes.filter((n) => n.route === profile.preferredRoute);
    const cpuBaseNode = routeNodes.reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));
    return { type: 'INVOCAR', cardId: availableUnitCardIds[0], atNodeId: cpuBaseNode.id };
  }

  const nodesById = new Map(state.nodes.map((n) => [n.id, n]));
  const preferTraining = profile.trainingUsageRatio < 0.4;

  for (const unit of cpuUnits) {
    const currentNode = nodesById.get(unit.currentNodeId);
    if (!currentNode) {
      continue;
    }

    const advanceOptions = currentNode.connections
      .map((neighborId) => nodesById.get(neighborId))
      .filter((neighbor): neighbor is NonNullable<typeof neighbor> => !!neighbor)
      .filter((neighbor) => neighbor.positionIndex < currentNode.positionIndex);

    if (advanceOptions.length === 0) {
      continue;
    }

    const preferredSubroute = preferTraining ? 'TREINAMENTO' : 'DIRETA';
    const chosen = advanceOptions.find((n) => n.subrouteType === preferredSubroute) ?? advanceOptions[0];

    return { type: 'MOVER', unitId: unit.id, toNodeId: chosen.id };
  }

  return { type: 'PASSAR_TURNO' };
}
