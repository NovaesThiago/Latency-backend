import { z } from 'zod';

export const cardTypeEnum = z.enum(['UNIDADE', 'ESTRUTURA', 'FEITICO', 'SUPRIMENTO']);

export const createCardSchema = z.object({
  name: z.string().min(1, 'nome é obrigatório'),
  description: z.string().optional(),
  type: cardTypeEnum,
  baseAtk: z.number().int().min(0),
  baseHp: z.number().int().min(0),
  cost: z.number().int().min(0),
  staminaGrant: z.number().int().min(0).optional(),
  movePattern: z.record(z.string(), z.unknown()),
  evolucaoCurva: z.record(z.string(), z.unknown()),
});

export const updateCardSchema = createCardSchema.partial();
