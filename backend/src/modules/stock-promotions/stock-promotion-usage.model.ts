import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStockPromotionUsage extends Document {
  promotionId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const stockPromotionUsageSchema = new Schema<IStockPromotionUsage>(
  {
    promotionId: { type: Schema.Types.ObjectId, ref: 'StockPromotion', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId },
    discountAmount: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

stockPromotionUsageSchema.index({ promotionId: 1, clientId: 1, createdAt: -1 });

export const StockPromotionUsage: Model<IStockPromotionUsage> = mongoose.model<IStockPromotionUsage>(
  'StockPromotionUsage',
  stockPromotionUsageSchema
);
