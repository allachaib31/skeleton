import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  AdminClient,
  AdminClientDetail,
  ClientListQuery,
  ClientLevelsResponse,
  ClientMovementQuery,
  ClientProductSpecialPrice,
  ClientServiceLevel,
  ClientSpecialPricesQuery,
  CreateAdminClientRequest,
  CreateClientMovementRequest,
  CreateClientSpecialPriceRequest,
  UpdateClientSpecialPriceRequest,
  UpdateClientOpenCreditRequest,
  UpdateAdminClientRequest,
  ClientFinancialMovement,
} from '../types/client.types';

const appendClientFormData = (data: CreateAdminClientRequest | UpdateAdminClientRequest) => {
  const formData = new FormData();
  if (data.email !== undefined) formData.append('email', data.email);
  if (data.username !== undefined) formData.append('username', data.username);
  if (data.firstName !== undefined) formData.append('firstName', data.firstName);
  if (data.lastName !== undefined) formData.append('lastName', data.lastName);
  if (data.phoneNumber !== undefined) formData.append('phoneNumber', data.phoneNumber);
  if (data.countryCode !== undefined) formData.append('countryCode', data.countryCode);
  if (data.countryIso !== undefined) formData.append('countryIso', data.countryIso);
  if (data.countryFlag !== undefined) formData.append('countryFlag', data.countryFlag);
  if (data.status !== undefined) formData.append('status', data.status);
  if (data.password) formData.append('password', data.password);
  if (data.referralClientId !== undefined) formData.append('referralClientId', data.referralClientId);
  if (data.avatar) formData.append('avatar', data.avatar);
  return formData;
};

export const getAdminClients = async (params: ClientListQuery): Promise<ApiResponse<AdminClient[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENTS, { params });
  return response.data;
};

export const getAdminClientById = async (id: string, params: ClientMovementQuery): Promise<ApiResponse<AdminClientDetail>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENT_BY_ID(id), { params });
  return response.data;
};

export const createAdminClient = async (data: CreateAdminClientRequest): Promise<ApiResponse<AdminClient>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.CLIENTS, appendClientFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateAdminClient = async (id: string, data: UpdateAdminClientRequest): Promise<ApiResponse<AdminClient>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.CLIENT_BY_ID(id), appendClientFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const softDeleteAdminClient = async (id: string): Promise<ApiResponse<AdminClient>> => {
  const response = await api.delete(API_ENDPOINTS.ADMIN.CLIENT_DELETE(id));
  return response.data;
};

export const createClientMovement = async (clientId: string, data: CreateClientMovementRequest): Promise<ApiResponse<ClientFinancialMovement>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.CLIENT_MOVEMENTS(clientId), data);
  return response.data;
};

export const updateClientOpenCredit = async (clientId: string, data: UpdateClientOpenCreditRequest): Promise<ApiResponse<AdminClient>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.CLIENT_OPEN_CREDIT(clientId), data);
  return response.data;
};

export const getClientLevels = async (clientId: string): Promise<ApiResponse<ClientLevelsResponse>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENT_LEVELS(clientId));
  return response.data;
};

export const updateClientLevel = async (clientId: string, levelId: string, groupId: string): Promise<ApiResponse<ClientServiceLevel>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.CLIENT_LEVELS(clientId)}/${levelId}`, { groupId });
  return response.data;
};

export const generateClientLevels = async (clientId: string): Promise<ApiResponse<{ created: number; repaired: number }>> => {
  const response = await api.post(`${API_ENDPOINTS.ADMIN.CLIENT_LEVELS(clientId)}/generate`);
  return response.data;
};

export const getAllClientFinancialMovements = async (params: ClientMovementQuery): Promise<ApiResponse<ClientFinancialMovement[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENT_FINANCIAL_MOVEMENTS, { params });
  return response.data;
};

export const getAllClientSpecialPrices = async (params: ClientSpecialPricesQuery): Promise<ApiResponse<ClientProductSpecialPrice[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES_ALL, { params });
  return response.data;
};

export const updateClientSpecialPrice = async (specialPriceId: string, data: UpdateClientSpecialPriceRequest): Promise<ApiResponse<ClientProductSpecialPrice>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES_ALL}/${specialPriceId}`, data);
  return response.data;
};

export const bulkDeleteAllClientSpecialPrices = async (ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES_ALL}/bulk-delete`, { ids });
  return response.data;
};

export const getClientSpecialPrices = async (clientId: string, params: ClientSpecialPricesQuery): Promise<ApiResponse<ClientProductSpecialPrice[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES(clientId), { params });
  return response.data;
};

export const createClientSpecialPrice = async (clientId: string, data: CreateClientSpecialPriceRequest): Promise<ApiResponse<ClientProductSpecialPrice>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES(clientId), data);
  return response.data;
};

export const bulkDeleteClientSpecialPrices = async (clientId: string, ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.CLIENT_SPECIAL_PRICES(clientId)}/bulk-delete`, { ids });
  return response.data;
};
