import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const fullInclude = {
  layers: { include: { challenge: true }, orderBy: { layerNumber: 'asc' } as const },
  chatMessages: { orderBy: { createdAt: 'asc' } as const, take: 50 },
  powerUpUses: true,
} satisfies Prisma.InvasionInclude;

export const invasionRepository = {
  create(data: Prisma.InvasionCreateInput) {
    return prisma.invasion.create({ data, include: fullInclude });
  },

  findById(id: string) {
    return prisma.invasion.findUnique({ where: { id }, include: fullInclude });
  },

  update(id: string, data: Prisma.InvasionUpdateInput) {
    return prisma.invasion.update({ where: { id }, data, include: fullInclude });
  },

  updateLayer(invasionId: string, layerNumber: number, data: Prisma.InvasionLayerUpdateInput) {
    return prisma.invasionLayer.update({ where: { invasionId_layerNumber: { invasionId, layerNumber } }, data });
  },

  createAttempt(data: Prisma.ChallengeAttemptCreateInput) {
    return prisma.challengeAttempt.create({ data });
  },

  hasPassedBonusAttempt(invasionId: string) {
    return prisma.challengeAttempt.findFirst({
      where: { invasionId, passed: true, challenge: { isBonus: true } },
    });
  },

  createChatMessage(data: Prisma.ChatMessageCreateInput) {
    return prisma.chatMessage.create({ data });
  },

  createPowerUpUse(data: Prisma.PowerUpUseCreateInput) {
    return prisma.powerUpUse.create({ data });
  },
};
