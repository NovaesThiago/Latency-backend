import { decideCpuAction, CPU_OWNER_ID } from '../engine/ai/strategy';
import { cardService } from '../card/cardService';
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

    const action = decideCpuAction(state, unitCardIds);
    return matchService.resolveTurn(matchId, CPU_OWNER_ID, action);
  },
};
