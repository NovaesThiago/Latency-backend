import { matchRepository } from '../../repositories/matchRepository';
import { cardService } from '../card/cardService';
import { computeProfile, FeatureSnapshot } from '../engine/ai/adaptation';
import { decideCpuAction, CPU_OWNER_ID } from '../engine/ai/strategy';
import { buildState, matchService } from './matchService';

export const cpuService = {
  async playTurnIfApplicable(matchId: string) {
    const match = await matchService.getById(matchId);
    if (!match.isVsCpu || match.status === 'FINALIZADA') {
      return null;
    }

    const state = await buildState(match);
    const cards = await cardService.list();
    const unitCardIds = cards.filter((c) => c.type === 'UNIDADE').map((c) => c.id);

    const observations = await matchRepository.getObservations(matchId);
    const profile = computeProfile(observations.map((o) => o.featureSnapshot as unknown as FeatureSnapshot));

    const action = decideCpuAction(state, unitCardIds, profile);
    return matchService.resolveTurn(matchId, CPU_OWNER_ID, action);
  },
};
