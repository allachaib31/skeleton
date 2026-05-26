import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  bulkUpdateStockWarehouseItems,
  createStockWarehouse,
  createStockWarehouseItem,
  getStockWarehouseItems,
  getStockWarehouses,
  importStockWarehouseItems,
  updateStockWarehouse,
  updateStockWarehouseItem,
} from '../api/stock-warehouses.api';
import {
  BulkUpdateStockWarehouseItemsRequest,
  CreateStockWarehouseItemRequest,
  CreateStockWarehouseRequest,
  ImportStockWarehouseItemsRequest,
  StockWarehouseFilters,
  StockWarehouseItemFilters,
  UpdateStockWarehouseItemRequest,
  UpdateStockWarehouseRequest,
} from '../types/stock-warehouse.types';

export const useStockWarehouses = (params: StockWarehouseFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.stockWarehouses, params],
    queryFn: () => getStockWarehouses(params),
  });

export const useCreateStockWarehouse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateStockWarehouseRequest) => createStockWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockWarehouse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockWarehouseRequest }) => updateStockWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.updateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useStockWarehouseItems = (params: StockWarehouseItemFilters) =>
  useQuery({
    queryKey: [...queryKeys.admin.stockWarehouseItems, params],
    queryFn: () => getStockWarehouseItems(params),
  });

export const useCreateStockWarehouseItem = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreateStockWarehouseItemRequest) => createStockWarehouseItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouseItems });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.itemCreateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useImportStockWarehouseItems = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: ImportStockWarehouseItemsRequest) => importStockWarehouseItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouseItems });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.importSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateStockWarehouseItem = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockWarehouseItemRequest }) => updateStockWarehouseItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouseItems });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.itemUpdateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useBulkUpdateStockWarehouseItems = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: BulkUpdateStockWarehouseItemsRequest) => bulkUpdateStockWarehouseItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouseItems });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stockWarehouses });
      toast.success(t('stocks.warehouses.itemsUpdateSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
