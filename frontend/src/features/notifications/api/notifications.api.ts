import { api } from '@/shared/lib/api/axios';
import { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

interface RawNotification extends Omit<Notification, 'read'> {
  read?: boolean;
  isRead?: boolean;
}

interface NotificationsPayload {
  data: RawNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const normalizeNotification = (notification: RawNotification): Notification => ({
  ...notification,
  read: notification.read ?? notification.isRead ?? false,
});

export const getNotifications = async (params: PaginationQuery): Promise<ApiResponse<Notification[]>> => {
  const response = await api.get<ApiResponse<NotificationsPayload | RawNotification[]>>(
    API_ENDPOINTS.NOTIFICATIONS.LIST,
    { params }
  );
  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return {
      ...response.data,
      data: payload.map(normalizeNotification),
    };
  }

  const { data, total, page, limit, totalPages } = payload;
  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return {
    ...response.data,
    data: data.map(normalizeNotification),
    meta,
  };
};

export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return response.data;
};

export const markAsRead = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  return response.data;
};

export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  return response.data;
};

export const deleteNotification = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_BY_ID(id));
  return response.data;
};
