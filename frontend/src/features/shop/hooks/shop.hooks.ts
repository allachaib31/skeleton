import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { createShopOrder, getShopCategories, getShopCategoryItems, getShopOrder, getShopOrders, getShopProduct, getShopProductGroups, getShopProducts, getShopServices } from '../api/shop.api';
import { CreateShopOrderRequest, ShopCategoryCatalogFilters, ShopCategoryFilters, ShopProductFilters, ShopProductGroupFilters, ShopServiceFilters } from '../types/shop.types';
import { OrderFilters } from '@/features/orders/types/order.types';

export const useShopServices = (params: ShopServiceFilters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.shop.services, params],
    queryFn: () => getShopServices(params),
  });
};

export const useShopCategories = (params: ShopCategoryFilters = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.shop.categories, params],
    queryFn: () => getShopCategories(params),
    enabled: options?.enabled ?? true,
  });
};

export const useShopProductGroups = (params: ShopProductGroupFilters = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.shop.productGroups, params],
    queryFn: () => getShopProductGroups(params),
    enabled: options?.enabled ?? true,
  });
};

export const useShopCategoryItems = (params: ShopCategoryCatalogFilters = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.shop.categoryItems, params],
    queryFn: () => getShopCategoryItems(params),
    enabled: options?.enabled ?? true,
  });
};

export const useShopProducts = (params: ShopProductFilters = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.shop.products, params],
    queryFn: () => getShopProducts(params),
    enabled: options?.enabled ?? true,
  });
};

export const useShopProduct = (id?: string) => {
  return useQuery({
    queryKey: [...queryKeys.shop.products, id],
    queryFn: () => getShopProduct(id || ''),
    enabled: Boolean(id),
  });
};

export const useShopOrders = (params: Partial<OrderFilters> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.shop.orders, params],
    queryFn: () => getShopOrders(params),
  });
};

export const useShopOrder = (id?: string) => {
  return useQuery({
    queryKey: [...queryKeys.shop.orders, id],
    queryFn: () => getShopOrder(id || ''),
    enabled: Boolean(id),
  });
};

export const useCreateShopOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateShopOrderRequest) => createShopOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('shopProduct.orderCreated'));
    },
  });
};
