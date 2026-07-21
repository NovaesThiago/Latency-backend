import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AppError } from '../../middlewares/AppError';
import { matchRepository } from '../../repositories/matchRepository';
import { cardService } from '../card/cardService';
import { CPU_OWNER_ID } from '../engine/ai/strategy';
import { EngineError } from '../engine/errors';
import { generateMap } from '../engine/map-generator';
import { MatchState, resolveAction, TurnAction } from '../engine/turn-resolver';

export type MatchWithBoard = NonNullable<Awaited<ReturnType<typeof matchRepository.findById>>>;

export function buildState(match: MatchWithBoard): MatchState {
  return {
    player1Id: match.player1Id,
    player2Id: match.player2Id ?? CPU_OWNER_ID,
    nodes: match.map!.nodes.map((n) => ({
      id: n.id,
      route: n.route,
      subrouteType: n.subrouteType,
      positionIndex: n.positionIndex,
      connections: n.connections as string[],
    })),
    units: match.units.map((u) => ({
      id: u.id,
      ownerId: u.ownerId,
      cardId: u.cardId,
      currentNodeId: u.currentNodeId,
      hp: u.hp,
      atk: u.atk,
      level: u.level,
      turnsInPosition: u.turnsInPosition,
      status: u.status,
    })),
  };
}

export type ResolveTurnInput =
  | { type: 'INVOCAR'; cardId: string; atNodeId: string }
  | { type: 'MOVER'; unitId: string; toNodeId: string }
  | { type: 'PASSAR_TURNO' };

export const matchService = {
  async createMatch(player1Id: string, params: { isVsCpu: boolean; player2Id?: string }) {
    if (!params.isVsCpu && !params.player2Id) {
      throw new AppError('player2Id é obrigatório quando isVsCpu for false', 400);
    }

    const seed = randomUUID();
    const generated = generateMap(seed);

    return matchRepository.create({
      player1Id,
      player2Id: params.isVsCpu ? null : (params.player2Id as string),
      isVsCpu: params.isVsCpu,
      templateId: generated.templateId,
      seed: generated.seed,
      nodes: generated.nodes,
    });
  },

  async getById(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw new AppError('Partida não encontrada', 404);
    }
    return match;
  },

  async resolveTurn(matchId: string, requesterId: string, input: ResolveTurnInput) {
    const match = await matchService.getById(matchId);
    if (match.status === 'FINALIZADA') {
      throw new AppError('Partida já finalizada', 400);
    }
    if (!match.map) {
      throw new AppError('Partida sem mapa gerado', 500);
    }

    const player2Id = match.player2Id ?? CPU_OWNER_ID;
    if (requesterId !== match.player1Id && requesterId !== player2Id) {
      throw new AppError('Você não faz parte desta partida', 403);
    }

    const state = buildState(match);

    let engineAction: TurnAction;
    let unitIdForLog: string | null = null;
    let fromNodeId: string | null = null;
    let toNodeId: string | null = null;

    if (input.type === 'INVOCAR') {
      const card = await cardService.getById(input.cardId);
      engineAction = {
        type: 'INVOCAR',
        ownerId: requesterId,
        cardId: card.id,
        atNodeId: input.atNodeId,
        hp: card.baseHp,
        atk: card.baseAtk,
      };
      toNodeId = input.atNodeId;
    } else if (input.type === 'MOVER') {
      const unit = state.units.find((u) => u.id === input.unitId);
      if (!unit) {
        throw new AppError('Unidade não encontrada', 404);
      }
      if (unit.ownerId !== requesterId) {
        throw new AppError('Você não pode mover uma unidade que não é sua', 403);
      }
      engineAction = { type: 'MOVER', unitId: input.unitId, toNodeId: input.toNodeId };
      unitIdForLog = input.unitId;
      fromNodeId = unit.currentNodeId;
      toNodeId = input.toNodeId;
    } else {
      engineAction = { type: 'PASSAR_TURNO' };
    }

    let result;
    try {
      result = resolveAction(state, engineAction);
    } catch (err) {
      if (err instanceof EngineError) {
        throw new AppError(err.message, 400);
      }
      throw err;
    }

    const originalIds = new Set(state.units.map((u) => u.id));
    for (const unit of result.units) {
      if (originalIds.has(unit.id)) {
        await matchRepository.updateFieldUnit(unit);
      } else {
        await matchRepository.createFieldUnit(matchId, unit);
        unitIdForLog = unit.id;
      }
    }

    let player1CoreHp = match.player1CoreHp;
    let player2CoreHp = match.player2CoreHp;
    for (const event of result.events) {
      if (event.type === 'CORE_DANIFICADO') {
        if (event.targetOwnerId === match.player1Id) {
          player1CoreHp = Math.max(0, player1CoreHp - event.amount);
        } else {
          player2CoreHp = Math.max(0, player2CoreHp - event.amount);
        }
      }
    }

    const matchUpdate: Prisma.MatchUpdateInput = { player1CoreHp, player2CoreHp };
    if (player1CoreHp <= 0 || player2CoreHp <= 0) {
      matchUpdate.status = 'FINALIZADA';
      matchUpdate.endedAt = new Date();
      matchUpdate.winnerId = player1CoreHp <= 0 ? player2Id : match.player1Id;
    }
    await matchRepository.updateMatch(matchId, matchUpdate);

    const turnNumber = (await matchRepository.countMoves(matchId)) + 1;
    await matchRepository.createMove({
      matchId,
      turnNumber,
      unitId: unitIdForLog,
      fromNodeId,
      toNodeId,
      actionType: input.type,
      payload: { events: result.events },
    });

    return { match: await matchService.getById(matchId), events: result.events };
  },
};
