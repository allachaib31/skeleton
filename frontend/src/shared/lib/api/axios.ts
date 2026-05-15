import axios from 'axios';
import { env } from '@/config/env.config';
import i18n from '@/config/i18n';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language;

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
