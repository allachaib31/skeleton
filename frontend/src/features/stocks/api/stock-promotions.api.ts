import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  CreateStockPromotionRequest,
  StockPromotion,
  StockPromotionFilters,
  StockPromotionUsage,
  StockPromotionUsageFilters,
  UpdateStockPromotionRequest,
} from '../types/stock-promotion.types';

export const getStockPromotions = async (params: StockPromotionFilters): Promise<ApiResponse<StockPromotion[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PROMOTIONS, { params });
  return response.data;
};

export const getStockPromotionUsages = async (
  params: StockPromotionUsageFilters
): Promise<ApiResponse<StockPromotionUsage[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PROMOTION_USAGES, { params });
  return response.data;
};

export const createStockPromotion = async (data: CreateStockPromotionRequest): Promise<ApiResponse<StockPromotion>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PROMOTIONS, data);
  return response.data;
};

export const updateStockPromotion = async (
  id: string,
  data: UpdateStockPromotionRequest
): Promise<ApiResponse<StockPromotion>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_PROMOTION_BY_ID(id), data);
  return response.data;
};
