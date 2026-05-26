import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  activateStockProductApiConnection,
  bulkUpdateStockProducts,
  createStockProduct,
  createStockProductApiConnection,
  deleteStockProductApiConnection,
  getStockProduct,
  getStockProductApiConnections,
  getStockProducts,
  importApiProducts,
  previewApiProductsImport,
  reorderStockProducts,
  updateStockProduct,
  updateStockProductApiConnection,
} from '../api/stock-products.api';
import { ApiProductImportPreviewRequest, BulkUpdateStockProductsRequest, CreateStockProductRequest, ImportApiProductsRequest, ProductApiConnectionRequest, StockProductFilters, UpdateStockProductRequest } from '../types/stock-product.types';

export const useStockProducts = (params: StockProductFilters, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockProducts, params],
    queryFn: () => getStockProducts(params),
    enabled: options?.enabled ?? true,
  });
};

export const useStockProduct = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockProducts, id],
    queryFn: () => getStockProduct(id),
    enabled: Boolean(id),
  });
};

export const useCreateStockProduct = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateStockProductRequest) => createStockProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockProduct = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockProductRequest }) => updateStockProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useReorderStockProducts = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderStockProducts(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.reorderSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useBulkUpdateStockProducts = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: BulkUpdateStockProductsRequest) => bulkUpdateStockProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.bulkUpdateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const usePreviewApiProductsImport = () => {
  return useMutation({
    mutationFn: (data: ApiProductImportPreviewRequest) => previewApiProductsImport(data),
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useImportApiProducts = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ImportApiProductsRequest) => importApiProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductRequirements });
      toast.success(t('stocks.importProducts.importSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useStockProductApiConnections = (productId: string) => {
  return useQuery({
    queryKey: [...queryKeys.admin.stockProductApiConnections, productId],
    queryFn: () => getStockProductApiConnections(productId),
    enabled: Boolean(productId),
  });
};

export const useCreateStockProductApiConnection = (productId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ProductApiConnectionRequest) => createStockProductApiConnection(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductApiConnections });
      toast.success(t('stocks.products.apiConnections.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockProductApiConnection = (productId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: ProductApiConnectionRequest }) => updateStockProductApiConnection(productId, connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductApiConnections });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.apiConnections.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useActivateStockProductApiConnection = (productId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (connectionId: string) => activateStockProductApiConnection(productId, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductApiConnections });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProducts });
      toast.success(t('stocks.products.apiConnections.activateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useDeleteStockProductApiConnection = (productId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (connectionId: string) => deleteStockProductApiConnection(productId, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockProductApiConnections });
      toast.success(t('stocks.products.apiConnections.deleteSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
