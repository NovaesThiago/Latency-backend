import { Router } from 'express';
import { create, getById, list, remove, update } from '../controllers/challengeController';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { createChallengeSchema, updateChallengeSchema } from '../validators/challengeValidator';

export const challengeRoutes = Router();

/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: Lista o catálogo de desafios (algoritmos)
 *     tags: [Challenge]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [JAVASCRIPT, TYPESCRIPT, CSHARP, C]
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [FACIL, MEDIO, DIFICIL]
 *     responses:
 *       200:
 *         description: Lista de desafios
 */
challengeRoutes.get('/', list);

/**
 * @openapi
 * /challenges/{id}:
 *   get:
 *     summary: Busca um desafio pelo id
 *     tags: [Challenge]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desafio encontrado
 *       404:
 *         description: Desafio não encontrado
 */
challengeRoutes.get('/:id', getById);

/**
 * @openapi
 * /challenges:
 *   post:
 *     summary: Cria um novo desafio (apenas ADMIN)
 *     tags: [Challenge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [language, difficulty, title, prompt, helpSignature, testCases]
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [JAVASCRIPT, TYPESCRIPT, CSHARP, C]
 *               difficulty:
 *                 type: string
 *                 enum: [FACIL, MEDIO, DIFICIL]
 *               title:
 *                 type: string
 *               prompt:
 *                 type: string
 *               helpSignature:
 *                 type: string
 *               starterCode:
 *                 type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *               isBonus:
 *                 type: boolean
 *               points:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Desafio criado
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
challengeRoutes.post('/', authenticate, requireRole('ADMIN'), validate(createChallengeSchema), create);

/**
 * @openapi
 * /challenges/{id}:
 *   put:
 *     summary: Atualiza um desafio (apenas ADMIN)
 *     tags: [Challenge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desafio atualizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Desafio não encontrado
 */
challengeRoutes.put('/:id', authenticate, requireRole('ADMIN'), validate(updateChallengeSchema), update);

/**
 * @openapi
 * /challenges/{id}:
 *   delete:
 *     summary: Remove um desafio (apenas ADMIN)
 *     tags: [Challenge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Desafio removido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Desafio não encontrado
 */
challengeRoutes.delete('/:id', authenticate, requireRole('ADMIN'), remove);
