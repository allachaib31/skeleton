import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { PaginationQuery } from '@/shared/types/api.types';
import { createStockCategory, getStockCategories, reorderStockCategories, updateStockCategory } from '../api/stock-categories.api';
import { CreateStockCategoryRequest, UpdateStockCategoryRequest } from '../types/stock-category.types';

export const useStockCategories = (
  params: PaginationQuery & { all?: 'true'; serviceId?: string; isVisible?: string; isDeleted?: string }
) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockCategories, params],
    queryFn: () => getStockCategories(params),
  });
};

export const useCreateStockCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockCategoryRequest) => createStockCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockCategories });
      toast.success(t('stocks.categories.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockCategoryRequest }) => updateStockCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockCategories });
      toast.success(t('stocks.categories.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useReorderStockCategories = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderStockCategories(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockCategories });
      toast.success(t('stocks.categories.reorderSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
