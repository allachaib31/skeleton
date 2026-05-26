import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  CreateStockServiceGroupRequest,
  StockServiceGroup,
  StockServiceGroupFilters,
  UpdateStockServiceGroupRequest,
} from '../types/stock-service-group.types';

export const getStockServiceGroups = async (
  params: StockServiceGroupFilters
): Promise<ApiResponse<StockServiceGroup[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_SERVICE_GROUPS, { params });
  return response.data;
};

export const createStockServiceGroup = async (
  data: CreateStockServiceGroupRequest
): Promise<ApiResponse<StockServiceGroup>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_SERVICE_GROUPS, data);
  return response.data;
};

export const updateStockServiceGroup = async (
  id: string,
  data: UpdateStockServiceGroupRequest
): Promise<ApiResponse<StockServiceGroup>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_SERVICE_GROUP_BY_ID(id), data);
  return response.data;
};
