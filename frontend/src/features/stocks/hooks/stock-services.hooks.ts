import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { PaginationQuery } from '@/shared/types/api.types';
import { createStockService, getStockServices, reorderStockServices, updateStockService } from '../api/stock-services.api';
import { CreateStockServiceRequest, StockServiceType, UpdateStockServiceRequest } from '../types/stock-service.types';

export const useStockServices = (
  params: PaginationQuery & { type?: StockServiceType | ''; isVisible?: string; isDeleted?: string }
) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockServices, params],
    queryFn: () => getStockServices(params),
  });
};

export const useCreateStockService = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockServiceRequest) => createStockService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockServices });
      toast.success(t('stocks.services.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockService = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockServiceRequest }) => updateStockService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockServices });
      toast.success(t('stocks.services.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useReorderStockServices = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderStockServices(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockServices });
      toast.success(t('stocks.services.reorderSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
