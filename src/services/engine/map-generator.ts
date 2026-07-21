import { randomUUID } from 'crypto';
import { EngineError } from './errors';
import { GeneratedMap, MapNodeData, Route } from './types';

/**
 * Fase 3 (seções 4.1 e 7 do plano): 3 rotas completas (Norte/Central/Sul).
 * Cada rota tem uma subrota de treinamento (TREINAMENTO) e uma direta (DIRETA)
 * que se bifurcam depois da base e se reencontram num "gateway" antes do core
 * inimigo — não é geração de grafo livre, é sorteio entre templates fixos
 * (comprimento da subrota de treino) + validação BFS pós-geração.
 * positionIndex 0 = base do player1, maior positionIndex da rota = base do player2.
 */
const ROUTES: Route[] = ['NORTE', 'CENTRAL', 'SUL'];
const TRAINING_LENGTHS = [3, 4, 5];

export function generateMap(seed: string): GeneratedMap {
  const nodes: MapNodeData[] = [];
  const trainingLengthByRoute: Record<string, number> = {};

  for (const route of ROUTES) {
    const trainingLength = pickTrainingLength(seed, route);
    trainingLengthByRoute[route] = trainingLength;

    const routeNodes = buildRouteWithSubroute(route, trainingLength);
    assertPathExists(routeNodes, routeNodes[0].id, routeNodes[routeNodes.length - 1].id);
    nodes.push(...routeNodes);
  }

  const templateId = ROUTES.map((route) => `${route}${trainingLengthByRoute[route]}`).join('-');

  return { templateId, seed, nodes };
}

function pickTrainingLength(seed: string, route: Route): number {
  const hash = hashString(`${seed}:${route}`);
  return TRAINING_LENGTHS[hash % TRAINING_LENGTHS.length];
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function makeNode(route: Route, subrouteType: 'DIRETA' | 'TREINAMENTO', positionIndex: number): MapNodeData {
  return { id: randomUUID(), route, subrouteType, positionIndex, connections: [] };
}

function link(a: MapNodeData, b: MapNodeData): void {
  a.connections.push(b.id);
  b.connections.push(a.id);
}

/**
 * base -> fork -> {direto} e {treino1..treinoN} -> gateway -> pré-core -> core.
 * As duas subrotas se reencontram no gateway antes de seguir para o core inimigo.
 */
function buildRouteWithSubroute(route: Route, trainingLength: number): MapNodeData[] {
  const base = makeNode(route, 'DIRETA', 0);
  const fork = makeNode(route, 'DIRETA', 1);
  const direct = makeNode(route, 'DIRETA', 2);
  const trainNodes = Array.from({ length: trainingLength }, (_, i) => makeNode(route, 'TREINAMENTO', 2 + i));
  const gateway = makeNode(route, 'DIRETA', 2 + trainingLength);
  const preCore = makeNode(route, 'DIRETA', 3 + trainingLength);
  const core = makeNode(route, 'DIRETA', 4 + trainingLength);

  link(base, fork);
  link(fork, direct);
  link(direct, gateway);

  link(fork, trainNodes[0]);
  for (let i = 0; i < trainNodes.length - 1; i += 1) {
    link(trainNodes[i], trainNodes[i + 1]);
  }
  link(trainNodes[trainNodes.length - 1], gateway);

  link(gateway, preCore);
  link(preCore, core);

  return [base, fork, direct, ...trainNodes, gateway, preCore, core];
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
