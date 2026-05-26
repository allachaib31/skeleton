import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  StockProductRequirement,
  StockProductRequirementFilters,
  StockProductRequirementPayload,
} from '../types/stock-product-requirement.types';

export const getStockProductRequirements = async (
  params: StockProductRequirementFilters
): Promise<ApiResponse<StockProductRequirement[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_REQUIREMENTS, { params });
  return response.data;
};

export const createStockProductRequirement = async (
  data: StockProductRequirementPayload
): Promise<ApiResponse<StockProductRequirement>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_REQUIREMENTS, data);
  return response.data;
};

export const updateStockProductRequirement = async (
  id: string,
  data: StockProductRequirementPayload
): Promise<ApiResponse<StockProductRequirement>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_REQUIREMENT_BY_ID(id), data);
  return response.data;
};
