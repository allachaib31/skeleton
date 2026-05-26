import axios from 'axios';
import { env } from '@/config/env.config';

export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // In a production app, you might try to refresh the token here
      // if using split access/refresh tokens.
      // The backend handles httpOnly cookies.
    }
    
    return Promise.reject(error);
  }
);
