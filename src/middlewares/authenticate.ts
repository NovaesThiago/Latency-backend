import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/userRepository';
import { AppError } from './AppError';

interface TokenPayload {
  sub: string;
  role: string;
}

/** Além de validar a assinatura do JWT, confirma que o usuário ainda existe
 * no banco — um token assinado com um `sub` de um usuário apagado (ou de um
 * banco antigo/resetado) vira 401 limpo aqui, em vez de estourar um erro de
 * FK mais adiante (ex.: criar uma Invasion pra um playerId inexistente). */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Token de autenticação ausente', 401));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      next(new AppError('Sessão inválida — faça login novamente', 401));
      return;
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    next(new AppError('Token de autenticação inválido', 401));
  }
};
