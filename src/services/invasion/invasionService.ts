import { ChallengeDifficulty, Language, PowerUpType } from '@prisma/client';
import { AppError } from '../../middlewares/AppError';
import { invasionEvents } from '../../realtime/invasionEvents';
import { challengeRepository } from '../../repositories/challengeRepository';
import { invasionRepository } from '../../repositories/invasionRepository';
import { DAMAGE_PER_LAYER, LAYER_COUNT } from './constants';
import { judgeChallenge, TestCase } from '../judge/judgeService';
import { rivalPacingService } from './rivalPacingService';

function difficultyForLayer(layerNumber: number): ChallengeDifficulty {
  if (layerNumber <= 2) return 'FACIL';
  if (layerNumber <= 4) return 'MEDIO';
  return 'DIFICIL';
}

async function assertOwned(invasionId: string, playerId: string) {
  const invasion = await invasionRepository.findById(invasionId);
  if (!invasion) {
    throw new AppError('Invasão não encontrada', 404);
  }
  if (invasion.playerId !== playerId) {
    throw new AppError('Essa invasão não pertence a você', 403);
  }
  return invasion;
}

export const invasionService = {
  async start(playerId: string, language: Language) {
    const picks = await Promise.all(
      Array.from({ length: LAYER_COUNT }, (_, i) => i + 1).map(async (layerNumber) => {
        const challenge = await challengeRepository.pickRandom(language, difficultyForLayer(layerNumber));
        if (!challenge) {
          throw new AppError(
            `Sem desafios cadastrados para ${language}/${difficultyForLayer(layerNumber)} — cadastre pelo /challenges antes de iniciar uma invasão nessa linguagem`,
            400,
          );
        }
        return { layerNumber, challengeId: challenge.id };
      }),
    );

    const invasion = await invasionRepository.create({
      player: { connect: { id: playerId } },
      language,
      layers: { create: picks },
    });

    rivalPacingService.start(invasion.id);
    return invasion;
  },

  async getState(invasionId: string, playerId: string) {
    return assertOwned(invasionId, playerId);
  },

  async submitCode(invasionId: string, playerId: string, code: string) {
    const invasion = await assertOwned(invasionId, playerId);
    if (invasion.status !== 'EM_ANDAMENTO') {
      throw new AppError('Essa invasão já terminou', 400);
    }

    const layer = invasion.layers.find((l) => l.layerNumber === invasion.currentLayer);
    if (!layer) {
      throw new AppError('Camada atual inválida', 400);
    }
    if (layer.clearedAt) {
      throw new AppError('Essa camada já foi derrubada — jogue o minigame pra avançar', 400);
    }

    const verdict = await judgeChallenge(invasion.language, code, layer.challenge.testCases as unknown as TestCase[]);

    await invasionRepository.createAttempt({
      invasion: { connect: { id: invasionId } },
      challenge: { connect: { id: layer.challengeId } },
      code,
      passed: verdict.passed,
      judgeOutput: verdict.message,
    });

    if (!verdict.passed) {
      return { verdict, invasion };
    }

    await invasionRepository.updateLayer(invasionId, layer.layerNumber, { clearedAt: new Date() });

    const newRivalIntegrity = Math.max(0, invasion.rivalIntegrity - DAMAGE_PER_LAYER);
    const finished = newRivalIntegrity === 0;
    const updated = await invasionRepository.update(invasionId, {
      rivalIntegrity: newRivalIntegrity,
      score: { increment: layer.challenge.points },
      ...(finished ? { status: 'FINALIZADA', winnerSide: 'PLAYER', endedAt: new Date() } : {}),
    });

    invasionEvents.emitEvent('layer:cleared', { invasionId, layerNumber: layer.layerNumber, side: 'PLAYER' });
    invasionEvents.emitEvent('network:update', {
      invasionId,
      playerIntegrity: updated.playerIntegrity,
      rivalIntegrity: updated.rivalIntegrity,
    });
    if (finished) {
      invasionEvents.emitEvent('match:finished', { invasionId, winnerSide: 'PLAYER' });
      rivalPacingService.stop(invasionId);
    }

    // dispara a reação do rival sem bloquear a resposta do submit (a fala chega
    // pelo socket alguns instantes depois, dando a sensação de "escrevendo...")
    void rivalPacingService.reactNow(invasionId, {
      event: finished ? 'match_lost' : 'player_layer_cleared',
      playerIntegrity: updated.playerIntegrity,
      rivalIntegrity: updated.rivalIntegrity,
      layerNumber: layer.layerNumber,
    });

    return { verdict, invasion: updated };
  },

  async recordMinigameResult(invasionId: string, playerId: string, won: boolean) {
    const invasion = await assertOwned(invasionId, playerId);
    if (invasion.status !== 'EM_ANDAMENTO') {
      throw new AppError('Essa invasão já terminou', 400);
    }

    const layer = invasion.layers.find((l) => l.layerNumber === invasion.currentLayer);
    if (!layer?.clearedAt) {
      throw new AppError('Resolva o desafio da camada antes de jogar o minigame', 400);
    }

    await invasionRepository.updateLayer(invasionId, layer.layerNumber, { miniGameWon: won });

    if (!won) {
      return invasionRepository.findById(invasionId);
    }

    if (invasion.currentLayer >= LAYER_COUNT) {
      const finished = await invasionRepository.update(invasionId, {
        status: 'FINALIZADA',
        winnerSide: 'PLAYER',
        endedAt: new Date(),
      });
      invasionEvents.emitEvent('match:finished', { invasionId, winnerSide: 'PLAYER' });
      rivalPacingService.stop(invasionId);
      void rivalPacingService.reactNow(invasionId, {
        event: 'match_lost',
        playerIntegrity: finished.playerIntegrity,
        rivalIntegrity: finished.rivalIntegrity,
      });
      return finished;
    }

    return invasionRepository.update(invasionId, { currentLayer: invasion.currentLayer + 1 });
  },

  async usePowerUp(invasionId: string, playerId: string, type: PowerUpType) {
    const invasion = await assertOwned(invasionId, playerId);
    if (invasion.status !== 'EM_ANDAMENTO') {
      throw new AppError('Essa invasão já terminou', 400);
    }

    const unlocked = await invasionRepository.hasPassedBonusAttempt(invasionId);
    if (!unlocked) {
      throw new AppError('Resolva um desafio bônus pra desbloquear power-ups', 403);
    }

    const durationMs = type === 'DESCONEXAO' ? 20_000 : 10_000;
    await invasionRepository.createPowerUpUse({ invasion: { connect: { id: invasionId } }, type });

    const updated = await invasionRepository.update(invasionId, { rivalDisabledUntil: new Date(Date.now() + durationMs) });
    invasionEvents.emitEvent('powerup:used', { invasionId, type });
    void rivalPacingService.reactNow(invasionId, {
      event: 'powerup_used_on_rival',
      playerIntegrity: updated.playerIntegrity,
      rivalIntegrity: updated.rivalIntegrity,
    });
    return updated;
  },
};
