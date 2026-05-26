import { api } from '@/shared/lib/api/axios';
import { ApiResponse } from '@/shared/types/api.types';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { SettingsPaymentGateway } from '@/features/settings/types/settings.types';
import { CreatePaymentRequestRequest, PaymentRequest, PaymentRequestQuery } from './payments.types';

export const getPaymentBanks = async (): Promise<ApiResponse<SettingsPaymentGateway[]>> => {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.BANKS);
  return response.data;
};

export const getMyPaymentRequests = async (params: PaymentRequestQuery): Promise<ApiResponse<PaymentRequest[]>> => {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.LIST, { params });
  return response.data;
};

export const createPaymentRequest = async (data: CreatePaymentRequestRequest): Promise<ApiResponse<PaymentRequest>> => {
  const formData = new FormData();
  formData.append('paymentGatewayId', data.paymentGatewayId);
  formData.append('amount', String(data.amount));
  if (data.serialNumber) formData.append('serialNumber', data.serialNumber);
  if (data.clientComment) formData.append('clientComment', data.clientComment);
  formData.append('inputs', JSON.stringify(data.inputs || []));
  if (data.proofImage) formData.append('proofImage', data.proofImage);
  const response = await api.post(API_ENDPOINTS.PAYMENTS.LIST, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAdminPaymentRequests = async (params: PaymentRequestQuery): Promise<ApiResponse<PaymentRequest[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.PAYMENTS, { params });
  return response.data;
};

export const approvePaymentRequest = async (id: string, adminComment?: string): Promise<ApiResponse<PaymentRequest>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.PAYMENT_APPROVE(id), { adminComment });
  return response.data;
};

export const rejectPaymentRequest = async (id: string, adminComment?: string): Promise<ApiResponse<PaymentRequest>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.PAYMENT_REJECT(id), { adminComment });
  return response.data;
};
