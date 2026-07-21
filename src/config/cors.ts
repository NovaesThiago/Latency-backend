import { CorsOptions } from 'cors';
import { env } from './env';

const LOCALHOST_ORIGIN = /^https?:\/\/localhost:\d+$/;

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || origin === env.corsOrigin || LOCALHOST_ORIGIN.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Bloqueado por CORS'));
  },
};
