import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateMap } from './map-generator';

test('gera um mapa linear totalmente conectado', () => {
  const map = generateMap('seed-teste');

  assert.equal(map.nodes.length, 5);
  assert.equal(map.nodes[0].positionIndex, 0);
  assert.equal(map.nodes[map.nodes.length - 1].positionIndex, 4);

  for (const node of map.nodes) {
    assert.ok(node.connections.length >= 1);
  }
});

test('nós internos conectam ao vizinho anterior e posterior', () => {
  const map = generateMap('seed-teste');
  const middle = map.nodes[2];

  assert.equal(middle.connections.length, 2);
  assert.ok(middle.connections.includes(map.nodes[1].id));
  assert.ok(middle.connections.includes(map.nodes[3].id));
});

test('o mesmo seed ainda produz a mesma topologia (Fase 2: 1 template fixo)', () => {
  const mapA = generateMap('seed-x');
  const mapB = generateMap('seed-y');

  assert.equal(mapA.templateId, mapB.templateId);
  assert.equal(mapA.nodes.length, mapB.nodes.length);
});
