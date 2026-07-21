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

test('nós internos conectam ao vizinho anterior e posterior dentro da mesma rota', () => {
  const map = generateMap('seed-teste');
  const norteNodes = map.nodes
    .filter((n) => n.route === 'NORTE')
    .sort((a, b) => a.positionIndex - b.positionIndex);

  assert.ok(norteNodes.length >= 3, 'template deveria ter ao menos 3 nós para testar um nó interno');
  const middle = norteNodes[1];

  assert.equal(middle.connections.length, 2);
  assert.ok(middle.connections.includes(norteNodes[0].id));
  assert.ok(middle.connections.includes(norteNodes[2].id));
});

test('o mesmo seed sempre produz o mesmo template (determinístico)', () => {
  const mapA = generateMap('seed-fixo');
  const mapB = generateMap('seed-fixo');

  assert.equal(mapA.templateId, mapB.templateId);
  assert.equal(mapA.nodes.length, mapB.nodes.length);
});
