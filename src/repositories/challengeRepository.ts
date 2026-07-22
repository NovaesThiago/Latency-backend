import { Prisma, ChallengeDifficulty, Language } from '@prisma/client';
import { prisma } from '../config/prisma';

export const challengeRepository = {
  list(filter: { language?: Language; difficulty?: ChallengeDifficulty }) {
    return prisma.challenge.findMany({ where: filter, orderBy: [{ language: 'asc' }, { difficulty: 'asc' }, { title: 'asc' }] });
  },

  findById(id: string) {
    return prisma.challenge.findUnique({ where: { id } });
  },

  create(data: Prisma.ChallengeCreateInput) {
    return prisma.challenge.create({ data });
  },

  update(id: string, data: Prisma.ChallengeUpdateInput) {
    return prisma.challenge.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.challenge.delete({ where: { id } });
  },

  /** Sorteia 1 desafio não-bônus compatível com a linguagem/dificuldade — usado
   * pelo invasionService pra montar as 5 camadas de uma partida. */
  async pickRandom(language: Language, difficulty: ChallengeDifficulty) {
    const candidates = await prisma.challenge.findMany({ where: { language, difficulty, isBonus: false } });
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  async pickRandomBonus(language: Language) {
    const candidates = await prisma.challenge.findMany({ where: { language, isBonus: true } });
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  },
};
