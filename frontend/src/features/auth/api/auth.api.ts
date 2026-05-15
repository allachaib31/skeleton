import { api } from '@/shared/lib/api/axios';
import { ApiResponse } from '@/shared/types/api.types';
import { User } from '@/shared/types/auth.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshResponse, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ChangePasswordRequest 
} from '../types/auth.types';

export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
  return response.data;
};

export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

export const refreshToken = async (): Promise<ApiResponse<RefreshResponse>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
  return response.data;
};

export const verifyEmail = async (token: string): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  return response.data;
};

export const resendVerification = async (email: string): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  return response.data;
};

export const resetPassword = async (token: string, data: ResetPasswordRequest): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { ...data, token });
  return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
  const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  return response.data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await api.get(API_ENDPOINTS.AUTH.ME);
  return response.data;
};
