import mongoose, { Document, Model, Schema } from 'mongoose';

export const serviceGroupPricingTypes = ['INCREASE', 'PERCENT'] as const;
export type ServiceGroupPricingType = typeof serviceGroupPricingTypes[number];

export interface IStockServiceGroup extends Document {
  name: string;
  serviceId: mongoose.Types.ObjectId;
  pricingType: ServiceGroupPricingType;
  value: number;
  negativeValue: number;
  percentAgent: number;
  entitlementValue: number;
  isDefault: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockServiceGroupSchema = new Schema<IStockServiceGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true, index: true },
    pricingType: { type: String, enum: serviceGroupPricingTypes, required: true },
    value: { type: Number, required: true, min: 0 },
    negativeValue: { type: Number, required: true, min: 0 },
    percentAgent: { type: Number, required: true, min: 0 },
    entitlementValue: { type: Number, required: true, min: 0 },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockServiceGroupSchema.index({ serviceId: 1, isDeleted: 1, createdAt: -1 });
stockServiceGroupSchema.index(
  { serviceId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

export const StockServiceGroup: Model<IStockServiceGroup> = mongoose.model<IStockServiceGroup>(
  'StockServiceGroup',
  stockServiceGroupSchema
);
