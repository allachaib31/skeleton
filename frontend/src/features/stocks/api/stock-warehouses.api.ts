import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  BulkUpdateStockWarehouseItemsRequest,
  CreateStockWarehouseItemRequest,
  CreateStockWarehouseRequest,
  ImportStockWarehouseItemsRequest,
  StockWarehouse,
  StockWarehouseFilters,
  StockWarehouseItem,
  StockWarehouseItemFilters,
  UpdateStockWarehouseItemRequest,
  UpdateStockWarehouseRequest,
} from '../types/stock-warehouse.types';

export const getStockWarehouses = async (params: StockWarehouseFilters): Promise<ApiResponse<StockWarehouse[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_WAREHOUSES, { params });
  return response.data;
};

export const createStockWarehouse = async (data: CreateStockWarehouseRequest): Promise<ApiResponse<StockWarehouse>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_WAREHOUSES, data);
  return response.data;
};

export const updateStockWarehouse = async (id: string, data: UpdateStockWarehouseRequest): Promise<ApiResponse<StockWarehouse>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_BY_ID(id), data);
  return response.data;
};

export const getStockWarehouseItems = async (params: StockWarehouseItemFilters): Promise<ApiResponse<StockWarehouseItem[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_ITEMS, { params });
  return response.data;
};

export const createStockWarehouseItem = async (data: CreateStockWarehouseItemRequest): Promise<ApiResponse<StockWarehouseItem>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_ITEMS, data);
  return response.data;
};

export const importStockWarehouseItems = async (data: ImportStockWarehouseItemsRequest): Promise<ApiResponse<{ importedCount: number }>> => {
  const response = await api.post(`${API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_ITEMS}/import`, data);
  return response.data;
};

export const updateStockWarehouseItem = async (id: string, data: UpdateStockWarehouseItemRequest): Promise<ApiResponse<StockWarehouseItem>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_ITEMS}/${id}`, data);
  return response.data;
};

export const bulkUpdateStockWarehouseItems = async (data: BulkUpdateStockWarehouseItemsRequest): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_WAREHOUSE_ITEMS}/bulk`, data);
  return response.data;
};
