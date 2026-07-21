import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const cardRepository = {
  findAll() {
    return prisma.card.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.card.findUnique({ where: { id } });
  },

  create(data: Prisma.CardCreateInput) {
    return prisma.card.create({ data });
  },

  update(id: string, data: Prisma.CardUpdateInput) {
    return prisma.card.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.card.delete({ where: { id } });
  },
};
