import { AppError } from '../../middlewares/AppError';
import { deckRepository } from '../../repositories/deckRepository';

interface DeckCardInput {
  cardId: string;
  qty: number;
}

export const deckService = {
  listMine(userId: string) {
    return deckRepository.findAllByUser(userId);
  },

  async getOwned(id: string, requesterId: string) {
    const deck = await deckRepository.findById(id);
    if (!deck) {
      throw new AppError('Deck não encontrado', 404);
    }
    if (deck.userId !== requesterId) {
      throw new AppError('Acesso negado', 403);
    }
    return deck;
  },

  create(userId: string, name: string, cards: DeckCardInput[]) {
    return deckRepository.create(userId, name, cards);
  },

  async update(id: string, requesterId: string, data: { name?: string; cards?: DeckCardInput[] }) {
    await deckService.getOwned(id, requesterId);
    return deckRepository.update(id, data);
  },

  async remove(id: string, requesterId: string) {
    await deckService.getOwned(id, requesterId);
    await deckRepository.remove(id);
  },
};
