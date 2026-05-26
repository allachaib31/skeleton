import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettingsCurrency extends Document {
  name: string;
  shortName: string;
  icon?: {
    uploadId: mongoose.Types.ObjectId;
    publicId: string;
    secureUrl: string;
  };
  price: number;
  priceBuy: number;
  isDollar: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsCurrencySchema = new Schema<ISettingsCurrency>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    shortName: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
    icon: {
      uploadId: { type: Schema.Types.ObjectId, ref: 'Upload' },
      publicId: { type: String },
      secureUrl: { type: String },
    },
    price: { type: Number, required: true, min: 0 },
    priceBuy: { type: Number, required: true, min: 0 },
    isDollar: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settingsCurrencySchema.index({ shortName: 1 }, { unique: true });
settingsCurrencySchema.index({ isDeleted: 1, isVisible: 1 });

export const SettingsCurrency: Model<ISettingsCurrency> = mongoose.model<ISettingsCurrency>('SettingsCurrency', settingsCurrencySchema);
