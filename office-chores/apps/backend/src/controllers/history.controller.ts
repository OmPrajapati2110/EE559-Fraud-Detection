import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function listHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = '1',
      limit = '20',
      userId,
      choreId,
      startDate,
      endDate,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (userId) where.completedById = userId;
    if (choreId) where.choreId = choreId;
    if (startDate || endDate) {
      where.completedAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [total, history] = await Promise.all([
      prisma.choreHistory.count({ where }),
      prisma.choreHistory.findMany({
        where,
        include: {
          chore: { select: { id: true, title: true } },
          completedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({ history, total, page: pageNum, limit: limitNum });
  } catch (err) { next(err); }
}

export async function getHistoryEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.choreHistory.findUnique({
      where: { id: req.params.id },
      include: {
        chore: { select: { id: true, title: true } },
        completedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!entry) {
      res.status(404).json({ error: 'NotFound', message: 'History entry not found' });
      return;
    }
    res.json(entry);
  } catch (err) { next(err); }
}
