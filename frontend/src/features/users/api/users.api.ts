import { api } from '@/shared/lib/api/axios';
import { ApiResponse } from '@/shared/types/api.types';
import { User, Session } from '@/shared/types/auth.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await api.get(API_ENDPOINTS.USERS.ME);
  return response.data;
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
  const response = await api.patch(API_ENDPOINTS.USERS.ME, data);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.patch(API_ENDPOINTS.USERS.AVATAR, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAccount = async (password: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(API_ENDPOINTS.USERS.ME, { data: { password } });
  return response.data;
};

export const getMySessions = async (): Promise<ApiResponse<Session[]>> => {
  const response = await api.get(API_ENDPOINTS.USERS.SESSIONS);
  return response.data;
};

export const revokeSession = async (sessionId: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(API_ENDPOINTS.USERS.SESSION_BY_ID(sessionId));
  return response.data;
};
