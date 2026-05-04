import type { User, Role } from './user';
import type { Chore, Priority, ChoreHistory } from './chore';
import type { ChoreAssignment } from './assignment';

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

// ── Users ────────────────────────────────────────────────────────────────────
export interface InviteUserRequest {
  email: string;
  name: string;
  role: Role;
}

export interface UpdateUserRequest {
  name?: string;
  slackUserId?: string;
}

export interface UpdateUserRoleRequest {
  role: Role;
}

export interface UsersListResponse {
  users: User[];
}

// ── Chores ───────────────────────────────────────────────────────────────────
export interface CreateChoreRequest {
  title: string;
  description?: string;
  priority: Priority;
  recurrenceRule?: {
    intervalWeeks: number;
    dayOfWeek: number;
    startDate: string;
    endDate?: string;
  };
}

export type UpdateChoreRequest = Partial<CreateChoreRequest>;

export interface ChoresListResponse {
  chores: Chore[];
}

export interface RecurrencePreviewResponse {
  occurrences: string[]; // ISO date strings
}

// ── Assignments ───────────────────────────────────────────────────────────────
export interface AssignmentsQueryParams {
  start: string;
  end: string;
}

export interface AssignmentsListResponse {
  assignments: ChoreAssignment[];
}

export interface CreateAssignmentRequest {
  choreId: string;
  userId: string;
  dueDate: string;
}

export interface UpdateAssignmentRequest {
  userId?: string;
  dueDate?: string;
}

export interface CompleteAssignmentRequest {
  notes?: string;
}

// ── History ───────────────────────────────────────────────────────────────────
export interface HistoryQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  choreId?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryListResponse {
  history: ChoreHistory[];
  total: number;
  page: number;
  limit: number;
}

// ── Integrations ──────────────────────────────────────────────────────────────
export interface UpdateSlackWebhookRequest {
  webhookUrl: string;
}

// ── Generic ───────────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
