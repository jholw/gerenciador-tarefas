import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR' | 'GUEST';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'done';

export type SprintStatus = 'planning' | 'active' | 'completed';

export type ProjectStatus = 'active' | 'archived';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export type ChatMessageType = 'text' | 'system' | 'task_update';

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';