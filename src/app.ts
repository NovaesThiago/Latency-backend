import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { AppError } from './middlewares/AppError';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/authRoutes';

export const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandler);
