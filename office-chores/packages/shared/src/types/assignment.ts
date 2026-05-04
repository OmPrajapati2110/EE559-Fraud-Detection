import type { UserSummary } from './user';
import type { Priority } from './chore';

export interface ChoreAssignment {
  id: string;
  choreId: string;
  choreTitle: string;
  choreDescription: string | null;
  priority: Priority;
  userId: string;
  user: UserSummary;
  dueDate: string; // ISO date string
  isCompleted: boolean;
  completedAt: string | null;
  completedByAdminId: string | null;
  googleEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    assignmentId: string;
    choreId: string;
    priority: Priority;
    assigneeName: string;
    assigneeId: string;
    isCompleted: boolean;
  };
}
