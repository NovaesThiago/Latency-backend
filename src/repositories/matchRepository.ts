import { prisma } from '../config/prisma';
import { MapNodeData } from '../services/engine/types';

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
};
