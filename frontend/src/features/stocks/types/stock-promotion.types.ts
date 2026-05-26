import { AdminClient } from '@/features/clients/types/client.types';
import { LocalizedText, StockService } from './stock-service.types';
import { StockCategory } from './stock-category.types';
import { StockProduct } from './stock-product.types';
import { StockProductGroup } from './stock-product-group.types';
import { StockServiceGroup } from './stock-service-group.types';

export const stockPromotionTypes = ['FIXED', 'PERCENT'] as const;
export type StockPromotionType = typeof stockPromotionTypes[number];

export const stockPromotionTargetTypes = [
  'ALL_PRODUCTS',
  'SERVICE',
  'CATEGORY',
  'PRODUCT',
  'PRODUCT_GROUP',
  'CLIENT',
  'CLIENT_LEVEL_GROUP',
] as const;
export type StockPromotionTargetType = typeof stockPromotionTargetTypes[number];

export interface StockPromotion {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  promotionType: StockPromotionType;
  value: number;
  targetType: StockPromotionTargetType;
  serviceId?: Pick<StockService, '_id' | 'name' | 'type'> | string;
  categoryId?: Pick<StockCategory, '_id' | 'name' | 'serviceId'> | string;
  productId?: Pick<StockProduct, '_id' | 'name' | 'image' | 'serviceId' | 'categoryId'> | string;
  productGroupId?: Pick<StockProductGroup, '_id' | 'name' | 'image' | 'coverImage'> | string;
  clientId?: Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag'> | string;
  clientLevelGroupId?: Pick<StockServiceGroup, '_id' | 'name' | 'serviceId' | 'pricingType' | 'value' | 'entitlementValue'> | string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt?: string;
  priority: number;
  usageLimit?: number;
  usageCount: number;
  perClientLimit?: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface StockPromotionUsage {
  _id: string;
  promotionId: Pick<StockPromotion, '_id' | 'name' | 'promotionType' | 'value'> | string;
  clientId: Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag'> | string;
  productId: Pick<StockProduct, '_id' | 'name' | 'image' | 'serviceId' | 'categoryId'> | string;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  createdAt: string;
}

export interface StockPromotionFilters {
  page: number;
  limit: number;
  search?: string;
  targetType?: StockPromotionTargetType | '';
  promotionType?: StockPromotionType | '';
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface StockPromotionUsageFilters {
  page: number;
  limit: number;
  promotionId?: string;
  clientId?: string;
  productId?: string;
}

export interface CreateStockPromotionRequest {
  name: LocalizedText;
  description: LocalizedText;
  promotionType: StockPromotionType;
  value: number;
  targetType: StockPromotionTargetType;
  serviceId?: string;
  categoryId?: string;
  productId?: string;
  productGroupId?: string;
  clientId?: string;
  clientLevelGroupId?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt?: string;
  priority: number;
  usageLimit?: number;
  perClientLimit?: number;
  isActive: boolean;
  isDeleted: boolean;
}

export type UpdateStockPromotionRequest = Partial<CreateStockPromotionRequest>;
