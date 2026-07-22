import { invasionEvents } from '../../realtime/invasionEvents';
import { invasionRepository } from '../../repositories/invasionRepository';
import { generateRivalLine } from '../ai/aiChatService';
import { DAMAGE_PER_LAYER, LAYER_COUNT, RIVAL_TICK_MAX_MS, RIVAL_TICK_MIN_MS } from './constants';

const timers = new Map<string, NodeJS.Timeout>();

function randomDelay(): number {
  return RIVAL_TICK_MIN_MS + Math.random() * (RIVAL_TICK_MAX_MS - RIVAL_TICK_MIN_MS);
}

async function sendRivalChatMessage(invasionId: string, ctx: Parameters<typeof generateRivalLine>[0]) {
  invasionEvents.emitEvent('ai:typing', { invasionId, typing: true });
  const line = await generateRivalLine(ctx);
  invasionEvents.emitEvent('ai:typing', { invasionId, typing: false });
  const message = await invasionRepository.createChatMessage({
    invasion: { connect: { id: invasionId } },
    sender: 'RIVAL_AI',
    content: line,
  });
  invasionEvents.emitEvent('chat:message', {
    invasionId,
    sender: 'RIVAL_AI',
    content: line,
    createdAt: message.createdAt.toISOString(),
  });
}

async function tick(invasionId: string) {
  const invasion = await invasionRepository.findById(invasionId);
  if (!invasion || invasion.status !== 'EM_ANDAMENTO') {
    timers.delete(invasionId);
    return;
  }

  // powerup do jogador pausa a IA sem cancelar o ciclo — só adia o próximo tick
  if (invasion.rivalDisabledUntil && invasion.rivalDisabledUntil.getTime() > Date.now()) {
    const wait = invasion.rivalDisabledUntil.getTime() - Date.now() + 500;
    timers.set(invasionId, setTimeout(() => tick(invasionId), wait));
    return;
  }

  const rivalLayer = Math.min(LAYER_COUNT, Math.floor((100 - invasion.playerIntegrity) / DAMAGE_PER_LAYER) + 1);
  const newPlayerIntegrity = Math.max(0, invasion.playerIntegrity - DAMAGE_PER_LAYER);
  const finished = newPlayerIntegrity === 0;

  const updated = await invasionRepository.update(invasionId, {
    playerIntegrity: newPlayerIntegrity,
    ...(finished ? { status: 'FINALIZADA', winnerSide: 'RIVAL', endedAt: new Date() } : {}),
  });

  invasionEvents.emitEvent('layer:cleared', { invasionId, layerNumber: rivalLayer, side: 'RIVAL' });
  invasionEvents.emitEvent('network:update', {
    invasionId,
    playerIntegrity: updated.playerIntegrity,
    rivalIntegrity: updated.rivalIntegrity,
  });

  await sendRivalChatMessage(invasionId, {
    event: finished ? 'match_won' : 'rival_layer_cleared',
    playerIntegrity: updated.playerIntegrity,
    rivalIntegrity: updated.rivalIntegrity,
    layerNumber: rivalLayer,
  });

  if (finished) {
    invasionEvents.emitEvent('match:finished', { invasionId, winnerSide: 'RIVAL' });
    timers.delete(invasionId);
    return;
  }

  timers.set(invasionId, setTimeout(() => tick(invasionId), randomDelay()));
}

export const rivalPacingService = {
  start(invasionId: string) {
    if (timers.has(invasionId)) return;
    timers.set(invasionId, setTimeout(() => tick(invasionId), randomDelay()));
  },

  stop(invasionId: string) {
    const handle = timers.get(invasionId);
    if (handle) {
      clearTimeout(handle);
      timers.delete(invasionId);
    }
  },

  /** Usado pelo invasionService pra disparar uma reação do rival fora do tick
   * normal (jogador limpou camada, usou powerup, venceu a partida). */
  reactNow: sendRivalChatMessage,
};
