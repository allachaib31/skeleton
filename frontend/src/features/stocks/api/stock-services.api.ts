import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse, PaginationQuery } from '@/shared/types/api.types';
import { CreateStockServiceRequest, StockService, UpdateStockServiceRequest } from '../types/stock-service.types';

export const getStockServices = async (params: PaginationQuery): Promise<ApiResponse<StockService[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_SERVICES, { params });
  return response.data;
};

export const createStockService = async (
  data: CreateStockServiceRequest
): Promise<ApiResponse<StockService>> => {
  const formData = new FormData();
  formData.append('name', JSON.stringify(data.name));
  formData.append('description', JSON.stringify(data.description));
  formData.append('type', data.type);
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  formData.append('image', data.image);

  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_SERVICES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateStockService = async (
  id: string,
  data: UpdateStockServiceRequest
): Promise<ApiResponse<StockService>> => {
  const formData = new FormData();
  formData.append('name', JSON.stringify(data.name));
  formData.append('description', JSON.stringify(data.description));
  formData.append('type', data.type);
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  if (data.image) formData.append('image', data.image);

  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_SERVICE_BY_ID(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const reorderStockServices = async (orderedIds: string[]): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_SERVICES}/reorder`, { orderedIds });
  return response.data;
};
