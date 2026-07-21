import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AppError } from '../../middlewares/AppError';
import { deckRepository } from '../../repositories/deckRepository';
import { matchRepository } from '../../repositories/matchRepository';
import { cardService } from '../card/cardService';
import { deckService } from '../deck/deckService';
import { FeatureSnapshot } from '../engine/ai/adaptation';
import { CPU_OWNER_ID } from '../engine/ai/strategy';
import { EngineError } from '../engine/errors';
import { generateMap } from '../engine/map-generator';
import { EvolutionCurve, MatchState, MAX_STAMINA, resolveAction, TurnAction } from '../engine/turn-resolver';

const HAND_SIZE = 4;
const STARTER_DECK_NAME = 'Deck Inicial';

export type MatchWithBoard = NonNullable<Awaited<ReturnType<typeof matchRepository.findById>>>;

export async function buildState(match: MatchWithBoard): Promise<MatchState> {
  const cards = await cardService.list();
  const cardById = new Map(cards.map((c) => [c.id, c]));

  return {
    player1Id: match.player1Id,
    player2Id: match.player2Id ?? CPU_OWNER_ID,
    player1Stamina: match.player1Stamina,
    player2Stamina: match.player2Stamina,
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
      evolucaoCurva: cardById.get(u.cardId)?.evolucaoCurva as EvolutionCurve | undefined,
    })),
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function expandDeckToMultiset(deck: { cards: { cardId: string; qty: number }[] }): string[] {
  const multiset: string[] = [];
  for (const deckCard of deck.cards) {
    for (let i = 0; i < deckCard.qty; i += 1) {
      multiset.push(deckCard.cardId);
    }
  }
  return multiset;
}

async function autoCreateStarterDeck(userId: string) {
  const cards = await cardService.list();
  if (cards.length === 0) {
    throw new AppError('Nenhuma carta cadastrada ainda — peça para um admin cadastrar cartas antes de jogar', 400);
  }
  const payload = cards.map((c) => ({ cardId: c.id, qty: c.type === 'SUPRIMENTO' ? 3 : 2 }));
  return deckService.create(userId, STARTER_DECK_NAME, payload);
}

async function drawInitialHand(userId: string): Promise<{ deckId: string; hand: string[]; drawPile: string[] }> {
  const decks = await deckService.listMine(userId);
  const deck = decks[0] ?? (await autoCreateStarterDeck(userId));
  const multiset = shuffle(expandDeckToMultiset(deck));

  return {
    deckId: deck.id,
    hand: multiset.slice(0, HAND_SIZE),
    drawPile: multiset.slice(HAND_SIZE),
  };
}

async function drawNextCard(deckId: string | null, currentDrawPile: string[]): Promise<{ drawn: string | null; drawPile: string[] }> {
  let pile = [...currentDrawPile];
  if (pile.length === 0 && deckId) {
    const deck = await deckRepository.findById(deckId);
    if (deck) {
      pile = shuffle(expandDeckToMultiset(deck));
    }
  }
  const drawn = pile.shift() ?? null;
  return { drawn, drawPile: pile };
}

export type ResolveTurnInput =
  | { type: 'INVOCAR'; cardId: string; atNodeId?: string }
  | { type: 'MOVER'; unitId: string; toNodeId: string }
  | { type: 'PASSAR_TURNO' };

export const matchService = {
  async createMatch(player1Id: string, params: { isVsCpu: boolean; player2Id?: string }) {
    if (!params.isVsCpu && !params.player2Id) {
      throw new AppError('player2Id é obrigatório quando isVsCpu for false', 400);
    }

    const seed = randomUUID();
    const generated = generateMap(seed);
    const { deckId, hand, drawPile } = await drawInitialHand(player1Id);

    return matchRepository.create({
      player1Id,
      player2Id: params.isVsCpu ? null : (params.player2Id as string),
      isVsCpu: params.isVsCpu,
      templateId: generated.templateId,
      seed: generated.seed,
      nodes: generated.nodes,
      player1DeckId: deckId,
      player1Hand: hand,
      player1DrawPile: drawPile,
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

    const isHumanPlayer1 = requesterId === match.player1Id;
    const state = await buildState(match);

    let engineAction: TurnAction;
    let unitIdForLog: string | null = null;
    let fromNodeId: string | null = null;
    let toNodeId: string | null = null;

    if (input.type === 'INVOCAR') {
      if (isHumanPlayer1 && !(match.player1Hand as string[]).includes(input.cardId)) {
        throw new AppError('Essa carta não está na sua mão', 400);
      }

      const card = await cardService.getById(input.cardId);

      if (card.type === 'SUPRIMENTO') {
        engineAction = { type: 'ABASTECER', ownerId: requesterId, staminaGrant: card.staminaGrant };
      } else {
        if (!input.atNodeId) {
          throw new AppError('atNodeId é obrigatório para invocar uma unidade', 400);
        }
        engineAction = {
          type: 'INVOCAR',
          ownerId: requesterId,
          cardId: card.id,
          atNodeId: input.atNodeId,
          hp: card.baseHp,
          atk: card.baseAtk,
          cost: card.cost,
          evolucaoCurva: card.evolucaoCurva as EvolutionCurve,
        };
        toNodeId = input.atNodeId;
      }
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
      engineAction = { type: 'PASSAR_TURNO', ownerId: requesterId };
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
    let player1Stamina = match.player1Stamina;
    let player2Stamina = match.player2Stamina;
    for (const event of result.events) {
      if (event.type === 'CORE_DANIFICADO') {
        if (event.targetOwnerId === match.player1Id) {
          player1CoreHp = Math.max(0, player1CoreHp - event.amount);
        } else {
          player2CoreHp = Math.max(0, player2CoreHp - event.amount);
        }
      } else if (event.type === 'ESTAMINA_ALTERADA') {
        if (event.ownerId === match.player1Id) {
          player1Stamina = Math.min(MAX_STAMINA, Math.max(0, player1Stamina + event.amount));
        } else {
          player2Stamina = Math.min(MAX_STAMINA, Math.max(0, player2Stamina + event.amount));
        }
      }
    }

    const matchUpdate: Prisma.MatchUpdateInput = {
      player1CoreHp,
      player2CoreHp,
      player1Stamina,
      player2Stamina,
    };
    if (player1CoreHp <= 0 || player2CoreHp <= 0) {
      matchUpdate.status = 'FINALIZADA';
      matchUpdate.endedAt = new Date();
      matchUpdate.winnerId = player1CoreHp <= 0 ? player2Id : match.player1Id;
    }

    if (isHumanPlayer1 && input.type === 'INVOCAR') {
      const hand = [...(match.player1Hand as string[])];
      const idx = hand.indexOf(input.cardId);
      if (idx !== -1) {
        hand.splice(idx, 1);
        const { drawn, drawPile } = await drawNextCard(match.player1DeckId, match.player1DrawPile as string[]);
        if (drawn) {
          hand.push(drawn);
        }
        matchUpdate.player1Hand = hand;
        matchUpdate.player1DrawPile = drawPile;
      }
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

    if (isHumanPlayer1) {
      const targetNode = toNodeId ? state.nodes.find((n) => n.id === toNodeId) : undefined;
      const snapshot: FeatureSnapshot = {
        actionType: input.type,
        route: targetNode?.route,
        usedTrainingSubroute: input.type === 'MOVER' ? targetNode?.subrouteType === 'TREINAMENTO' : undefined,
      };
      await matchRepository.recordObservation(matchId, turnNumber, snapshot);
    }

    return { match: await matchService.getById(matchId), events: result.events };
  },
};
