import { PaginationQuery } from '@/shared/types/api.types';
import { LocalizedText, StockServiceType } from '@/features/stocks/types/stock-service.types';
import { ProductFulfillmentType, ProductQuantityMode } from '@/features/stocks/types/stock-product.types';
import { RequirementInputType } from '@/features/stocks/types/stock-product-requirement.types';

export interface ShopImage {
  uploadId?: string;
  publicId?: string;
  secureUrl?: string;
}

export interface ShopServiceItem {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  type: StockServiceType;
  image?: ShopImage;
  productCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProductItem {
  _id: string;
  serviceId: Pick<ShopServiceItem, '_id' | 'name' | 'type'> | string;
  categoryId?: { _id: string; name: LocalizedText; serviceId?: string } | string;
  groupId?: { _id: string; name: LocalizedText; image?: ShopImage; coverImage?: ShopImage } | string;
  name: LocalizedText;
  description: LocalizedText;
  quantityMode: ProductQuantityMode;
  minQuantity?: number;
  maxQuantity?: number;
  customQuantities?: number[];
  quantityAvailable: boolean;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  stock: boolean;
  fulfillmentType: ProductFulfillmentType;
  apiGroup?: string;
  numberCountries?: Array<{
    countryCode: string;
    countryName?: string;
    flag?: string;
    price?: number;
    count?: number;
  }>;
  visibleCountryCodes?: string[];
  image?: ShopImage;
  requirements?: Array<ShopProductRequirementItem | string>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProductRequirementItem {
  _id: string;
  paramsName: string;
  message: LocalizedText;
  description: LocalizedText;
  inputType: RequirementInputType;
  defaultValue?: string;
  isRequired: boolean;
}

export interface ShopProductFilters extends PaginationQuery {
  serviceId?: string;
  categoryId?: string;
  groupId?: string;
}

export interface ShopServiceFilters extends PaginationQuery {
  type?: StockServiceType;
}

export interface ShopCategoryItem {
  _id: string;
  name: LocalizedText;
  serviceId: string;
  image?: ShopImage;
  sortOrder: number;
}

export interface ShopCategoryFilters extends PaginationQuery {
  serviceId?: string;
  search?: string;
}

export interface ShopProductGroupItem {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  image?: ShopImage;
  coverImage?: ShopImage;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProductGroupFilters extends PaginationQuery {
  serviceId?: string;
  categoryId?: string;
  search?: string;
}

export type ShopCategoryCatalogItem =
  | { type: 'GROUP'; group: ShopProductGroupItem }
  | { type: 'PRODUCT'; product: ShopProductItem };

export interface ShopCategoryCatalogFilters extends PaginationQuery {
  serviceId?: string;
  categoryId?: string;
  search?: string;
}

export interface CreateShopOrderRequest {
  productId: string;
  quantity: number;
  requirements?: Record<string, string>;
}
