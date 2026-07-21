import { Router } from 'express';
import { login, me, register } from '../controllers/authController';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validators/authValidator';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.get('/me', authenticate, me);
