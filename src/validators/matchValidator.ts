import { z } from 'zod';

export const createMatchSchema = z.object({
  isVsCpu: z.boolean(),
  player2Id: z.string().uuid().optional(),
});

const summonSchema = z.object({
  type: z.literal('INVOCAR'),
  cardId: z.string().uuid(),
  // opcional: cartas de suprimento não ocupam um nó do tabuleiro
  atNodeId: z.string().uuid().optional(),
});

const moveSchema = z.object({
  type: z.literal('MOVER'),
  unitId: z.string().uuid(),
  toNodeId: z.string().uuid(),
});

const passSchema = z.object({
  type: z.literal('PASSAR_TURNO'),
});

export const resolveTurnSchema = z.discriminatedUnion('type', [summonSchema, moveSchema, passSchema]);
