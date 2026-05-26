import { StockService } from './stock-service.types';

export const serviceGroupPricingTypes = ['INCREASE', 'PERCENT'] as const;
export type ServiceGroupPricingType = typeof serviceGroupPricingTypes[number];

export interface StockServiceGroup {
  _id: string;
  name: string;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  pricingType: ServiceGroupPricingType;
  value: number;
  negativeValue: number;
  percentAgent: number;
  entitlementValue: number;
  isDefault: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface StockServiceGroupFilters {
  page: number;
  limit: number;
  serviceId?: string;
  isDeleted?: boolean;
}

export interface CreateStockServiceGroupRequest {
  name: string;
  serviceId: string;
  pricingType: ServiceGroupPricingType;
  value: number;
  negativeValue: number;
  percentAgent: number;
  entitlementValue: number;
  isDefault: boolean;
  isDeleted: boolean;
}

export type UpdateStockServiceGroupRequest = Partial<CreateStockServiceGroupRequest>;
