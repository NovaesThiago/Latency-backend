import { z } from 'zod';

export const registerSchema = z.object({
  nickname: z
    .string()
    .min(3, 'nickname deve ter ao menos 3 caracteres')
    .max(20, 'nickname deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'nickname só pode ter letras, números e underscore'),
  email: z.string().email('email inválido'),
  password: z.string().min(6, 'senha deve ter ao menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(1, 'senha é obrigatória'),
});
