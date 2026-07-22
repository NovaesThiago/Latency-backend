import { ChallengeDifficulty, Language } from '@prisma/client';
import { AppError } from '../../middlewares/AppError';
import { challengeRepository } from '../../repositories/challengeRepository';

export const challengeService = {
  list(filter: { language?: Language; difficulty?: ChallengeDifficulty }) {
    return challengeRepository.list(filter);
  },

  async getById(id: string) {
    const challenge = await challengeRepository.findById(id);
    if (!challenge) {
      throw new AppError('Desafio não encontrado', 404);
    }
    return challenge;
  },

  create(data: Parameters<typeof challengeRepository.create>[0]) {
    return challengeRepository.create(data);
  },

  async update(id: string, data: Parameters<typeof challengeRepository.update>[1]) {
    await this.getById(id);
    return challengeRepository.update(id, data);
  },

  async remove(id: string) {
    await this.getById(id);
    await challengeRepository.remove(id);
  },
};
