import { prisma } from '../config/prisma';

const withCards = { cards: { include: { card: true } } } as const;

export const deckRepository = {
  findAllByUser(userId: string) {
    return prisma.deck.findMany({ where: { userId }, include: withCards });
  },

  findById(id: string) {
    return prisma.deck.findUnique({ where: { id }, include: withCards });
  },

  create(userId: string, name: string, cards: { cardId: string; qty: number }[]) {
    return prisma.deck.create({
      data: {
        name,
        userId,
        cards: { create: cards },
      },
      include: withCards,
    });
  },

  async update(id: string, data: { name?: string; cards?: { cardId: string; qty: number }[] }) {
    if (data.cards) {
      await prisma.deckCard.deleteMany({ where: { deckId: id } });
    }

    return prisma.deck.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.cards ? { cards: { create: data.cards } } : {}),
      },
      include: withCards,
    });
  },

  async remove(id: string) {
    await prisma.deckCard.deleteMany({ where: { deckId: id } });
    await prisma.deck.delete({ where: { id } });
  },
};
