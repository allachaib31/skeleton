export const stockServiceTypes = [
  'DIGITAL_BASICS',
  'SOCIAL_REINFORCERS',
  'ESIM_NUMBER',
  'PHONE_NUMBER_GENERATOR',
] as const;

export type StockServiceType = typeof stockServiceTypes[number];

export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}

export interface StockService {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  type: StockServiceType;
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

export interface CreateStockServiceRequest {
  name: LocalizedText;
  description: LocalizedText;
  type: StockServiceType;
  isVisible: boolean;
  isDeleted: boolean;
  image: File;
}

export interface UpdateStockServiceRequest extends Omit<CreateStockServiceRequest, 'image'> {
  image?: File | null;
}
