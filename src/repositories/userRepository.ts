import { prisma } from '../config/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByNickname(nickname: string) {
    return prisma.user.findUnique({ where: { nickname } });
  },

  create(data: { nickname: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },
};
