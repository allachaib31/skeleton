import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  ShopCategoryFilters,
  ShopCategoryCatalogFilters,
  ShopCategoryCatalogItem,
  ShopCategoryItem,
  CreateShopOrderRequest,
  ShopProductGroupFilters,
  ShopProductGroupItem,
  ShopProductFilters,
  ShopProductItem,
  ShopServiceFilters,
  ShopServiceItem,
} from '../types/shop.types';
import { AdminOrder } from '@/features/orders/types/order.types';
import { OrderFilters } from '@/features/orders/types/order.types';

export const getShopServices = async (params: ShopServiceFilters): Promise<ApiResponse<ShopServiceItem[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.SERVICES, { params });
  return response.data;
};

export const getShopCategories = async (params: ShopCategoryFilters): Promise<ApiResponse<ShopCategoryItem[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.CATEGORIES, { params });
  return response.data;
};

export const getShopProductGroups = async (params: ShopProductGroupFilters): Promise<ApiResponse<ShopProductGroupItem[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.PRODUCT_GROUPS, { params });
  return response.data;
};

export const getShopCategoryItems = async (params: ShopCategoryCatalogFilters): Promise<ApiResponse<ShopCategoryCatalogItem[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.CATEGORY_ITEMS, { params });
  return response.data;
};

export const getShopProducts = async (params: ShopProductFilters): Promise<ApiResponse<ShopProductItem[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.PRODUCTS, { params });
  return response.data;
};

export const getShopProduct = async (id: string): Promise<ApiResponse<ShopProductItem>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.PRODUCT_BY_ID(id));
  return response.data;
};

export const createShopOrder = async (data: CreateShopOrderRequest): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.post(API_ENDPOINTS.SHOP.ORDERS, data);
  return response.data;
};

export const getShopOrders = async (params: Partial<OrderFilters>): Promise<ApiResponse<AdminOrder[]>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.ORDERS, { params });
  return response.data;
};

export const getShopOrder = async (id: string): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.get(API_ENDPOINTS.SHOP.ORDER_BY_ID(id));
  return response.data;
};
