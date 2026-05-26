import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  createStockPromotion,
  getStockPromotions,
  getStockPromotionUsages,
  updateStockPromotion,
} from '../api/stock-promotions.api';
import {
  CreateStockPromotionRequest,
  StockPromotionFilters,
  StockPromotionUsageFilters,
  UpdateStockPromotionRequest,
} from '../types/stock-promotion.types';

export const useStockPromotions = (params: StockPromotionFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.stockPromotions, params],
    queryFn: () => getStockPromotions(params),
  });

export const useStockPromotionUsages = (params: StockPromotionUsageFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.stockPromotionUsages, params],
    queryFn: () => getStockPromotionUsages(params),
  });

export const useCreateStockPromotion = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockPromotionRequest) => createStockPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockPromotions });
      toast.success(t('stocks.promotions.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockPromotion = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockPromotionRequest }) => updateStockPromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockPromotions });
      toast.success(t('stocks.promotions.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
