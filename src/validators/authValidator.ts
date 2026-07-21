import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(6, 'senha deve ter ao menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(1, 'senha é obrigatória'),
});
