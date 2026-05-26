import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { PaginationQuery } from '@/shared/types/api.types';
import { createStockProductGroup, getStockProductGroups } from '../api/stock-product-groups.api';
import { CreateStockProductGroupRequest } from '../types/stock-product-group.types';

export const useStockProductGroups = (params: PaginationQuery) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockProductGroups, params],
    queryFn: () => getStockProductGroups(params),
  });
};

export const useCreateStockProductGroup = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockProductGroupRequest) => createStockProductGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductGroups });
      toast.success(t('stocks.productGroups.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
