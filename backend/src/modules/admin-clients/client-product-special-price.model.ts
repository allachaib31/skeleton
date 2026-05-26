import mongoose, { Document, Model, Schema } from 'mongoose';
import { productSpecialPricingTypes, ProductSpecialPricingType } from '../stock-products/stock-product.model';

export interface IClientProductSpecialPrice extends Document {
  clientId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  pricingType: ProductSpecialPricingType;
  value: number;
  negativeValue: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientProductSpecialPriceSchema = new Schema<IClientProductSpecialPrice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true },
    pricingType: { type: String, enum: productSpecialPricingTypes, required: true },
    value: { type: Number, required: true, min: 0 },
    negativeValue: { type: Number, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

clientProductSpecialPriceSchema.index({ clientId: 1, isDeleted: 1, createdAt: -1 });
clientProductSpecialPriceSchema.index(
  { clientId: 1, productId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const ClientProductSpecialPrice: Model<IClientProductSpecialPrice> = mongoose.model<IClientProductSpecialPrice>(
  'ClientProductSpecialPrice',
  clientProductSpecialPriceSchema
);
