import { z } from 'zod';

export const languageEnum = z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'CSHARP', 'C']);
export const challengeDifficultyEnum = z.enum(['FACIL', 'MEDIO', 'DIFICIL']);

const testCaseSchema = z.object({
  input: z.array(z.string()),
  expectedOutput: z.string(),
});

export const createChallengeSchema = z.object({
  language: languageEnum,
  difficulty: challengeDifficultyEnum,
  title: z.string().min(1, 'título é obrigatório'),
  prompt: z.string().min(1, 'enunciado é obrigatório'),
  helpSignature: z.string().min(1, 'assinatura de ajuda é obrigatória'),
  starterCode: z.string().optional(),
  testCases: z.array(testCaseSchema).min(1, 'pelo menos 1 caso de teste é obrigatório'),
  isBonus: z.boolean().optional(),
  points: z.number().int().min(0).optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial();

export const listChallengeQuerySchema = z.object({
  language: languageEnum.optional(),
  difficulty: challengeDifficultyEnum.optional(),
});
