import { LocalizedText } from './stock-service.types';

interface StockProductGroupImage {
  uploadId: string;
  publicId: string;
  secureUrl: string;
}

export interface StockProductGroup {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  image: StockProductGroupImage;
  coverImage: StockProductGroupImage;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockProductGroupRequest {
  name: LocalizedText;
  description: LocalizedText;
  image: File;
  coverImage: File;
}
