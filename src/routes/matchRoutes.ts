import { Router } from 'express';
import { create, getById, resolveTurn } from '../controllers/matchController';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createMatchSchema, resolveTurnSchema } from '../validators/matchValidator';

export const matchRoutes = Router();

matchRoutes.use(authenticate);

matchRoutes.post('/', validate(createMatchSchema), create);
matchRoutes.get('/:id', getById);
matchRoutes.post('/:id/turn', validate(resolveTurnSchema), resolveTurn);
