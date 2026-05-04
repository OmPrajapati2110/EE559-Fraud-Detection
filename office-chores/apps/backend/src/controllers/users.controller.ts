import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.listUsers();
    res.json({
      users: users.map((u: typeof users[number]) => ({ ...u, googleCalendarConnected: !!u.googleRefreshToken, googleRefreshToken: undefined })),
    });
  } catch (err) { next(err); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ ...user, googleCalendarConnected: !!user.googleRefreshToken, googleRefreshToken: undefined });
  } catch (err) { next(err); }
}

export async function inviteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name, role } = req.body;
    const user = await userService.inviteUser(email, name, role);
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Allow users to update themselves, or admins to update anyone
    const targetId = req.params.id;
    if (req.user!.role !== 'ADMIN' && req.user!.sub !== targetId) {
      res.status(403).json({ error: 'Forbidden', message: 'Cannot modify another user' });
      return;
    }
    const { name, slackUserId } = req.body;
    const user = await userService.updateUser(targetId, { name, slackUserId });
    res.json({ ...user, googleCalendarConnected: !!user.googleRefreshToken, googleRefreshToken: undefined });
  } catch (err) { next(err); }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const user = await userService.updateUserRole(req.params.id, role);
    res.json(user);
  } catch (err) { next(err); }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.deactivateUser(req.params.id);
    res.json(user);
  } catch (err) { next(err); }
}
