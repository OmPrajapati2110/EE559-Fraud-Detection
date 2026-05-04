import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { assignmentQueue, googleCalendarQueue, notificationQueue } from '../workers/queue';

export async function getAssignmentsInRange(start: Date, end: Date) {
  return prisma.choreAssignment.findMany({
    where: {
      dueDate: { gte: start, lte: end },
    },
    include: {
      chore: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { chore: { priority: 'asc' } }],
  });
}

export async function getAssignment(id: string) {
  const assignment = await prisma.choreAssignment.findUnique({
    where: { id },
    include: {
      chore: { include: { recurrenceRule: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!assignment) throw new AppError(404, 'NotFound', 'Assignment not found');
  return assignment;
}

export async function createAssignment(choreId: string, userId: string, dueDate: Date) {
  const [chore, user] = await Promise.all([
    prisma.chore.findUnique({ where: { id: choreId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!chore) throw new AppError(404, 'NotFound', 'Chore not found');
  if (!user) throw new AppError(404, 'NotFound', 'User not found');

  const assignment = await prisma.choreAssignment.create({
    data: { choreId, userId, dueDate },
    include: {
      chore: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await notificationQueue.add('notify-assigned', { assignmentId: assignment.id, type: 'ASSIGNED' });
  await googleCalendarQueue.add('sync-calendar', { assignmentId: assignment.id });

  return assignment;
}

export async function updateAssignment(id: string, data: { userId?: string; dueDate?: Date }) {
  await getAssignment(id);

  const assignment = await prisma.choreAssignment.update({
    where: { id },
    data: {
      userId: data.userId,
      dueDate: data.dueDate,
    },
    include: {
      chore: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (assignment.googleEventId) {
    await googleCalendarQueue.add('sync-calendar', { assignmentId: assignment.id });
  }

  return assignment;
}

export async function deleteAssignment(id: string) {
  const assignment = await getAssignment(id);
  if (assignment.isCompleted) {
    throw new AppError(400, 'BadRequest', 'Cannot delete a completed assignment');
  }

  if (assignment.googleEventId) {
    await googleCalendarQueue.add('delete-calendar', {
      assignmentId: id,
      googleEventId: assignment.googleEventId,
      userId: assignment.userId,
    });
  }

  return prisma.choreAssignment.delete({ where: { id } });
}

export async function completeAssignment(id: string, adminId: string, notes?: string) {
  const assignment = await getAssignment(id);
  if (assignment.isCompleted) {
    throw new AppError(400, 'BadRequest', 'Assignment already completed');
  }

  const now = new Date();

  const [updated] = await prisma.$transaction([
    prisma.choreAssignment.update({
      where: { id },
      data: { isCompleted: true, completedAt: now, completedByAdminId: adminId },
    }),
    prisma.choreHistory.create({
      data: {
        choreId: assignment.choreId,
        assignmentId: id,
        completedById: assignment.userId,
        adminId,
        completedAt: now,
        dueDate: assignment.dueDate,
        notes,
      },
    }),
  ]);

  return updated;
}

export async function uncompleteAssignment(id: string) {
  const assignment = await getAssignment(id);
  if (!assignment.isCompleted) {
    throw new AppError(400, 'BadRequest', 'Assignment is not completed');
  }

  await prisma.$transaction([
    prisma.choreAssignment.update({
      where: { id },
      data: { isCompleted: false, completedAt: null, completedByAdminId: null },
    }),
    prisma.choreHistory.delete({ where: { assignmentId: id } }),
  ]);

  return getAssignment(id);
}

export async function getChoreAssignments(choreId: string) {
  return prisma.choreAssignment.findMany({
    where: { choreId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}
