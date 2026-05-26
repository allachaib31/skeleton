import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { createStockServiceGroup, getStockServiceGroups, updateStockServiceGroup } from '../api/stock-service-groups.api';
import {
  CreateStockServiceGroupRequest,
  StockServiceGroupFilters,
  UpdateStockServiceGroupRequest,
} from '../types/stock-service-group.types';

export const useStockServiceGroups = (params: StockServiceGroupFilters) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockServiceGroups, params],
    queryFn: () => getStockServiceGroups(params),
  });
};

export const useCreateStockServiceGroup = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockServiceGroupRequest) => createStockServiceGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockServiceGroups });
      toast.success(t('stocks.serviceGroups.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockServiceGroup = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockServiceGroupRequest }) => updateStockServiceGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockServiceGroups });
      toast.success(t('stocks.serviceGroups.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
