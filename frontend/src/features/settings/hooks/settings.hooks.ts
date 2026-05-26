import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  createSettingsApi,
  createSettingsCurrency,
  createSettingsPaymentGateway,
  createPaymentCode,
  generatePaymentCodes,
  getSettingsApp,
  getPaymentCodeJournal,
  getPaymentCodes,
  getSettingsApis,
  getSettingsCurrencies,
  getSettingsPaymentGateways,
  importPaymentCodes,
  simulateGiftCardProvidersApi,
  simulateGiftCardProviders2Api,
  simulateSocialMediaServiceProviderApi,
  simulateTemporaryNumberCodingSitesApi,
  syncAllSettingsApis,
  syncSettingsApi,
  updatePaymentCode,
  updateSettingsApp,
  updateSettingsApi,
  updateSettingsCurrency,
  updateSettingsPaymentGateway,
  calculatePricingSimulation,
} from '../api/settings.api';
import {
  CreateSettingsApiRequest,
  CreateSettingsCurrencyRequest,
  CreateSettingsPaymentGatewayRequest,
  CreatePaymentCodeRequest,
  GeneratePaymentCodesRequest,
  ImportPaymentCodesRequest,
  GiftCardProvidersSimulationRequest,
  GiftCardProviders2SimulationRequest,
  SocialMediaServiceProviderSimulationRequest,
  TemporaryNumberCodingSitesSimulationRequest,
  PaymentCodeFilters,
  PaymentCodeJournalFilters,
  PricingSimulationRequest,
  UpdateSettingsAppRequest,
  UpdatePaymentCodeRequest,
  UpdateSettingsApiRequest,
  UpdateSettingsCurrencyRequest,
  UpdateSettingsPaymentGatewayRequest,
} from '../types/settings.types';

export const useSettingsApp = () =>
  useQuery({
    queryKey: queryKeys.admin.settingsApp,
    queryFn: getSettingsApp,
  });

export const useUpdateSettingsApp = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: UpdateSettingsAppRequest) => updateSettingsApp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsApp });
      toast.success(t('adminSettings.branding.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSettingsCurrencies = (params: { page: number; limit: number }) =>
  useQuery({
    queryKey: [...queryKeys.admin.settingsCurrencies, params],
    queryFn: () => getSettingsCurrencies(params),
  });

export const useCreateSettingsCurrency = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateSettingsCurrencyRequest) => createSettingsCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsCurrencies });
      toast.success(t('adminSettings.currencies.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateSettingsCurrency = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingsCurrencyRequest }) => updateSettingsCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsCurrencies });
      toast.success(t('adminSettings.currencies.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSettingsApis = (params: { page: number; limit: number }) =>
  useQuery({
    queryKey: [...queryKeys.admin.settingsApis, params],
    queryFn: () => getSettingsApis(params),
  });

export const useCreateSettingsApi = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateSettingsApiRequest) => createSettingsApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsApis });
      toast.success(t('adminSettings.apis.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateSettingsApi = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingsApiRequest }) => updateSettingsApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsApis });
      toast.success(t('adminSettings.apis.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSyncSettingsApi = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => syncSettingsApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsApis });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('adminSettings.apis.syncSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSyncAllSettingsApis = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => syncAllSettingsApis(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsApis });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('adminSettings.apis.syncSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSimulateGiftCardProvidersApi = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: GiftCardProvidersSimulationRequest) => simulateGiftCardProvidersApi(data),
    onSuccess: () => {
      toast.success(t('adminSettings.giftCardProvidersSimulation.simulateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSimulateGiftCardProviders2Api = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: GiftCardProviders2SimulationRequest) => simulateGiftCardProviders2Api(data),
    onSuccess: () => {
      toast.success(t('adminSettings.giftCardProviders2Simulation.simulateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSimulateSocialMediaServiceProviderApi = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: SocialMediaServiceProviderSimulationRequest) => simulateSocialMediaServiceProviderApi(data),
    onSuccess: () => {
      toast.success(t('adminSettings.socialMediaServiceProvidersSimulation.simulateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSimulateTemporaryNumberCodingSitesApi = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: TemporaryNumberCodingSitesSimulationRequest) => simulateTemporaryNumberCodingSitesApi(data),
    onSuccess: () => {
      toast.success(t('adminSettings.temporaryNumberCodingSitesSimulation.simulateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSettingsPaymentGateways = (params: { page: number; limit: number }) =>
  useQuery({
    queryKey: [...queryKeys.admin.settingsPaymentGateways, params],
    queryFn: () => getSettingsPaymentGateways(params),
  });

export const useCreateSettingsPaymentGateway = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateSettingsPaymentGatewayRequest) => createSettingsPaymentGateway(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentGateways });
      toast.success(t('adminSettings.paymentGateways.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateSettingsPaymentGateway = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingsPaymentGatewayRequest }) => updateSettingsPaymentGateway(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentGateways });
      toast.success(t('adminSettings.paymentGateways.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const usePaymentCodes = (params: PaymentCodeFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.settingsPaymentCodes, params],
    queryFn: () => getPaymentCodes(params),
  });

export const usePaymentCodeJournal = (params: PaymentCodeJournalFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.settingsPaymentCodeJournal, params],
    queryFn: () => getPaymentCodeJournal(params),
  });

export const useCreatePaymentCode = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreatePaymentCodeRequest) => createPaymentCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentCodes });
      toast.success(t('adminSettings.paymentCodes.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useGeneratePaymentCodes = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: GeneratePaymentCodesRequest) => generatePaymentCodes(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentCodes });
      toast.success(t('adminSettings.paymentCodes.generateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useImportPaymentCodes = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: ImportPaymentCodesRequest) => importPaymentCodes(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentCodes });
      toast.success(t('adminSettings.paymentCodes.importSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdatePaymentCode = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentCodeRequest }) => updatePaymentCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentCodes });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settingsPaymentCodeJournal });
      toast.success(t('adminSettings.paymentCodes.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useCalculatePricingSimulation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: PricingSimulationRequest) => calculatePricingSimulation(data),
    onSuccess: () => {
      toast.success(t('adminSettings.simulation.calculateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
