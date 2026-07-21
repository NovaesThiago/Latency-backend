import { ErrorRequestHandler } from 'express';
import { AppError } from './AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ status: err.status, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ status: 500, message: 'Erro interno do servidor' });
};
