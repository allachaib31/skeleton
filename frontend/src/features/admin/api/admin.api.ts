import { api } from '@/shared/lib/api/axios';
import { ApiResponse, PaginationQuery } from '@/shared/types/api.types';
import { User, Role } from '@/shared/types/auth.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { 
  DashboardData, 
  UserDetail, 
  AuditLog, 
  AuditLogQuery, 
  HealthData, 
  MetricsData,
  PermissionGroup, 
  Upload,
  CreateRoleRequest,
  UpdateRoleRequest,
  UserStatus
} from '../types/admin.types';

const normalizePaginatedResponse = <T>(response: ApiResponse<T[] | any>): ApiResponse<T[]> => {
  const payload = response.data;

  if (Array.isArray(payload)) {
    return response as ApiResponse<T[]>;
  }

  if (payload && Array.isArray(payload.data)) {
    const { data, ...meta } = payload;
    return {
      ...response,
      data,
      meta: {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        limit: meta.limit ?? data.length,
        totalPages: meta.totalPages ?? 1,
        hasNext: meta.page < meta.totalPages,
        hasPrev: meta.page > 1,
      },
    };
  }

  return {
    ...response,
    data: [],
  };
};

export const getDashboard = async (): Promise<ApiResponse<DashboardData>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD);
  const raw = response.data.data as any;
  const system = raw.system ?? {};

  return {
    ...response.data,
    data: {
      totalUsers: raw.totalUsers ?? raw.users?.total ?? 0,
      newUsersToday: raw.newUsersToday ?? raw.users?.new?.today ?? 0,
      newUsersWeek: raw.newUsersWeek ?? raw.users?.new?.week ?? 0,
      usersByStatus: raw.usersByStatus ?? raw.users?.byStatus ?? {},
      totalUploads: raw.totalUploads ?? raw.storage?.totalUploads ?? 0,
      recentAuditLogs: raw.recentAuditLogs ?? [],
      system: {
        status: system.status ?? 'degraded',
        db: system.db ?? true,
        redis: system.redis ?? true,
        memory: system.memory ?? { heapUsed: 0, heapTotal: 1 },
        uptime: system.uptime ?? 0,
      },
    },
  };
};

export const getUsers = async (params: PaginationQuery & { status?: string; role?: string; search?: string }): Promise<ApiResponse<User[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.USERS, { params });
  return normalizePaginatedResponse<User>(response.data);
};

export const getUserById = async (id: string): Promise<ApiResponse<UserDetail>> => {
  const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  return response.data;
};

export const updateUserStatus = async (id: string, status: UserStatus): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.USERS}/${id}/status`, { status });
  return response.data;
};

export const updateUserRole = async (id: string, roleId: string): Promise<ApiResponse<null>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.USER_ROLES(id), { roleId });
  return response.data;
};

export const deleteUser = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  return response.data;
};

export const getRoles = async (): Promise<ApiResponse<Role[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.ROLES);
  return response.data;
};

export const createRole = async (data: CreateRoleRequest): Promise<ApiResponse<Role>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.ROLES, data);
  return response.data;
};

export const updateRole = async (id: string, data: UpdateRoleRequest): Promise<ApiResponse<Role>> => {
  const response = await api.put(`${API_ENDPOINTS.ADMIN.ROLES}/${id}`, data);
  return response.data;
};

export const deleteRole = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`${API_ENDPOINTS.ADMIN.ROLES}/${id}`);
  return response.data;
};

export const getPermissions = async (): Promise<ApiResponse<PermissionGroup[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.PERMISSIONS);
  return response.data;
};

export const getAuditLogs = async (params: AuditLogQuery): Promise<ApiResponse<AuditLog[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
  return normalizePaginatedResponse<AuditLog>(response.data);
};

export const getUploads = async (params: PaginationQuery): Promise<ApiResponse<Upload[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.UPLOADS, { params });
  return normalizePaginatedResponse<Upload>(response.data);
};

export const deleteUpload = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`${API_ENDPOINTS.ADMIN.UPLOADS}/${id}`);
  return response.data;
};

export const getSystemHealth = async (): Promise<ApiResponse<HealthData>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.HEALTH);
  return response.data;
};

export const getSystemMetrics = async (): Promise<ApiResponse<MetricsData>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.METRICS);
  return response.data;
};
