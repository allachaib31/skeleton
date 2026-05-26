import { User, Permission, Session } from '@/shared/types/auth.types';
import { PaginationQuery } from '@/shared/types/api.types';

export type { UserStatus } from '@/shared/types/auth.types';

export interface DashboardData {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  usersByStatus: Record<string, number>;
  totalUploads: number;
  recentAuditLogs: AuditLog[];
  system: HealthData;
}

export interface UserDetail extends User {
  sessions: Session[];
  uploadCount: number;
}

export interface AuditLog {
  _id: string;
  actorId?: { name?: string; email?: string } | string | null;
  action: string;
  entity: string;
  targetId?: string;
  before?: any;
  after?: any;
  ip: string;
  createdAt: string;
}

export interface AuditLogQuery extends PaginationQuery {
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  actorId?: string;
}

export interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'ok';
  db: boolean;
  redis: boolean;
  memory: { heapUsed: number; heapTotal: number };
  uptime: number;
}

export interface MetricsData {
  cpu: number;
  memory: number;
  requestsPerSecond: number;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface Upload {
  _id: string;
  ownerId: { name: string; email: string };
  secureUrl: string;
  format: string;
  size: number;
  createdAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {}
