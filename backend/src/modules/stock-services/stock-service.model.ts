import mongoose, { Document, Model, Schema } from 'mongoose';

export const serviceTypes = [
  'DIGITAL_BASICS',
  'SOCIAL_REINFORCERS',
  'ESIM_NUMBER',
  'PHONE_NUMBER_GENERATOR',
] as const;

export type ServiceType = typeof serviceTypes[number];

export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}

export interface IStockService extends Document {
  name: LocalizedText;
  description: LocalizedText;
  type: ServiceType;
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

const stockServiceSchema = new Schema<IStockService>(
  {
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    type: { type: String, enum: serviceTypes, required: true },
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

stockServiceSchema.index({ type: 1, isDeleted: 1, isVisible: 1, sortOrder: 1 });
stockServiceSchema.index({ 'name.en': 'text', 'name.fr': 'text', 'name.ar': 'text' });

export const StockService: Model<IStockService> = mongoose.model<IStockService>('StockService', stockServiceSchema);
