import mongoose, { Document, Model, Schema } from 'mongoose';
import { LocalizedText } from '../stock-services/stock-service.model';

export const stockPromotionTypes = ['FIXED', 'PERCENT', 'SPECIAL_PRICE'] as const;
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

export interface IStockPromotion extends Document {
  name: LocalizedText;
  description: LocalizedText;
  promotionType: StockPromotionType;
  value: number;
  targetType: StockPromotionTargetType;
  serviceId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  productGroupId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  clientLevelGroupId?: mongoose.Types.ObjectId;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: Date;
  endAt?: Date;
  priority: number;
  usageLimit?: number;
  usageCount: number;
  perClientLimit?: number;
  isActive: boolean;
  isDeleted: boolean;
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

const stockPromotionSchema = new Schema<IStockPromotion>(
  {
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    promotionType: { type: String, enum: stockPromotionTypes, required: true },
    value: { type: Number, required: true, min: 0 },
    targetType: { type: String, enum: stockPromotionTargetTypes, required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', index: true },
    productGroupId: { type: Schema.Types.ObjectId, ref: 'StockProductGroup', index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    clientLevelGroupId: { type: Schema.Types.ObjectId, ref: 'StockServiceGroup', index: true },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, index: true },
    priority: { type: Number, required: true, default: 0, index: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, required: true, default: 0, min: 0 },
    perClientLimit: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockPromotionSchema.index({ isDeleted: 1, isActive: 1, priority: -1, startAt: -1 });
stockPromotionSchema.index({ targetType: 1, serviceId: 1, categoryId: 1, productId: 1 });

export const StockPromotion: Model<IStockPromotion> = mongoose.model<IStockPromotion>(
  'StockPromotion',
  stockPromotionSchema
);
