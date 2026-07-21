import { RequestHandler } from 'express';
import { AppError } from './AppError';

export function requireRole(role: string): RequestHandler {
  return (req, _res, next) => {
    if (req.user?.role !== role) {
      next(new AppError('Acesso negado', 403));
      return;
    }
    next();
  };
}
