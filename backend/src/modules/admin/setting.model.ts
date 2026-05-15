import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
}

const settingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true,
});

settingSchema.index({ key: 1 }, { unique: true });

export const Setting: Model<ISetting> = mongoose.model<ISetting>('Setting', settingSchema);
