import { Request, Response, NextFunction } from 'express';
import * as choreService from '../services/chore.service';
import { getChoreAssignments } from '../services/assignment.service';

export async function listChores(req: Request, res: Response, next: NextFunction) {
  try {
    const chores = await choreService.listChores();
    res.json({ chores });
  } catch (err) { next(err); }
}

export async function getChore(req: Request, res: Response, next: NextFunction) {
  try {
    const chore = await choreService.getChore(req.params.id);
    res.json(chore);
  } catch (err) { next(err); }
}

export async function createChore(req: Request, res: Response, next: NextFunction) {
  try {
    const chore = await choreService.createChore(req.body);
    res.status(201).json(chore);
  } catch (err) { next(err); }
}

export async function updateChore(req: Request, res: Response, next: NextFunction) {
  try {
    const chore = await choreService.updateChore(req.params.id, req.body);
    res.json(chore);
  } catch (err) { next(err); }
}

export async function deleteChore(req: Request, res: Response, next: NextFunction) {
  try {
    await choreService.deactivateChore(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getChoreAssignmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const assignments = await getChoreAssignments(req.params.id);
    res.json({ assignments });
  } catch (err) { next(err); }
}

export async function previewRecurrence(req: Request, res: Response, next: NextFunction) {
  try {
    const n = Math.min(Number(req.query.n) || 6, 12);
    const occurrences = await choreService.previewOccurrences(req.params.id, n);
    res.json({ occurrences });
  } catch (err) { next(err); }
}
