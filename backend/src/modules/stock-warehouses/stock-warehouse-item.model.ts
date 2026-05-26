import mongoose, { Document, Model, Schema } from 'mongoose';

export const stockWarehouseItemStatuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED'] as const;
export type StockWarehouseItemStatus = typeof stockWarehouseItemStatuses[number];

export interface IStockWarehouseItem extends Document {
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  code: string;
  serialNumber?: string;
  pin?: string;
  extraData?: Record<string, unknown>;
  status: StockWarehouseItemStatus;
  reservedByOrderId?: mongoose.Types.ObjectId;
  soldByOrderId?: mongoose.Types.ObjectId;
  soldToClientId?: mongoose.Types.ObjectId;
  costPrice: number;
  expiresAt?: Date;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockWarehouseItemSchema = new Schema<IStockWarehouseItem>(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: 'StockWarehouse', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true, index: true },
    code: { type: String, required: true, trim: true, maxlength: 400 },
    serialNumber: { type: String, trim: true, maxlength: 180 },
    pin: { type: String, trim: true, maxlength: 180 },
    extraData: { type: Schema.Types.Mixed },
    status: { type: String, enum: stockWarehouseItemStatuses, default: 'AVAILABLE', required: true, index: true },
    reservedByOrderId: { type: Schema.Types.ObjectId },
    soldByOrderId: { type: Schema.Types.ObjectId },
    soldToClientId: { type: Schema.Types.ObjectId, ref: 'User' },
    costPrice: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 2000 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    soldAt: { type: Date },
  },
  { timestamps: true }
);

stockWarehouseItemSchema.index({ warehouseId: 1, status: 1, isDeleted: 1 });
stockWarehouseItemSchema.index({ productId: 1, status: 1, isDeleted: 1 });
stockWarehouseItemSchema.index(
  { productId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const StockWarehouseItem: Model<IStockWarehouseItem> = mongoose.model<IStockWarehouseItem>('StockWarehouseItem', stockWarehouseItemSchema);
