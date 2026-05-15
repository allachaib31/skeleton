import axios, { AxiosError } from 'axios';

export const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

export const parseApiError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as any;
    return data?.message || error.message || 'An unexpected error occurred';
  }
  return (error as Error).message || 'An unexpected error occurred';
};

export const parseFieldErrors = (error: unknown): Record<string, string> => {
  if (isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.reduce((acc: Record<string, string>, err: any) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
    }
  }
  return {};
};
