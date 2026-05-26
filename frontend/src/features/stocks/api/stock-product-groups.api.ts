import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse, PaginationQuery } from '@/shared/types/api.types';
import { CreateStockProductGroupRequest, StockProductGroup } from '../types/stock-product-group.types';

export const getStockProductGroups = async (params: PaginationQuery): Promise<ApiResponse<StockProductGroup[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_GROUPS, { params });
  return response.data;
};

export const createStockProductGroup = async (
  data: CreateStockProductGroupRequest
): Promise<ApiResponse<StockProductGroup>> => {
  const formData = new FormData();
  formData.append('name', JSON.stringify(data.name));
  formData.append('description', JSON.stringify(data.description));
  formData.append('image', data.image);
  formData.append('coverImage', data.coverImage);

  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_GROUPS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
