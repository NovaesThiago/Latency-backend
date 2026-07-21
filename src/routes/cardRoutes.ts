import { Router } from 'express';
import { create, getById, list, remove, update } from '../controllers/cardController';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { createCardSchema, updateCardSchema } from '../validators/cardValidator';

export const cardRoutes = Router();

/**
 * @openapi
 * /cards:
 *   get:
 *     summary: Lista todas as cartas
 *     tags: [Card]
 *     responses:
 *       200:
 *         description: Lista de cartas
 */
cardRoutes.get('/', list);

/**
 * @openapi
 * /cards/{id}:
 *   get:
 *     summary: Busca uma carta pelo id
 *     tags: [Card]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carta encontrada
 *       404:
 *         description: Carta não encontrada
 */
cardRoutes.get('/:id', getById);

/**
 * @openapi
 * /cards:
 *   post:
 *     summary: Cria uma nova carta (apenas ADMIN)
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, baseAtk, baseHp, cost, movePattern, evolucaoCurva]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [UNIDADE, ESTRUTURA, FEITICO]
 *               baseAtk:
 *                 type: integer
 *               baseHp:
 *                 type: integer
 *               cost:
 *                 type: integer
 *               movePattern:
 *                 type: object
 *               evolucaoCurva:
 *                 type: object
 *     responses:
 *       201:
 *         description: Carta criada
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
cardRoutes.post('/', authenticate, requireRole('ADMIN'), validate(createCardSchema), create);

/**
 * @openapi
 * /cards/{id}:
 *   put:
 *     summary: Atualiza uma carta (apenas ADMIN)
 *     tags: [Card]
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
 *         description: Carta atualizada
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Carta não encontrada
 */
cardRoutes.put('/:id', authenticate, requireRole('ADMIN'), validate(updateCardSchema), update);

/**
 * @openapi
 * /cards/{id}:
 *   delete:
 *     summary: Remove uma carta (apenas ADMIN)
 *     tags: [Card]
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
 *         description: Carta removida
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Carta não encontrada
 */
cardRoutes.delete('/:id', authenticate, requireRole('ADMIN'), remove);
