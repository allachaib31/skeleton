import { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { toast } from 'sonner';
import { API_ENDPOINTS } from './endpoints';

let isRefreshing = false;
let failedQueue: any[] = [];

const AUTH_401_NO_REFRESH_ENDPOINTS = new Set<string>([
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.TWO_FACTOR_VERIFY_LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.RESET_PASSWORD,
  API_ENDPOINTS.AUTH.VERIFY_EMAIL,
  API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
  API_ENDPOINTS.AUTH.REFRESH,
]);

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;
  return Array.from(AUTH_401_NO_REFRESH_ENDPOINTS).some((endpoint) => url.endsWith(endpoint));
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (api: AxiosInstance) => {
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      // Handle Network Error
      if (!error.response) {
        toast.error('Network error. Check your connection.');
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (
        error.response.status === 401 && 
        !originalRequest._retry && 
        !shouldSkipRefresh(originalRequest.url)
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await api.post<{ data: { accessToken: string } }>(API_ENDPOINTS.AUTH.REFRESH);
          const accessToken = response.data.data.accessToken;
          useAuthStore.getState().setAccessToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          isRefreshing = false;
          processQueue(null, accessToken);
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError, null);
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};
