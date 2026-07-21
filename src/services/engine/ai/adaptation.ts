import { Route } from '../types';

/**
 * Fase 4 / seção 8 do plano: snapshot de uma jogada humana, usado para recalcular
 * o perfil do adversário a cada turno. Isto é uma heurística de contagem
 * ponderada — não há treinamento de modelo nem ML envolvido.
 */
export interface FeatureSnapshot {
  actionType: 'INVOCAR' | 'MOVER' | 'PASSAR_TURNO';
  route?: Route;
  usedTrainingSubroute?: boolean;
}

export interface AiProfileSummary {
  preferredRoute: Route;
  aggressiveRatio: number;
  trainingUsageRatio: number;
}

const DEFAULT_PROFILE: AiProfileSummary = {
  preferredRoute: 'NORTE',
  aggressiveRatio: 0.5,
  trainingUsageRatio: 0.5,
};

/**
 * Recalcula o perfil do adversário a partir do histórico de observações:
 * rota mais usada, proporção de jogadas agressivas (invocar/mover) e
 * proporção de movimentos que passaram por uma subrota de treino.
 */
export function computeProfile(observations: FeatureSnapshot[]): AiProfileSummary {
  if (observations.length === 0) {
    return DEFAULT_PROFILE;
  }

  const routeCounts = new Map<Route, number>();
  let aggressiveCount = 0;
  let moveCount = 0;
  let trainingMoveCount = 0;

  for (const obs of observations) {
    if (obs.route) {
      routeCounts.set(obs.route, (routeCounts.get(obs.route) ?? 0) + 1);
    }
    if (obs.actionType === 'INVOCAR' || obs.actionType === 'MOVER') {
      aggressiveCount += 1;
    }
    if (obs.actionType === 'MOVER') {
      moveCount += 1;
      if (obs.usedTrainingSubroute) {
        trainingMoveCount += 1;
      }
    }
  }

  let preferredRoute = DEFAULT_PROFILE.preferredRoute;
  let maxCount = -1;
  for (const [route, count] of routeCounts) {
    if (count > maxCount) {
      maxCount = count;
      preferredRoute = route;
    }
  }

  return {
    preferredRoute,
    aggressiveRatio: aggressiveCount / observations.length,
    trainingUsageRatio: moveCount > 0 ? trainingMoveCount / moveCount : DEFAULT_PROFILE.trainingUsageRatio,
  };
}
