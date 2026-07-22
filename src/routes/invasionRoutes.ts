import { Router } from 'express';
import { getById, minigameResult, start, submit, usePowerUp } from '../controllers/invasionController';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { minigameResultSchema, startInvasionSchema, submitCodeSchema, usePowerUpSchema } from '../validators/invasionValidator';

export const invasionRoutes = Router();

invasionRoutes.use(authenticate);

/**
 * @openapi
 * /invasions:
 *   post:
 *     summary: Inicia uma nova invasão (partida) na linguagem escolhida
 *     tags: [Invasion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [language]
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [JAVASCRIPT, TYPESCRIPT, CSHARP, C]
 *     responses:
 *       201:
 *         description: Invasão criada com as 5 camadas sorteadas
 *       400:
 *         description: Sem desafios cadastrados suficientes pra essa linguagem
 */
invasionRoutes.post('/', validate(startInvasionSchema), start);

/**
 * @openapi
 * /invasions/{id}:
 *   get:
 *     summary: Estado atual da invasão
 *     tags: [Invasion]
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
 *         description: Estado da invasão
 *       403:
 *         description: Invasão não pertence ao usuário autenticado
 *       404:
 *         description: Invasão não encontrada
 */
invasionRoutes.get('/:id', getById);

/**
 * @openapi
 * /invasions/{id}/submit:
 *   post:
 *     summary: Submete o código do jogador pra camada atual
 *     tags: [Invasion]
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
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Veredito do judge + estado atualizado da invasão
 */
invasionRoutes.post('/:id/submit', validate(submitCodeSchema), submit);

/**
 * @openapi
 * /invasions/{id}/minigame-result:
 *   post:
 *     summary: Registra o resultado do minigame da camada atual
 *     tags: [Invasion]
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
 *             type: object
 *             required: [won]
 *             properties:
 *               won:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado atualizado da invasão
 */
invasionRoutes.post('/:id/minigame-result', validate(minigameResultSchema), minigameResult);

/**
 * @openapi
 * /invasions/{id}/powerup:
 *   post:
 *     summary: Usa um power-up contra a rede rival (exige desafio bônus resolvido)
 *     tags: [Invasion]
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
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PROPAGANDA, DESCONEXAO]
 *     responses:
 *       200:
 *         description: Estado atualizado da invasão
 *       403:
 *         description: Power-up ainda não desbloqueado
 */
invasionRoutes.post('/:id/powerup', validate(usePowerUpSchema), usePowerUp);
