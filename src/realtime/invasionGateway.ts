import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { invasionRepository } from '../repositories/invasionRepository';
import { invasionEvents } from './invasionEvents';

interface TokenPayload {
  sub: string;
  role: string;
}

/**
 * Tempo real da invasão: uma room por `invasionId`. `invasionService`/
 * `rivalPacingService` não conhecem o socket — só emitem em `invasionEvents`
 * (ver esse arquivo); aqui a gente só escuta e repassa pra room certa.
 */
export function initInvasionGateway(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Token de autenticação ausente'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Token de autenticação inválido'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('invasion:join', async ({ invasionId }: { invasionId: string }, ack?: (ok: boolean) => void) => {
      const invasion = await invasionRepository.findById(invasionId);
      if (!invasion || invasion.playerId !== socket.data.userId) {
        ack?.(false);
        return;
      }
      socket.join(invasionId);
      ack?.(true);
    });
  });

  invasionEvents.onEvent('network:update', (payload) => io.to(payload.invasionId).emit('network:update', payload));
  invasionEvents.onEvent('layer:cleared', (payload) => io.to(payload.invasionId).emit('layer:cleared', payload));
  invasionEvents.onEvent('chat:message', (payload) => io.to(payload.invasionId).emit('chat:message', payload));
  invasionEvents.onEvent('ai:typing', (payload) => io.to(payload.invasionId).emit('ai:typing', payload));
  invasionEvents.onEvent('powerup:used', (payload) => io.to(payload.invasionId).emit('powerup:used', payload));
  invasionEvents.onEvent('match:finished', (payload) => io.to(payload.invasionId).emit('match:finished', payload));

  return io;
}
