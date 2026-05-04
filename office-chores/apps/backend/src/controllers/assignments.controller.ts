import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/assignment.service';
import { AppError } from '../middleware/errorHandler';

export async function listAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    if (!start || !end) {
      throw new AppError(400, 'BadRequest', 'start and end query params are required');
    }
    const assignments = await assignmentService.getAssignmentsInRange(
      new Date(start),
      new Date(end)
    );
    res.json({ assignments });
  } catch (err) { next(err); }
}

export async function getAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.getAssignment(req.params.id);
    res.json(assignment);
  } catch (err) { next(err); }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { choreId, userId, dueDate } = req.body;
    const assignment = await assignmentService.createAssignment(choreId, userId, new Date(dueDate));
    res.status(201).json(assignment);
  } catch (err) { next(err); }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, dueDate } = req.body;
    const assignment = await assignmentService.updateAssignment(req.params.id, {
      userId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    res.json(assignment);
  } catch (err) { next(err); }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    await assignmentService.deleteAssignment(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function completeAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { notes } = req.body;
    const assignment = await assignmentService.completeAssignment(
      req.params.id,
      req.user!.sub,
      notes
    );
    res.json(assignment);
  } catch (err) { next(err); }
}

export async function uncompleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.uncompleteAssignment(req.params.id);
    res.json(assignment);
  } catch (err) { next(err); }
}
