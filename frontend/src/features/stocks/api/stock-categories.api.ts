import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse, PaginationQuery } from '@/shared/types/api.types';
import { CreateStockCategoryRequest, StockCategory, UpdateStockCategoryRequest } from '../types/stock-category.types';

export const getStockCategories = async (params: PaginationQuery): Promise<ApiResponse<StockCategory[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_CATEGORIES, { params });
  return response.data;
};

export const createStockCategory = async (
  data: CreateStockCategoryRequest
): Promise<ApiResponse<StockCategory>> => {
  const formData = new FormData();
  formData.append('name', JSON.stringify(data.name));
  formData.append('description', JSON.stringify(data.description));
  formData.append('serviceId', data.serviceId);
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  formData.append('image', data.image);

  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_CATEGORIES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateStockCategory = async (
  id: string,
  data: UpdateStockCategoryRequest
): Promise<ApiResponse<StockCategory>> => {
  const formData = new FormData();
  formData.append('name', JSON.stringify(data.name));
  formData.append('description', JSON.stringify(data.description));
  formData.append('serviceId', data.serviceId);
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  if (data.image) formData.append('image', data.image);

  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_CATEGORY_BY_ID(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const reorderStockCategories = async (orderedIds: string[]): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_CATEGORIES}/reorder`, { orderedIds });
  return response.data;
};
