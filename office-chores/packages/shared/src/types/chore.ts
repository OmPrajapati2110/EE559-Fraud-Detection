export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RecurrenceRule {
  id: string;
  choreId: string;
  intervalWeeks: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startDate: string; // ISO date string
  endDate: string | null;
}

export interface Chore {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  isActive: boolean;
  recurrenceRule: RecurrenceRule | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreHistory {
  id: string;
  choreId: string;
  choreTitle: string;
  assignmentId: string;
  completedById: string;
  completedByName: string;
  adminId: string;
  adminName: string;
  completedAt: string;
  dueDate: string;
  notes: string | null;
  createdAt: string;
}
