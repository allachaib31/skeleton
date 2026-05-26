import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  BulkUpdateStockProductsRequest,
  ApiProductImportPreviewRequest,
  ApiProductImportPreviewRow,
  CreateStockProductRequest,
  ImportApiProductsRequest,
  ImportApiProductsResult,
  ProductApiConnectionRequest,
  StockProductApiConnection,
  StockProduct,
  StockProductFilters,
  UpdateStockProductRequest,
} from '../types/stock-product.types';

export const getStockProducts = async (params: StockProductFilters): Promise<ApiResponse<StockProduct[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PRODUCTS, { params });
  return response.data;
};

export const getStockProduct = async (id: string): Promise<ApiResponse<StockProduct>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_BY_ID(id));
  return response.data;
};

export const createStockProduct = async (data: CreateStockProductRequest): Promise<ApiResponse<unknown>> => {
  const formData = new FormData();
  formData.append('serviceId', data.serviceId);
  formData.append('categoryId', data.categoryId);
  if (data.groupId) formData.append('groupId', data.groupId);
  if (data.apiId) formData.append('apiId', data.apiId);
  formData.append('name', JSON.stringify(data.name));
  if (data.serviceNumber) formData.append('serviceNumber', data.serviceNumber);
  formData.append('costPrice', String(data.costPrice));
  if (data.costManual !== undefined) formData.append('costManual', String(data.costManual));
  formData.append('forQuantity', String(data.forQuantity));
  formData.append('description', JSON.stringify(data.description));
  formData.append('quantityMode', data.quantityMode);
  if (data.minQuantity !== undefined) formData.append('minQuantity', String(data.minQuantity));
  if (data.maxQuantity !== undefined) formData.append('maxQuantity', String(data.maxQuantity));
  if (data.customQuantities) formData.append('customQuantities', data.customQuantities);
  if (data.speed) formData.append('speed', data.speed);
  if (data.startTime) formData.append('startTime', data.startTime);
  formData.append('quantityAvailable', String(data.quantityAvailable));
  formData.append('isVisible', String(data.isVisible));
  formData.append('dripfeed', String(data.dripfeed));
  formData.append('refill', String(data.refill));
  formData.append('cancel', String(data.cancel));
  formData.append('stock', String(data.stock));
  formData.append('fulfillmentType', data.fulfillmentType);
  formData.append('requirements', JSON.stringify(data.requirements || []));
  if (data.visibleCountryCodes !== undefined) formData.append('visibleCountryCodes', JSON.stringify(data.visibleCountryCodes));
  formData.append('image', data.image);

  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCTS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateStockProduct = async (
  id: string,
  data: UpdateStockProductRequest
): Promise<ApiResponse<StockProduct>> => {
  const formData = new FormData();
  formData.append('serviceId', data.serviceId);
  formData.append('categoryId', data.categoryId);
  if (data.groupId !== undefined) formData.append('groupId', data.groupId);
  formData.append('name', JSON.stringify(data.name));
  formData.append('serviceNumber', data.serviceNumber || '');
  formData.append('costPrice', String(data.costPrice));
  if (data.costManual !== undefined) formData.append('costManual', String(data.costManual));
  formData.append('forQuantity', String(data.forQuantity));
  formData.append('description', JSON.stringify(data.description));
  formData.append('quantityMode', data.quantityMode);
  if (data.minQuantity !== undefined) formData.append('minQuantity', String(data.minQuantity));
  if (data.maxQuantity !== undefined) formData.append('maxQuantity', String(data.maxQuantity));
  formData.append('customQuantities', data.customQuantities || '');
  formData.append('speed', data.speed || '');
  formData.append('startTime', data.startTime || '');
  formData.append('quantityAvailable', String(data.quantityAvailable));
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  formData.append('dripfeed', String(data.dripfeed));
  formData.append('refill', String(data.refill));
  formData.append('cancel', String(data.cancel));
  formData.append('stock', String(data.stock));
  formData.append('fulfillmentType', data.fulfillmentType);
  if (data.requirements !== undefined) formData.append('requirements', JSON.stringify(data.requirements));
  if (data.visibleCountryCodes !== undefined) formData.append('visibleCountryCodes', JSON.stringify(data.visibleCountryCodes));
  if (data.image) formData.append('image', data.image);

  const response = await api.patch(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_BY_ID(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const reorderStockProducts = async (orderedIds: string[]): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_PRODUCTS}/reorder`, { orderedIds });
  return response.data;
};

export const bulkUpdateStockProducts = async (data: BulkUpdateStockProductsRequest): Promise<ApiResponse<null>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_PRODUCTS}/bulk`, data);
  return response.data;
};

export const previewApiProductsImport = async (data: ApiProductImportPreviewRequest): Promise<ApiResponse<ApiProductImportPreviewRow[]>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCTS_IMPORT_PREVIEW, data);
  return response.data;
};

export const importApiProducts = async (data: ImportApiProductsRequest): Promise<ApiResponse<ImportApiProductsResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCTS_IMPORT, data);
  return response.data;
};

export const getStockProductApiConnections = async (productId: string): Promise<ApiResponse<StockProductApiConnection[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_API_CONNECTIONS(productId));
  return response.data;
};

export const createStockProductApiConnection = async (
  productId: string,
  data: ProductApiConnectionRequest
): Promise<ApiResponse<StockProductApiConnection>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.STOCK_PRODUCT_API_CONNECTIONS(productId), data);
  return response.data;
};

export const updateStockProductApiConnection = async (
  productId: string,
  connectionId: string,
  data: ProductApiConnectionRequest
): Promise<ApiResponse<StockProductApiConnection>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_PRODUCT_API_CONNECTIONS(productId)}/${connectionId}`, data);
  return response.data;
};

export const activateStockProductApiConnection = async (
  productId: string,
  connectionId: string
): Promise<ApiResponse<StockProductApiConnection>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.STOCK_PRODUCT_API_CONNECTIONS(productId)}/${connectionId}/activate`);
  return response.data;
};

export const deleteStockProductApiConnection = async (
  productId: string,
  connectionId: string
): Promise<ApiResponse<null>> => {
  const response = await api.delete(`${API_ENDPOINTS.ADMIN.STOCK_PRODUCT_API_CONNECTIONS(productId)}/${connectionId}`);
  return response.data;
};
