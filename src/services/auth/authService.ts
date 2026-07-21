import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/AppError';
import { userRepository } from '../../repositories/userRepository';

const SALT_ROUNDS = 10;

function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, { expiresIn: '7d' });
}

export const authService = {
  async register(email: string, password: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('E-mail já cadastrado', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ email, passwordHash });

    return { token: signToken(user.id, user.role), user: { id: user.id, email: user.email, role: user.role } };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError('Credenciais inválidas', 401);
    }

    return { token: signToken(user.id, user.role), user: { id: user.id, email: user.email, role: user.role } };
  },
};
