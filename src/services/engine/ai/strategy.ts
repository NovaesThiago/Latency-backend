import { MatchState } from '../turn-resolver';
import { AiProfileSummary } from './adaptation';

export const CPU_OWNER_ID = 'CPU';

const DEFAULT_PROFILE: AiProfileSummary = {
  preferredRoute: 'NORTE',
  aggressiveRatio: 0.5,
  trainingUsageRatio: 0.5,
};

/** Estamina mínima antes da CPU priorizar uma carta de suprimento em vez de invocar. */
const LOW_STAMINA_THRESHOLD = 3;

export interface CpuCardOption {
  id: string;
  type: 'UNIDADE' | 'ESTRUTURA' | 'FEITICO' | 'SUPRIMENTO';
  cost: number;
}

export type CpuAction =
  | { type: 'INVOCAR'; cardId: string; atNodeId?: string }
  | { type: 'MOVER'; unitId: string; toNodeId: string }
  | { type: 'PASSAR_TURNO' };

/**
 * Fase 4 / seção 8 do plano: heurística ponderada (NÃO ML) — os pesos vêm do
 * `profile` calculado em adaptation.ts a partir do histórico do adversário.
 * Sem profile (ou partida nova sem observações), cai no perfil padrão, que
 * reproduz o comportamento fixo da Fase 2/3.
 *
 * A CPU nunca tenta uma jogada que não pode pagar: se a estamina está baixa e
 * há carta de suprimento disponível, abastece primeiro; se não tem estamina
 * para a carta de unidade mais barata, passa o turno em vez de tentar invocar.
 */
export function decideCpuAction(
  state: MatchState,
  availableCards: CpuCardOption[],
  profile: AiProfileSummary = DEFAULT_PROFILE,
): CpuAction {
  const cpuUnits = state.units.filter((u) => u.ownerId === CPU_OWNER_ID && u.status === 'VIVA');
  const cpuStamina = state.player2Stamina;

  const unitCards = availableCards.filter((c) => c.type === 'UNIDADE');
  const supplyCards = availableCards.filter((c) => c.type === 'SUPRIMENTO');
  const cheapestUnit = unitCards.length > 0 ? unitCards.reduce((a, b) => (a.cost < b.cost ? a : b)) : undefined;

  if (cpuStamina < LOW_STAMINA_THRESHOLD && supplyCards.length > 0) {
    return { type: 'INVOCAR', cardId: supplyCards[0].id };
  }

  if (cpuUnits.length === 0) {
    if (!cheapestUnit || cpuStamina < cheapestUnit.cost) {
      if (supplyCards.length > 0) {
        return { type: 'INVOCAR', cardId: supplyCards[0].id };
      }
      return { type: 'PASSAR_TURNO' };
    }
    const routeNodes = state.nodes.filter((n) => n.route === profile.preferredRoute);
    const cpuBaseNode = routeNodes.reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));
    return { type: 'INVOCAR', cardId: cheapestUnit.id, atNodeId: cpuBaseNode.id };
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
