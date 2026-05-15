import { api } from '@/shared/lib/api/axios';
import { ApiResponse } from '@/shared/types/api.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';

export interface LanguageInfo {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  isCustom: boolean;
  updatedAt?: string;
}

export interface UploadLanguageRequest {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  file: File;
}

export const getLanguages = async (): Promise<ApiResponse<LanguageInfo[]>> => {
  const response = await api.get(API_ENDPOINTS.I18N.LANGUAGES);
  return response.data;
};

export const getLanguageBundle = async (code: string): Promise<ApiResponse<Record<string, unknown>>> => {
  const response = await api.get(API_ENDPOINTS.I18N.LANGUAGE_BY_CODE(code));
  return response.data;
};

export const getAdminLanguages = async (): Promise<ApiResponse<LanguageInfo[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.LANGUAGES);
  return response.data;
};

export const uploadLanguage = async (data: UploadLanguageRequest): Promise<ApiResponse<LanguageInfo>> => {
  const formData = new FormData();
  formData.append('code', data.code);
  formData.append('name', data.name);
  formData.append('direction', data.direction);
  formData.append('file', data.file);

  const response = await api.post(API_ENDPOINTS.ADMIN.LANGUAGES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const downloadLanguageTemplate = async (): Promise<Blob> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.LANGUAGE_TEMPLATE, {
    responseType: 'blob',
  });
  return response.data;
};
