import { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { toast } from 'sonner';
import { API_ENDPOINTS } from './endpoints';

let isRefreshing = false;
let failedQueue: any[] = [];

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
        originalRequest.url !== API_ENDPOINTS.AUTH.REFRESH
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
