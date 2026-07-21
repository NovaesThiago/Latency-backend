import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';

export const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
