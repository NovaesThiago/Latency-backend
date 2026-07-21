import { randomUUID } from 'crypto';
import { AppError } from '../../middlewares/AppError';
import { matchRepository } from '../../repositories/matchRepository';
import { generateMap } from '../engine/map-generator';

export const matchService = {
  async createMatch(player1Id: string, params: { isVsCpu: boolean; player2Id?: string }) {
    if (!params.isVsCpu && !params.player2Id) {
      throw new AppError('player2Id é obrigatório quando isVsCpu for false', 400);
    }

    const seed = randomUUID();
    const generated = generateMap(seed);

    return matchRepository.create({
      player1Id,
      player2Id: params.isVsCpu ? null : (params.player2Id as string),
      isVsCpu: params.isVsCpu,
      templateId: generated.templateId,
      seed: generated.seed,
      nodes: generated.nodes,
    });
  },

  async getById(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw new AppError('Partida não encontrada', 404);
    }
    return match;
  },
};
