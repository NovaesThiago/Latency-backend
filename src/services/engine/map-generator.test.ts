import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateMap } from './map-generator';

const ROUTES = ['NORTE', 'CENTRAL', 'SUL'];

test('gera as 3 rotas completas', () => {
  const map = generateMap('seed-teste');
  const routesPresent = new Set(map.nodes.map((n) => n.route));

  assert.deepEqual([...routesPresent].sort(), [...ROUTES].sort());
});

test('cada rota é totalmente conectada da base ao core', () => {
  const map = generateMap('seed-teste');

  for (const route of ROUTES) {
    const routeNodes = map.nodes.filter((n) => n.route === route).sort((a, b) => a.positionIndex - b.positionIndex);
    const base = routeNodes[0];
    const core = routeNodes[routeNodes.length - 1];

    assert.equal(base.positionIndex, 0);

    const visited = new Set([base.id]);
    const queue = [base.id];
    const byId = new Map(routeNodes.map((n) => [n.id, n]));
    while (queue.length > 0) {
      const current = byId.get(queue.shift() as string)!;
      for (const neighborId of current.connections) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    assert.ok(visited.has(core.id), `rota ${route} não conecta base ao core`);
  }
});

test('cada rota bifurca em treino/direta no fork e reconverge no gateway', () => {
  const map = generateMap('seed-teste');
  const norteNodes = map.nodes.filter((n) => n.route === 'NORTE');

  const base = norteNodes.find((n) => n.positionIndex === 0)!;
  const fork = norteNodes.find((n) => n.positionIndex === 1)!;
  const core = norteNodes.reduce((a, b) => (a.positionIndex > b.positionIndex ? a : b));

  assert.equal(base.connections.length, 1, 'base só deve conectar ao fork');

  const trainingNodes = norteNodes.filter((n) => n.subrouteType === 'TREINAMENTO');
  const directNodes = norteNodes.filter((n) => n.subrouteType === 'DIRETA' && n.positionIndex === 2);

  assert.ok(trainingNodes.length >= 3, 'subrota de treino deve ter ao menos 3 nós (seção 7 do plano)');
  assert.equal(directNodes.length, 1, 'deve haver exatamente 1 nó na subrota direta');

  // fork conecta à base, à subrota direta e ao início da subrota de treino
  assert.ok(fork.connections.includes(base.id));
  assert.ok(fork.connections.includes(directNodes[0].id));
  assert.ok(fork.connections.includes(trainingNodes[0].id));

  const gateway = norteNodes.find(
    (n) => n.connections.includes(directNodes[0].id) && n.id !== fork.id,
  )!;
  assert.ok(gateway.connections.includes(trainingNodes[trainingNodes.length - 1].id), 'gateway deve reconvergir as duas subrotas');

  assert.notEqual(core.id, gateway.id, 'core deve vir depois do gateway, não ser o próprio gateway');
});

test('o mesmo seed sempre produz o mesmo template (determinístico)', () => {
  const mapA = generateMap('seed-fixo');
  const mapB = generateMap('seed-fixo');

  assert.equal(mapA.templateId, mapB.templateId);
  assert.equal(mapA.nodes.length, mapB.nodes.length);
});
