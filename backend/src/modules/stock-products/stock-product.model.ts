import mongoose, { Document, Model, Schema } from 'mongoose';
import { ApiGroup, apiGroups } from '../settings-apis/settings-api.model';
import { LocalizedText } from '../stock-services/stock-service.model';

export const productQuantityModes = ['WITHOUT_QUANTITY', 'QUANTITY', 'COUNTER', 'CUSTOMIZE'] as const;
export type ProductQuantityMode = typeof productQuantityModes[number];
export const productSpecialPricingTypes = ['INCREMENT', 'PERCENT'] as const;
export type ProductSpecialPricingType = typeof productSpecialPricingTypes[number];
export const productFulfillmentTypes = ['API', 'WAREHOUSE', 'MANUAL'] as const;
export type ProductFulfillmentType = typeof productFulfillmentTypes[number];

interface ProductSpecialSellPrice {
  pricingType: ProductSpecialPricingType;
  value: number;
  negativeValue: number;
  agentRatio: number;
}

export interface IStockProduct extends Document {
  serviceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  apiId?: mongoose.Types.ObjectId;
  apiGroup?: ApiGroup;
  apiProductId?: string;
  apiProductKey?: string;
  apiPayload?: Record<string, unknown>;
  visibleCountryCodes?: string[];
  apiLastSyncedAt?: Date;
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
  specialSellPrice?: ProductSpecialSellPrice;
  requirements: mongoose.Types.ObjectId[];
  image?: {
    uploadId: mongoose.Types.ObjectId;
    publicId: string;
    secureUrl: string;
  };
  isDeleted: boolean;
  sortOrder: number;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    en: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSpecialSellPriceSchema = new Schema<ProductSpecialSellPrice>(
  {
    pricingType: { type: String, enum: productSpecialPricingTypes, required: true },
    value: { type: Number, required: true, min: 0 },
    negativeValue: { type: Number, required: true, min: 0 },
    agentRatio: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const stockProductSchema = new Schema<IStockProduct>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'StockProductGroup' },
    apiId: { type: Schema.Types.ObjectId, ref: 'SettingsApi' },
    apiGroup: { type: String, enum: apiGroups },
    apiProductId: { type: String, trim: true, maxlength: 180 },
    apiProductKey: { type: String, trim: true, maxlength: 260 },
    apiPayload: { type: Schema.Types.Mixed },
    visibleCountryCodes: [{ type: String, trim: true, maxlength: 20 }],
    apiLastSyncedAt: { type: Date },
    apiSyncStatus: { type: String, enum: ['SYNCED', 'MISSING', 'ERROR'] },
    apiSyncError: { type: String, trim: true, maxlength: 1000 },
    name: { type: localizedTextSchema, required: true },
    serviceNumber: { type: String, trim: true, maxlength: 120 },
    costPrice: { type: Number, required: true, min: 0 },
    costManual: { type: Number, min: 0 },
    forQuantity: { type: Number, required: true, min: 1 },
    description: { type: localizedTextSchema, required: true },
    quantityMode: { type: String, enum: productQuantityModes, required: true },
    minQuantity: { type: Number, min: 0 },
    maxQuantity: { type: Number, min: 0 },
    customQuantities: [{ type: Number, min: 0 }],
    speed: { type: String, trim: true, maxlength: 120 },
    startTime: { type: String, trim: true, maxlength: 120 },
    quantityAvailable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    dripfeed: { type: Boolean, default: false },
    refill: { type: Boolean, default: false },
    cancel: { type: Boolean, default: false },
    stock: { type: Boolean, default: true },
    fulfillmentType: { type: String, enum: productFulfillmentTypes, default: 'MANUAL', required: true },
    specialSellPrice: { type: productSpecialSellPriceSchema },
    requirements: [{ type: Schema.Types.ObjectId, ref: 'StockProductRequirement' }],
    image: {
      uploadId: { type: Schema.Types.ObjectId, ref: 'Upload' },
      publicId: { type: String },
      secureUrl: { type: String },
    },
    isDeleted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockProductSchema.index({ serviceId: 1, categoryId: 1, isDeleted: 1, isVisible: 1 });
stockProductSchema.index({ groupId: 1 });
stockProductSchema.index({ apiId: 1 });
stockProductSchema.index({ apiProductKey: 1 }, { unique: true, sparse: true });
stockProductSchema.index({ apiGroup: 1, apiSyncStatus: 1 });
stockProductSchema.index({ requirements: 1 });
stockProductSchema.index({ sortOrder: 1, createdAt: -1 });

export const StockProduct: Model<IStockProduct> = mongoose.model<IStockProduct>('StockProduct', stockProductSchema);
