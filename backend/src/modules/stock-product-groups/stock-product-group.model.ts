import mongoose, { Document, Model, Schema } from 'mongoose';
import { LocalizedText } from '../stock-services/stock-service.model';

interface UploadedImage {
  uploadId: mongoose.Types.ObjectId;
  publicId: string;
  secureUrl: string;
}

export interface IStockProductGroup extends Document {
  name: LocalizedText;
  description: LocalizedText;
  image: UploadedImage;
  coverImage: UploadedImage;
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

const uploadedImageSchema = new Schema<UploadedImage>(
  {
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
  },
  { _id: false }
);

const stockProductGroupSchema = new Schema<IStockProductGroup>(
  {
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    image: { type: uploadedImageSchema, required: true },
    coverImage: { type: uploadedImageSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockProductGroupSchema.index({ createdAt: -1 });

export const StockProductGroup: Model<IStockProductGroup> = mongoose.model<IStockProductGroup>(
  'StockProductGroup',
  stockProductGroupSchema
);
