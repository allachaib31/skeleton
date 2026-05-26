import mongoose, { Document, Model, Schema } from 'mongoose';

export const stockWarehouseMovementTypes = ['IMPORT', 'RESERVE', 'RELEASE', 'SALE', 'DISABLE', 'RESTORE', 'UPDATE', 'DELETE'] as const;
export type StockWarehouseMovementType = typeof stockWarehouseMovementTypes[number];

export interface IStockWarehouseMovement extends Document {
  warehouseId: mongoose.Types.ObjectId;
  itemId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: StockWarehouseMovementType;
  quantity: number;
  beforeStatus?: string;
  afterStatus?: string;
  orderId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  comment?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const stockWarehouseMovementSchema = new Schema<IStockWarehouseMovement>(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: 'StockWarehouse', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'StockWarehouseItem' },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true, index: true },
    type: { type: String, enum: stockWarehouseMovementTypes, required: true, index: true },
    quantity: { type: Number, required: true, min: 0 },
    beforeStatus: { type: String },
    afterStatus: { type: String },
    orderId: { type: Schema.Types.ObjectId },
    clientId: { type: Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockWarehouseMovementSchema.index({ warehouseId: 1, createdAt: -1 });

export const StockWarehouseMovement: Model<IStockWarehouseMovement> = mongoose.model<IStockWarehouseMovement>('StockWarehouseMovement', stockWarehouseMovementSchema);
