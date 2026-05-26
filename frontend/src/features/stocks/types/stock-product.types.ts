import { LocalizedText } from './stock-service.types';
import { StockCategory } from './stock-category.types';
import { StockService } from './stock-service.types';
import { SettingsApi } from '@/features/settings/types/settings.types';
import { StockProductRequirement } from './stock-product-requirement.types';
import { StockProductGroup } from './stock-product-group.types';

export const productQuantityModes = ['WITHOUT_QUANTITY', 'QUANTITY', 'COUNTER', 'CUSTOMIZE'] as const;
export type ProductQuantityMode = typeof productQuantityModes[number];
export const productSpecialPricingTypes = ['INCREMENT', 'PERCENT'] as const;
export type ProductSpecialPricingType = typeof productSpecialPricingTypes[number];
export const productFulfillmentTypes = ['API', 'WAREHOUSE', 'MANUAL'] as const;
export type ProductFulfillmentType = typeof productFulfillmentTypes[number];

export interface StockProduct {
  _id: string;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  categoryId: Pick<StockCategory, '_id' | 'name' | 'serviceId'> | string;
  groupId?: Pick<StockProductGroup, '_id' | 'name' | 'image' | 'coverImage'> | string;
  apiId?: Pick<SettingsApi, '_id' | 'name' | 'group'> | string;
  apiGroup?: SettingsApi['group'];
  apiProductId?: string;
  apiProductKey?: string;
  apiPayload?: Record<string, unknown>;
  visibleCountryCodes?: string[];
  apiLastSyncedAt?: string;
  apiSyncStatus?: 'SYNCED' | 'MISSING' | 'ERROR';
  apiSyncError?: string;
  name: LocalizedText;
  serviceNumber?: string;
  costPrice: number;
  costManual?: number;
  forQuantity: number;
  description: LocalizedText;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  speed?: string;
  startTime?: string;
  quantityAvailable: boolean;
  isVisible: boolean;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  stock: boolean;
  fulfillmentType: ProductFulfillmentType;
  specialSellPrice?: {
    pricingType: ProductSpecialPricingType;
    value: number;
    negativeValue: number;
    agentRatio: number;
  };
  requirements: Pick<StockProductRequirement, '_id' | 'paramsName' | 'message' | 'description' | 'apiGroup' | 'inputType' | 'defaultValue' | 'isRequired' | 'isDeleted'>[] | string[];
  image?: {
    uploadId: string;
    publicId: string;
    secureUrl: string;
  };
  isDeleted: boolean;
  sortOrder: number;
  deletedAt?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockProductRequest {
  serviceId: string;
  categoryId: string;
  groupId?: string;
  apiId?: string;
  name: LocalizedText;
  serviceNumber?: string;
  costPrice: number;
  costManual?: number;
  forQuantity: number;
  description: LocalizedText;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: string;
  speed?: string;
  startTime?: string;
  quantityAvailable: boolean;
  isVisible: boolean;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  stock: boolean;
  fulfillmentType: ProductFulfillmentType;
  requirements?: string[];
  visibleCountryCodes?: string[];
  image: File;
}

export interface UpdateStockProductRequest extends Omit<CreateStockProductRequest, 'image'> {
  isDeleted: boolean;
  image?: File | null;
}

export interface StockProductFilters {
  page?: number;
  limit?: number;
  all?: 'true';
  search?: string;
  serviceId?: string;
  categoryId?: string;
  groupId?: string;
  apiId?: string;
  isVisible?: boolean;
  isDeleted?: boolean;
  hasSpecialSellPrice?: boolean;
  fulfillmentType?: ProductFulfillmentType;
}

export interface BulkUpdateStockProductsRequest {
  ids: string[];
  isVisible?: boolean;
  isDeleted?: boolean;
  groupId?: string;
  specialSellPrice?: {
    pricingType: ProductSpecialPricingType;
    value: number;
    negativeValue: number;
    agentRatio: number;
  } | null;
}

export interface ApiProductImportPreviewRequest {
  apiGroup: 'GIFT_CARD_PROVIDERS' | 'SOCIAL_MEDIA_SERVICE_PROVIDERS' | 'GIFT_CARD_PROVIDERS_2' | 'TEMPORARY_NUMBER_CODING_SITES' | 'RENEWABLE_NUMBER_CODING_SITES';
  apiId: string;
}

export interface ApiProductImportPreviewRow {
  providerProductId: string;
  apiProductKey: string;
  name: string;
  categoryName: string;
  providerPrice: number;
  providerCurrency: string;
  costPrice: number;
  basePrice?: number;
  available: boolean;
  productType: string;
  params: string[];
  qtyValues: unknown;
  categoryImage?: string;
  parentId?: string | number;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  existingProductId?: string;
  forQuantity: number;
}

export interface ImportApiProductsRequest extends ApiProductImportPreviewRequest {
  serviceId: string;
  categoryId?: string;
  productIds: string[];
  autoCreateCategories: boolean;
  updateExisting: boolean;
  isVisible: boolean;
  stock: boolean;
}

export interface ImportApiProductsResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface StockProductApiConnection {
  _id: string;
  productId: string;
  apiId: Pick<SettingsApi, '_id' | 'name' | 'group'> | string;
  apiGroup: SettingsApi['group'];
  apiProductId: string;
  apiProductKey: string;
  apiPayload?: Record<string, unknown>;
  providerPrice?: number;
  providerCurrency?: string;
  costPrice: number;
  forQuantity: number;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  quantityAvailable: boolean;
  requirements?: Pick<StockProductRequirement, '_id' | 'paramsName' | 'message' | 'description' | 'apiGroup' | 'inputType' | 'defaultValue' | 'isRequired' | 'isDeleted'>[];
  isActive: boolean;
  isDeleted: boolean;
  isLegacy?: boolean;
  lastSyncedAt?: string;
  syncStatus?: 'SYNCED' | 'MISSING' | 'ERROR';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductApiConnectionRequest {
  apiId: string;
  providerProductId: string;
}
