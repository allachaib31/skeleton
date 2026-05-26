import { LocalizedText, StockService } from './stock-service.types';

export interface StockCategory {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  image?: {
    uploadId: string;
    publicId: string;
    secureUrl: string;
  };
  isVisible: boolean;
  isDeleted: boolean;
  sortOrder: number;
  deletedAt?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockCategoryRequest {
  name: LocalizedText;
  description: LocalizedText;
  serviceId: string;
  isVisible: boolean;
  isDeleted: boolean;
  image: File;
}

export interface UpdateStockCategoryRequest extends Omit<CreateStockCategoryRequest, 'image'> {
  image?: File | null;
}
