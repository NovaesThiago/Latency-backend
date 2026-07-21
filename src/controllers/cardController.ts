import { RequestHandler } from 'express';
import { cardService } from '../services/card/cardService';

export const list: RequestHandler = async (_req, res, next) => {
  try {
    const cards = await cardService.list();
    res.json(cards);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const card = await cardService.getById(req.params.id);
    res.json(card);
  } catch (err) {
    next(err);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const card = await cardService.create(req.body);
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const card = await cardService.update(req.params.id, req.body);
    res.json(card);
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    await cardService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
