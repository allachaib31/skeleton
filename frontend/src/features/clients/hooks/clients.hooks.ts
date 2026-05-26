import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  bulkDeleteClientSpecialPrices,
  bulkDeleteAllClientSpecialPrices,
  createAdminClient,
  createClientMovement,
  createClientSpecialPrice,
  generateClientLevels,
  getAdminClientById,
  getAdminClients,
  getAllClientFinancialMovements,
  getAllClientSpecialPrices,
  getClientLevels,
  getClientSpecialPrices,
  softDeleteAdminClient,
  updateAdminClient,
  updateClientLevel,
  updateClientOpenCredit,
  updateClientSpecialPrice,
} from '../api/clients.api';
import {
  ClientListQuery,
  ClientMovementQuery,
  ClientSpecialPricesQuery,
  CreateAdminClientRequest,
  CreateClientMovementRequest,
  CreateClientSpecialPriceRequest,
  UpdateAdminClientRequest,
  UpdateClientOpenCreditRequest,
} from '../types/client.types';

export const useAdminClients = (params: ClientListQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, params],
    queryFn: () => getAdminClients(params),
  });

export const useAdminClient = (id: string, params: ClientMovementQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, id, params],
    queryFn: () => getAdminClientById(id, params),
    enabled: Boolean(id),
  });

export const useCreateAdminClient = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateAdminClientRequest) => createAdminClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateAdminClient = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminClientRequest }) => updateAdminClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSoftDeleteAdminClient = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => softDeleteAdminClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.deleteSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useCreateClientMovement = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateClientMovementRequest) => createClientMovement(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.movementSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateClientOpenCredit = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: UpdateClientOpenCreditRequest) => updateClientOpenCredit(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.openCreditSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useClientLevels = (clientId: string) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, clientId, 'levels'],
    queryFn: () => getClientLevels(clientId),
    enabled: Boolean(clientId),
  });

export const useUpdateClientLevel = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ levelId, groupId }: { levelId: string; groupId: string }) => updateClientLevel(clientId, levelId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.levelUpdateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useGenerateClientLevels = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => generateClientLevels(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.levelGenerateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useAllClientFinancialMovements = (params: ClientMovementQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, 'financial-movements', params],
    queryFn: () => getAllClientFinancialMovements(params),
  });

export const useAllClientSpecialPrices = (params: ClientSpecialPricesQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, 'special-prices-all', params],
    queryFn: () => getAllClientSpecialPrices(params),
  });

export const useUpdateClientSpecialPrice = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ specialPriceId, data }: { specialPriceId: string; data: CreateClientSpecialPriceRequest }) => updateClientSpecialPrice(specialPriceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.specialPriceUpdateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useBulkDeleteAllClientSpecialPrices = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAllClientSpecialPrices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.specialPriceDeleteSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useClientSpecialPrices = (clientId: string, params: ClientSpecialPricesQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.clients, clientId, 'special-prices', params],
    queryFn: () => getClientSpecialPrices(clientId, params),
    enabled: Boolean(clientId),
  });

export const useCreateClientSpecialPrice = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateClientSpecialPriceRequest) => createClientSpecialPrice(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.specialPriceCreateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useBulkDeleteClientSpecialPrices = (clientId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteClientSpecialPrices(clientId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('clients.specialPriceDeleteSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
