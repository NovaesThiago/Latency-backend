import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { AppError } from './middlewares/AppError';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/authRoutes';
import { cardRoutes } from './routes/cardRoutes';
import { deckRoutes } from './routes/deckRoutes';
import { matchRoutes } from './routes/matchRoutes';

export const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/cards', cardRoutes);
app.use('/decks', deckRoutes);
app.use('/matches', matchRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandler);
