import mongoose, { Document, Model, Schema } from 'mongoose';
import { ApiGroup, apiGroups } from '../settings-apis/settings-api.model';
import { ProductQuantityMode, productQuantityModes } from './stock-product.model';

export type ProductApiConnectionSyncStatus = 'SYNCED' | 'MISSING' | 'ERROR';

export interface IStockProductApiConnection extends Document {
  productId: mongoose.Types.ObjectId;
  apiId: mongoose.Types.ObjectId;
  apiGroup: ApiGroup;
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
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  lastSyncedAt?: Date;
  syncStatus?: ProductApiConnectionSyncStatus;
  syncError?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockProductApiConnectionSchema = new Schema<IStockProductApiConnection>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true },
    apiId: { type: Schema.Types.ObjectId, ref: 'SettingsApi', required: true },
    apiGroup: { type: String, enum: apiGroups, required: true },
    apiProductId: { type: String, required: true, trim: true, maxlength: 180 },
    apiProductKey: { type: String, required: true, trim: true, maxlength: 260 },
    apiPayload: { type: Schema.Types.Mixed },
    providerPrice: { type: Number, min: 0 },
    providerCurrency: { type: String, trim: true, maxlength: 20 },
    costPrice: { type: Number, required: true, min: 0 },
    forQuantity: { type: Number, required: true, min: 1 },
    quantityMode: { type: String, enum: productQuantityModes, required: true },
    minQuantity: { type: Number, min: 0 },
    maxQuantity: { type: Number, min: 0 },
    customQuantities: [{ type: Number, min: 0 }],
    quantityAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    lastSyncedAt: { type: Date },
    syncStatus: { type: String, enum: ['SYNCED', 'MISSING', 'ERROR'], default: 'SYNCED' },
    syncError: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockProductApiConnectionSchema.index({ productId: 1, isDeleted: 1, isActive: 1 });
stockProductApiConnectionSchema.index({ apiId: 1, apiProductId: 1, isDeleted: 1 });
stockProductApiConnectionSchema.index(
  { productId: 1, apiProductKey: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const StockProductApiConnection: Model<IStockProductApiConnection> =
  mongoose.model<IStockProductApiConnection>('StockProductApiConnection', stockProductApiConnectionSchema);
