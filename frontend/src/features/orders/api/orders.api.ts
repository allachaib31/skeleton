import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import { AdminOrder, CompleteOrderRequest, CreateOrderRequest, OrderFilters, SwitchOrderApiRequest } from '../types/order.types';

export const getOrders = async (params: OrderFilters): Promise<ApiResponse<AdminOrder[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.ORDERS, { params });
  return response.data;
};

export const getOrder = async (id: string): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.ORDER_BY_ID(id));
  return response.data;
};

export const createOrder = async (data: CreateOrderRequest): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.ORDERS, data);
  return response.data;
};

export const takeOrder = async (id: string): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.ORDER_TAKE(id));
  return response.data;
};

export const completeOrder = async (id: string, data: CompleteOrderRequest): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.ORDER_COMPLETE(id), data);
  return response.data;
};

export const failOrder = async (id: string, issueReason: string): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.ORDER_FAIL(id), { issueReason });
  return response.data;
};

export const switchOrderApi = async (id: string, data: SwitchOrderApiRequest): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.ORDER_SWITCH_API(id), data);
  return response.data;
};

export const cancelOrder = async (id: string): Promise<ApiResponse<AdminOrder>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.ORDER_CANCEL(id));
  return response.data;
};
