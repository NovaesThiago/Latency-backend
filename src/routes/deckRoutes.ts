import { Router } from 'express';
import { create, getById, list, remove, update } from '../controllers/deckController';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createDeckSchema, updateDeckSchema } from '../validators/deckValidator';

export const deckRoutes = Router();

deckRoutes.use(authenticate);

/**
 * @openapi
 * /decks:
 *   get:
 *     summary: Lista os decks do usuário autenticado
 *     tags: [Deck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de decks
 */
deckRoutes.get('/', list);

/**
 * @openapi
 * /decks/{id}:
 *   get:
 *     summary: Busca um deck do usuário autenticado
 *     tags: [Deck]
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
 *         description: Deck encontrado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Deck não encontrado
 */
deckRoutes.get('/:id', getById);

/**
 * @openapi
 * /decks:
 *   post:
 *     summary: Cria um deck para o usuário autenticado
 *     tags: [Deck]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cards]
 *             properties:
 *               name:
 *                 type: string
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cardId:
 *                       type: string
 *                     qty:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Deck criado
 *       400:
 *         description: Dados inválidos
 */
deckRoutes.post('/', validate(createDeckSchema), create);

/**
 * @openapi
 * /decks/{id}:
 *   put:
 *     summary: Atualiza um deck do usuário autenticado
 *     tags: [Deck]
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
 *         description: Deck atualizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Deck não encontrado
 */
deckRoutes.put('/:id', validate(updateDeckSchema), update);

/**
 * @openapi
 * /decks/{id}:
 *   delete:
 *     summary: Remove um deck do usuário autenticado
 *     tags: [Deck]
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
 *         description: Deck removido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Deck não encontrado
 */
deckRoutes.delete('/:id', remove);
