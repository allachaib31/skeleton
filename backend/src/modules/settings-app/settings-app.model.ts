import mongoose, { Document, Model, Schema } from 'mongoose';

export interface SettingsAsset {
  uploadId: mongoose.Types.ObjectId;
  publicId: string;
  secureUrl: string;
}

export interface ISettingsApp extends Document {
  key: 'default';
  appName: string;
  logo?: SettingsAsset;
  favicon?: SettingsAsset;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsAssetSchema = new Schema<SettingsAsset>(
  {
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
  },
  { _id: false }
);

const settingsAppSchema = new Schema<ISettingsApp>(
  {
    key: { type: String, enum: ['default'], default: 'default', unique: true },
    appName: { type: String, required: true, trim: true, maxlength: 120, default: 'tafa3olcard' },
    logo: { type: settingsAssetSchema },
    favicon: { type: settingsAssetSchema },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SettingsApp: Model<ISettingsApp> = mongoose.model<ISettingsApp>('SettingsApp', settingsAppSchema);
