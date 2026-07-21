import { RequestHandler } from 'express';
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
    const result = await matchService.resolveTurn(req.params.id, req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
