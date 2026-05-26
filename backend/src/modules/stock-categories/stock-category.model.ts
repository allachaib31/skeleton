import mongoose, { Document, Model, Schema } from 'mongoose';
import { LocalizedText } from '../stock-services/stock-service.model';

export interface IStockCategory extends Document {
  name: LocalizedText;
  description: LocalizedText;
  serviceId: mongoose.Types.ObjectId;
  image?: {
    uploadId: mongoose.Types.ObjectId;
    publicId: string;
    secureUrl: string;
  };
  isVisible: boolean;
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

const stockCategorySchema = new Schema<IStockCategory>(
  {
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true },
    image: {
      uploadId: { type: Schema.Types.ObjectId, ref: 'Upload' },
      publicId: { type: String },
      secureUrl: { type: String },
    },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockCategorySchema.index({ serviceId: 1, isDeleted: 1, isVisible: 1, sortOrder: 1 });
stockCategorySchema.index({ 'name.en': 'text', 'name.fr': 'text', 'name.ar': 'text' });

export const StockCategory: Model<IStockCategory> = mongoose.model<IStockCategory>('StockCategory', stockCategorySchema);
