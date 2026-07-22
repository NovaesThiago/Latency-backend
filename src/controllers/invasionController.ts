import { RequestHandler } from 'express';
import { invasionService } from '../services/invasion/invasionService';

export const start: RequestHandler = async (req, res, next) => {
  try {
    const invasion = await invasionService.start(req.user!.id, req.body.language);
    res.status(201).json(invasion);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const invasion = await invasionService.getState(req.params.id, req.user!.id);
    res.json(invasion);
  } catch (err) {
    next(err);
  }
};

export const submit: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const result = await invasionService.submitCode(req.params.id, req.user!.id, req.body.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const minigameResult: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const invasion = await invasionService.recordMinigameResult(req.params.id, req.user!.id, req.body.won);
    res.json(invasion);
  } catch (err) {
    next(err);
  }
};

export const usePowerUp: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const invasion = await invasionService.usePowerUp(req.params.id, req.user!.id, req.body.type);
    res.json(invasion);
  } catch (err) {
    next(err);
  }
};
