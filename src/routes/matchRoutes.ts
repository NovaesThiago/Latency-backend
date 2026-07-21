import { Router } from 'express';
import { create, getById, resolveTurn } from '../controllers/matchController';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createMatchSchema, resolveTurnSchema } from '../validators/matchValidator';

export const matchRoutes = Router();

matchRoutes.use(authenticate);

/**
 * @openapi
 * /matches:
 *   post:
 *     summary: Cria uma partida (contra outro jogador ou contra a CPU)
 *     tags: [Match]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isVsCpu]
 *             properties:
 *               isVsCpu:
 *                 type: boolean
 *               player2Id:
 *                 type: string
 *                 description: obrigatório quando isVsCpu for false
 *     responses:
 *       201:
 *         description: Partida criada com mapa gerado
 *       400:
 *         description: Dados inválidos
 */
matchRoutes.post('/', validate(createMatchSchema), create);

/**
 * @openapi
 * /matches/{id}:
 *   get:
 *     summary: Busca uma partida pelo id (mapa, unidades)
 *     tags: [Match]
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
 *         description: Partida encontrada
 *       404:
 *         description: Partida não encontrada
 */
matchRoutes.get('/:id', getById);

/**
 * @openapi
 * /matches/{id}/turn:
 *   post:
 *     summary: Executa uma ação de turno (invocar, mover ou passar) e retorna o resultado
 *     tags: [Match]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [type, cardId, atNodeId]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [INVOCAR]
 *                   cardId:
 *                     type: string
 *                   atNodeId:
 *                     type: string
 *               - type: object
 *                 required: [type, unitId, toNodeId]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [MOVER]
 *                   unitId:
 *                     type: string
 *                   toNodeId:
 *                     type: string
 *               - type: object
 *                 required: [type]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [PASSAR_TURNO]
 *     responses:
 *       200:
 *         description: Turno resolvido (inclui a resposta automática da CPU quando aplicável)
 *       400:
 *         description: Ação inválida (ex. movimento para nó não adjacente)
 *       403:
 *         description: Você não faz parte desta partida, ou a unidade não é sua
 *       404:
 *         description: Partida ou unidade não encontrada
 */
matchRoutes.post('/:id/turn', validate(resolveTurnSchema), resolveTurn);
