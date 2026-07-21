import { z } from 'zod';

const deckCardSchema = z.object({
  cardId: z.string().uuid(),
  qty: z.number().int().min(1),
});

export const createDeckSchema = z.object({
  name: z.string().min(1, 'nome é obrigatório'),
  cards: z.array(deckCardSchema).min(1, 'deck precisa de ao menos 1 carta'),
});

export const updateDeckSchema = z.object({
  name: z.string().min(1).optional(),
  cards: z.array(deckCardSchema).min(1).optional(),
});
