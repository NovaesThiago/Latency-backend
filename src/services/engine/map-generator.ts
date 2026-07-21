import { randomUUID } from 'crypto';
import { EngineError } from './errors';
import { GeneratedMap, MapNodeData } from './types';

/**
 * Fase 2: 1 template fixo, 1 rota linear sem subrotas (seção 7 do plano trata
 * geração procedural com múltiplos templates + embaralhamento, isso fica para a Fase 3).
 * positionIndex 0 = base do player1, positionIndex TRACK_LENGTH - 1 = base do player2.
 */
const FIXED_TEMPLATE_ID = 'fase2-linear-norte';
const TRACK_LENGTH = 5;

export function generateMap(seed: string): GeneratedMap {
  const nodes: MapNodeData[] = Array.from({ length: TRACK_LENGTH }, (_, index) => ({
    id: randomUUID(),
    route: 'NORTE',
    subrouteType: 'DIRETA',
    positionIndex: index,
    connections: [],
  }));

  nodes.forEach((node, index) => {
    const neighborIds: string[] = [];
    if (index > 0) neighborIds.push(nodes[index - 1].id);
    if (index < nodes.length - 1) neighborIds.push(nodes[index + 1].id);
    node.connections = neighborIds;
  });

  assertConnected(nodes);

  return { templateId: FIXED_TEMPLATE_ID, seed, nodes };
}

/**
 * Validação de conectividade (seção 7): BFS a partir do primeiro nó deve alcançar
 * todos os outros antes de persistir o mapa.
 */
function assertConnected(nodes: MapNodeData[]): void {
  if (nodes.length === 0) {
    throw new EngineError('Mapa gerado sem nós');
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>([nodes[0].id]);
  const queue = [nodes[0].id];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const current = byId.get(currentId) as MapNodeData;
    for (const neighborId of current.connections) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  if (visited.size !== nodes.length) {
    throw new EngineError('Mapa gerado não é totalmente conectado');
  }
}
