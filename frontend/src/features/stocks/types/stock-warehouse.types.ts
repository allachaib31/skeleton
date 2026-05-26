import { StockCategory } from './stock-category.types';
import { StockProduct } from './stock-product.types';
import { StockService } from './stock-service.types';

export const stockWarehouseTypes = ['CODE', 'CARD', 'ACCOUNT', 'FILE', 'TEXT'] as const;
export type StockWarehouseType = typeof stockWarehouseTypes[number];
export const stockWarehouseItemStatuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED'] as const;
export type StockWarehouseItemStatus = typeof stockWarehouseItemStatuses[number];

export interface StockWarehouse {
  _id: string;
  name: string;
  productId: Pick<StockProduct, '_id' | 'name' | 'fulfillmentType' | 'image' | 'serviceId' | 'categoryId'> | string;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  categoryId: Pick<StockCategory, '_id' | 'name' | 'serviceId'> | string;
  type: StockWarehouseType;
  costPrice: number;
  sellNote?: string;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  disabledQuantity: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockWarehouseItem {
  _id: string;
  warehouseId: Pick<StockWarehouse, '_id' | 'name' | 'type' | 'availableQuantity' | 'soldQuantity' | 'reservedQuantity' | 'disabledQuantity'> | string;
  productId: Pick<StockProduct, '_id' | 'name' | 'fulfillmentType' | 'image'> | string;
  code: string;
  serialNumber?: string;
  pin?: string;
  status: StockWarehouseItemStatus;
  costPrice: number;
  expiresAt?: string;
  notes?: string;
  isDeleted: boolean;
  soldAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockWarehouseFilters {
  page: number;
  limit: number;
  search?: string;
  serviceId?: string;
  categoryId?: string;
  productId?: string;
  type?: StockWarehouseType | '';
  isVisible?: boolean;
  isDeleted?: boolean;
}

export interface StockWarehouseItemFilters {
  page: number;
  limit: number;
  search?: string;
  warehouseId?: string;
  productId?: string;
  status?: StockWarehouseItemStatus | '';
  isDeleted?: boolean;
}

export interface CreateStockWarehouseRequest {
  name: string;
  productId: string;
  type: StockWarehouseType;
  costPrice: number;
  sellNote?: string;
  isVisible: boolean;
}

export interface UpdateStockWarehouseRequest extends Partial<CreateStockWarehouseRequest> {
  isDeleted?: boolean;
}

export interface CreateStockWarehouseItemRequest {
  warehouseId: string;
  code: string;
  serialNumber?: string;
  pin?: string;
  costPrice?: number;
  expiresAt?: string;
  notes?: string;
}

export interface ImportStockWarehouseItemsRequest {
  warehouseId: string;
  lines: string;
  costPrice?: number;
  expiresAt?: string;
  notes?: string;
}

export interface UpdateStockWarehouseItemRequest extends Partial<CreateStockWarehouseItemRequest> {
  status?: StockWarehouseItemStatus;
  isDeleted?: boolean;
}

export interface BulkUpdateStockWarehouseItemsRequest {
  ids: string[];
  status?: StockWarehouseItemStatus;
  isDeleted?: boolean;
}
