import mongoose, { Document, Model, Schema } from 'mongoose';

export const stockWarehouseTypes = ['CODE', 'CARD', 'ACCOUNT', 'FILE', 'TEXT'] as const;
export type StockWarehouseType = typeof stockWarehouseTypes[number];

export interface IStockWarehouse extends Document {
  name: string;
  productId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  type: StockWarehouseType;
  costPrice: number;
  sellNote?: string;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  disabledQuantity: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockWarehouseSchema = new Schema<IStockWarehouse>(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', required: true, index: true },
    type: { type: String, enum: stockWarehouseTypes, required: true },
    costPrice: { type: Number, default: 0, min: 0 },
    sellNote: { type: String, trim: true, maxlength: 2000 },
    totalQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },
    soldQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    disabledQuantity: { type: Number, default: 0, min: 0 },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockWarehouseSchema.index({ productId: 1, isDeleted: 1 });
stockWarehouseSchema.index({ serviceId: 1, categoryId: 1, isDeleted: 1 });

export const StockWarehouse: Model<IStockWarehouse> = mongoose.model<IStockWarehouse>('StockWarehouse', stockWarehouseSchema);
