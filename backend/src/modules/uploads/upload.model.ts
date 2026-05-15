import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUpload extends Document {
  ownerId: mongoose.Types.ObjectId;
  publicId: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  size: number;
  provider: 'cloudinary' | string;
  resourceType?: string;
  tags?: string[];
  createdAt: Date;
}

const uploadSchema = new Schema<IUpload>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  format: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  size: { type: Number, required: true },
  provider: { type: String, default: 'cloudinary' },
  resourceType: { type: String },
  tags: [{ type: String }],
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

uploadSchema.index({ ownerId: 1 });

export const Upload: Model<IUpload> = mongoose.model<IUpload>('Upload', uploadSchema);
