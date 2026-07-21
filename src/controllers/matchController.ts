import { RequestHandler } from 'express';
import { cpuService } from '../services/match/cpuService';
import { matchService } from '../services/match/matchService';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const match = await matchService.createMatch(req.user!.id, req.body);
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const match = await matchService.getById(req.params.id);
    res.json(match);
  } catch (err) {
    next(err);
  }
};

export const resolveTurn: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const playerResult = await matchService.resolveTurn(req.params.id, req.user!.id, req.body);

    // A resposta da CPU nunca deve derrubar o turno do jogador, que já foi
    // persistido com sucesso — uma falha aqui só significa que a CPU não jogou.
    let cpuResult: Awaited<ReturnType<typeof cpuService.playTurnIfApplicable>> = null;
    try {
      cpuResult = await cpuService.playTurnIfApplicable(req.params.id);
    } catch (cpuErr) {
      console.error('cpuService.playTurnIfApplicable falhou:', cpuErr);
    }

    res.json({
      match: cpuResult ? cpuResult.match : playerResult.match,
      events: [...playerResult.events, ...(cpuResult ? cpuResult.events : [])],
    });
  } catch (err) {
    next(err);
  }
};
