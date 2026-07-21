import { Prisma } from '@prisma/client';
import { AppError } from '../../middlewares/AppError';
import { cardRepository } from '../../repositories/cardRepository';

export const cardService = {
  list() {
    return cardRepository.findAll();
  },

  async getById(id: string) {
    const card = await cardRepository.findById(id);
    if (!card) {
      throw new AppError('Carta não encontrada', 404);
    }
    return card;
  },

  create(data: Prisma.CardCreateInput) {
    return cardRepository.create(data);
  },

  async update(id: string, data: Prisma.CardUpdateInput) {
    await cardService.getById(id);
    return cardRepository.update(id, data);
  },

  async remove(id: string) {
    await cardService.getById(id);
    await cardRepository.remove(id);
  },
};
