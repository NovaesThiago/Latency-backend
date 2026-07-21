import { MoveActionType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { MapNodeData } from '../services/engine/types';
import { UnitState } from '../services/engine/turn-resolver';

const withBoard = {
  map: { include: { nodes: true } },
  units: true,
} as const;

export const matchRepository = {
  async create(params: {
    player1Id: string;
    player2Id: string | null;
    isVsCpu: boolean;
    templateId: string;
    seed: string;
    nodes: MapNodeData[];
  }) {
    const match = await prisma.match.create({
      data: {
        player1Id: params.player1Id,
        player2Id: params.player2Id,
        isVsCpu: params.isVsCpu,
      },
    });

    const map = await prisma.matchMap.create({
      data: {
        matchId: match.id,
        templateId: params.templateId,
        seed: params.seed,
      },
    });

    await prisma.mapNode.createMany({
      data: params.nodes.map((node) => ({
        id: node.id,
        matchMapId: map.id,
        route: node.route,
        subrouteType: node.subrouteType,
        positionIndex: node.positionIndex,
        connections: node.connections,
      })),
    });

    return matchRepository.findById(match.id);
  },

  findById(id: string) {
    return prisma.match.findUnique({ where: { id }, include: withBoard });
  },

  createFieldUnit(matchId: string, unit: UnitState) {
    return prisma.fieldUnit.create({
      data: {
        id: unit.id,
        matchId,
        ownerId: unit.ownerId,
        cardId: unit.cardId,
        currentNodeId: unit.currentNodeId,
        hp: unit.hp,
        atk: unit.atk,
        level: unit.level,
        turnsInPosition: unit.turnsInPosition,
        status: unit.status,
      },
    });
  },

  updateFieldUnit(unit: UnitState) {
    return prisma.fieldUnit.update({
      where: { id: unit.id },
      data: {
        currentNodeId: unit.currentNodeId,
        hp: unit.hp,
        atk: unit.atk,
        level: unit.level,
        turnsInPosition: unit.turnsInPosition,
        status: unit.status,
      },
    });
  },

  async countMoves(matchId: string): Promise<number> {
    return prisma.matchMove.count({ where: { matchId } });
  },

  createMove(params: {
    matchId: string;
    turnNumber: number;
    unitId: string | null;
    fromNodeId: string | null;
    toNodeId: string | null;
    actionType: MoveActionType;
    payload: unknown;
  }) {
    return prisma.matchMove.create({
      data: {
        matchId: params.matchId,
        turnNumber: params.turnNumber,
        unitId: params.unitId,
        fromNodeId: params.fromNodeId,
        toNodeId: params.toNodeId,
        actionType: params.actionType,
        payload: params.payload as Prisma.InputJsonValue,
      },
    });
  },

  updateMatch(id: string, data: Prisma.MatchUpdateInput) {
    return prisma.match.update({ where: { id }, data });
  },
};
