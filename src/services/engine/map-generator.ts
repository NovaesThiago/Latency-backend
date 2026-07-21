import { randomUUID } from 'crypto';
import { EngineError } from './errors';
import { GeneratedMap, MapNodeData, Route } from './types';

/**
 * Fase 3 (seção 7 do plano): 3 rotas completas (Norte/Central/Sul), cada uma
 * sorteando entre alguns comprimentos fixos a partir do seed — não é um gerador
 * de grafo livre, é sorteio entre templates + validação BFS pós-geração.
 * positionIndex 0 = base do player1, maior positionIndex da rota = base do player2.
 */
const ROUTES: Route[] = ['NORTE', 'CENTRAL', 'SUL'];
const TEMPLATE_LENGTHS = [4, 5, 6];

export function generateMap(seed: string): GeneratedMap {
  const nodes: MapNodeData[] = [];
  const lengthByRoute: Record<string, number> = {};

  for (const route of ROUTES) {
    const length = pickTemplateLength(seed, route);
    lengthByRoute[route] = length;

    const routeNodes = buildLinearRoute(route, length);
    assertPathExists(routeNodes, routeNodes[0].id, routeNodes[routeNodes.length - 1].id);
    nodes.push(...routeNodes);
  }

  const templateId = ROUTES.map((route) => `${route}${lengthByRoute[route]}`).join('-');

  return { templateId, seed, nodes };
}

function pickTemplateLength(seed: string, route: Route): number {
  const hash = hashString(`${seed}:${route}`);
  return TEMPLATE_LENGTHS[hash % TEMPLATE_LENGTHS.length];
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildLinearRoute(route: Route, length: number): MapNodeData[] {
  const nodes: MapNodeData[] = Array.from({ length }, (_, index) => ({
    id: randomUUID(),
    route,
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

  return nodes;
}

/**
 * Validação de conectividade (seção 7): BFS deve alcançar o nó de destino a
 * partir do nó de origem antes de persistir o mapa.
 */
function assertPathExists(nodes: MapNodeData[], fromId: string, toId: string): void {
  if (nodes.length === 0) {
    throw new EngineError('Mapa gerado sem nós');
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>([fromId]);
  const queue = [fromId];

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

  if (!visited.has(toId)) {
    throw new EngineError('Mapa gerado não conecta a base do jogador ao core inimigo');
  }
}
