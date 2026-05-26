import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { cancelOrder, completeOrder, createOrder, failOrder, getOrder, getOrders, switchOrderApi, takeOrder } from '../api/orders.api';
import { CompleteOrderRequest, CreateOrderRequest, OrderFilters, SwitchOrderApiRequest } from '../types/order.types';

export const useOrders = (params: OrderFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.orders, params],
    queryFn: () => getOrders(params),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: [...queryKeys.admin.orders, id],
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('orders.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useTakeOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => takeOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      toast.success(t('orders.takeSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useCompleteOrder = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CompleteOrderRequest) => completeOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      toast.success(t('orders.completeSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useFailOrder = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (issueReason: string) => failOrder(id, issueReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      toast.success(t('orders.failSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
      toast.success(t('orders.cancelSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSwitchOrderApi = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: SwitchOrderApiRequest) => switchOrderApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      toast.success(t('orders.switchApiSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
