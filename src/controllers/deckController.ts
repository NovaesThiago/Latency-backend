import { RequestHandler } from 'express';
import { deckService } from '../services/deck/deckService';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const decks = await deckService.listMine(req.user!.id);
    res.json(decks);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const deck = await deckService.getOwned(req.params.id, req.user!.id);
    res.json(deck);
  } catch (err) {
    next(err);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const { name, cards } = req.body;
    const deck = await deckService.create(req.user!.id, name, cards);
    res.status(201).json(deck);
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const deck = await deckService.update(req.params.id, req.user!.id, req.body);
    res.json(deck);
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    await deckService.remove(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
