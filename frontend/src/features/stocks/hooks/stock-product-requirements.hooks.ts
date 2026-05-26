import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  createStockProductRequirement,
  getStockProductRequirements,
  updateStockProductRequirement,
} from '../api/stock-product-requirements.api';
import {
  StockProductRequirementFilters,
  StockProductRequirementPayload,
} from '../types/stock-product-requirement.types';

export const useStockProductRequirements = (params: StockProductRequirementFilters) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockProductRequirements, params],
    queryFn: () => getStockProductRequirements(params),
  });
};

export const useCreateStockProductRequirement = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: StockProductRequirementPayload) => createStockProductRequirement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductRequirements });
      toast.success(t('stocks.productRequirements.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockProductRequirement = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockProductRequirementPayload }) => updateStockProductRequirement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductRequirements });
      toast.success(t('stocks.productRequirements.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
