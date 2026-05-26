import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse, PaginationQuery } from '@/shared/types/api.types';
import {
  CreateSettingsApiRequest,
  CreateSettingsCurrencyRequest,
  CreateSettingsPaymentGatewayRequest,
  CreatePaymentCodeRequest,
  GeneratePaymentCodesRequest,
  ImportPaymentCodesRequest,
  GiftCardProvidersSimulationRequest,
  GiftCardProvidersSimulationResult,
  GiftCardProviders2SimulationRequest,
  GiftCardProviders2SimulationResult,
  SocialMediaServiceProviderSimulationRequest,
  SocialMediaServiceProviderSimulationResult,
  TemporaryNumberCodingSitesSimulationRequest,
  TemporaryNumberCodingSitesSimulationResult,
  PaymentCode,
  PaymentCodeFilters,
  PaymentCodeJournal,
  PaymentCodeJournalFilters,
  PricingSimulationRequest,
  PricingSimulationResult,
  SettingsApp,
  SettingsApi,
  SettingsApiSyncAllResult,
  SettingsApiSyncResult,
  SettingsCurrency,
  SettingsPaymentGateway,
  UpdatePaymentCodeRequest,
  UpdateSettingsAppRequest,
  UpdateSettingsApiRequest,
  UpdateSettingsCurrencyRequest,
  UpdateSettingsPaymentGatewayRequest,
} from '../types/settings.types';

export const getSettingsApp = async (): Promise<ApiResponse<SettingsApp>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_APP);
  return response.data;
};

export const updateSettingsApp = async (data: UpdateSettingsAppRequest): Promise<ApiResponse<SettingsApp>> => {
  const formData = new FormData();
  if (data.appName !== undefined) formData.append('appName', data.appName);
  if (data.logo) formData.append('logo', data.logo);
  if (data.favicon) formData.append('favicon', data.favicon);
  const response = await api.patch(API_ENDPOINTS.ADMIN.SETTINGS_APP, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getSettingsCurrencies = async (params: PaginationQuery): Promise<ApiResponse<SettingsCurrency[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_CURRENCIES, { params });
  return response.data;
};

export const createSettingsCurrency = async (data: CreateSettingsCurrencyRequest): Promise<ApiResponse<SettingsCurrency>> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('shortName', data.shortName);
  formData.append('price', String(data.price));
  formData.append('priceBuy', String(data.priceBuy));
  formData.append('isDollar', String(data.isDollar));
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  formData.append('icon', data.icon);
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_CURRENCIES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateSettingsCurrency = async (id: string, data: UpdateSettingsCurrencyRequest): Promise<ApiResponse<SettingsCurrency>> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('shortName', data.shortName);
  formData.append('price', String(data.price));
  formData.append('priceBuy', String(data.priceBuy));
  formData.append('isDollar', String(data.isDollar));
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  if (data.icon) formData.append('icon', data.icon);
  const response = await api.patch(API_ENDPOINTS.ADMIN.SETTINGS_CURRENCY_BY_ID(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getSettingsApis = async (params: PaginationQuery): Promise<ApiResponse<SettingsApi[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_APIS, { params });
  return response.data;
};

export const createSettingsApi = async (data: CreateSettingsApiRequest): Promise<ApiResponse<SettingsApi>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_APIS, data);
  return response.data;
};

export const updateSettingsApi = async (id: string, data: UpdateSettingsApiRequest): Promise<ApiResponse<SettingsApi>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.SETTINGS_API_BY_ID(id), data);
  return response.data;
};

export const syncSettingsApi = async (id: string): Promise<ApiResponse<SettingsApiSyncResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_SYNC(id));
  return response.data;
};

export const syncAllSettingsApis = async (): Promise<ApiResponse<SettingsApiSyncAllResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_SYNC_ALL);
  return response.data;
};

export const simulateGiftCardProvidersApi = async (data: GiftCardProvidersSimulationRequest): Promise<ApiResponse<GiftCardProvidersSimulationResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_GIFT_CARD_PROVIDERS_SIMULATE, data);
  return response.data;
};

export const simulateGiftCardProviders2Api = async (data: GiftCardProviders2SimulationRequest): Promise<ApiResponse<GiftCardProviders2SimulationResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_GIFT_CARD_PROVIDERS_2_SIMULATE, data);
  return response.data;
};

export const simulateSocialMediaServiceProviderApi = async (data: SocialMediaServiceProviderSimulationRequest): Promise<ApiResponse<SocialMediaServiceProviderSimulationResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_SOCIAL_MEDIA_SERVICE_PROVIDERS_SIMULATE, data);
  return response.data;
};

export const simulateTemporaryNumberCodingSitesApi = async (data: TemporaryNumberCodingSitesSimulationRequest): Promise<ApiResponse<TemporaryNumberCodingSitesSimulationResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_API_TEMPORARY_NUMBER_CODING_SITES_SIMULATE, data);
  return response.data;
};

const appendPaymentGatewayFormData = (formData: FormData, data: CreateSettingsPaymentGatewayRequest | UpdateSettingsPaymentGatewayRequest) => {
  formData.append('kind', data.kind);
  formData.append('name', JSON.stringify(data.name));
  if (data.link) formData.append('link', data.link);
  if (data.token) formData.append('token', data.token);
  if (data.currencyId) formData.append('currencyId', data.currencyId);
  if (data.description) formData.append('description', JSON.stringify(data.description));
  formData.append('infoFields', JSON.stringify(data.infoFields || []));
  formData.append('taxType', data.taxType);
  formData.append('taxValue', String(data.taxValue));
  formData.append('minMoney', String(data.minMoney));
  formData.append('maxMoney', String(data.maxMoney));
  formData.append('requiresImage', String(data.requiresImage));
  formData.append('requiresSerialNumber', String(data.requiresSerialNumber));
  formData.append('isVisible', String(data.isVisible));
  formData.append('isDeleted', String(data.isDeleted));
  if (data.image) formData.append('image', data.image);
  data.infoFiles?.forEach((file) => {
    if (file) formData.append('infoFiles', file);
  });
};

export const getSettingsPaymentGateways = async (params: PaginationQuery): Promise<ApiResponse<SettingsPaymentGateway[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_GATEWAYS, { params });
  return response.data;
};

export const createSettingsPaymentGateway = async (data: CreateSettingsPaymentGatewayRequest): Promise<ApiResponse<SettingsPaymentGateway>> => {
  const formData = new FormData();
  appendPaymentGatewayFormData(formData, data);
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_GATEWAYS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateSettingsPaymentGateway = async (id: string, data: UpdateSettingsPaymentGatewayRequest): Promise<ApiResponse<SettingsPaymentGateway>> => {
  const formData = new FormData();
  appendPaymentGatewayFormData(formData, data);
  const response = await api.patch(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_GATEWAY_BY_ID(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getPaymentCodes = async (params: PaymentCodeFilters): Promise<ApiResponse<PaymentCode[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODES, { params });
  return response.data;
};

export const getPaymentCodeJournal = async (params: PaymentCodeJournalFilters): Promise<ApiResponse<PaymentCodeJournal[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODE_JOURNAL, { params });
  return response.data;
};

export const createPaymentCode = async (data: CreatePaymentCodeRequest): Promise<ApiResponse<{ paymentCode: PaymentCode; plainCode: string }>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODES, data);
  return response.data;
};

export const generatePaymentCodes = async (data: GeneratePaymentCodesRequest): Promise<ApiResponse<{ count: number; plainCodes: string[] }>> => {
  const response = await api.post(`${API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODES}/generate`, data);
  return response.data;
};

export const importPaymentCodes = async (data: ImportPaymentCodesRequest): Promise<ApiResponse<{ importedCount: number }>> => {
  const response = await api.post(`${API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODES}/import`, data);
  return response.data;
};

export const updatePaymentCode = async (id: string, data: UpdatePaymentCodeRequest): Promise<ApiResponse<PaymentCode>> => {
  const response = await api.patch(`${API_ENDPOINTS.ADMIN.SETTINGS_PAYMENT_CODES}/${id}`, data);
  return response.data;
};

export const calculatePricingSimulation = async (data: PricingSimulationRequest): Promise<ApiResponse<PricingSimulationResult>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.SETTINGS_PRICING_SIMULATION_CALCULATE, data);
  return response.data;
};
