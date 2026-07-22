import { EventEmitter } from 'events';
import { ChatSender, InvasionWinner, PowerUpType } from '@prisma/client';

/**
 * Barramento de eventos de domínio da invasão — desacopla `invasionService`/
 * `rivalPacingService` do Socket.IO: os services só emitem "o que aconteceu",
 * o `invasionGateway` é quem sabe transformar isso em mensagens de socket.
 * Evita import circular (gateway → service → gateway).
 */
export interface InvasionEventMap {
  'network:update': { invasionId: string; playerIntegrity: number; rivalIntegrity: number };
  'layer:cleared': { invasionId: string; layerNumber: number; side: 'PLAYER' | 'RIVAL' };
  'chat:message': { invasionId: string; sender: ChatSender; content: string; createdAt: string };
  'ai:typing': { invasionId: string; typing: boolean };
  'powerup:used': { invasionId: string; type: PowerUpType };
  'match:finished': { invasionId: string; winnerSide: InvasionWinner };
}

class InvasionEventBus extends EventEmitter {
  emitEvent<K extends keyof InvasionEventMap>(event: K, payload: InvasionEventMap[K]) {
    this.emit(event, payload);
  }

  onEvent<K extends keyof InvasionEventMap>(event: K, listener: (payload: InvasionEventMap[K]) => void) {
    this.on(event, listener);
  }
}

export const invasionEvents = new InvasionEventBus();
