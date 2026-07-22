import { z } from 'zod';
import { languageEnum } from './challengeValidator';

export const startInvasionSchema = z.object({
  language: languageEnum,
});

export const submitCodeSchema = z.object({
  code: z.string().min(1, 'código é obrigatório'),
});

export const minigameResultSchema = z.object({
  won: z.boolean(),
});

export const usePowerUpSchema = z.object({
  type: z.enum(['PROPAGANDA', 'DESCONEXAO']),
});
