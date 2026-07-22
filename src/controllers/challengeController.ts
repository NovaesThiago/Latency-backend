import { RequestHandler } from 'express';
import { ChallengeDifficulty, Language } from '@prisma/client';
import { challengeService } from '../services/challenge/challengeService';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const language = req.query.language as Language | undefined;
    const difficulty = req.query.difficulty as ChallengeDifficulty | undefined;
    const challenges = await challengeService.list({ language, difficulty });
    res.json(challenges);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const challenge = await challengeService.getById(req.params.id);
    res.json(challenge);
  } catch (err) {
    next(err);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const challenge = await challengeService.create(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const challenge = await challengeService.update(req.params.id, req.body);
    res.json(challenge);
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    await challengeService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
