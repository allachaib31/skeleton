import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  description?: string;
  module: string;
  action: string;
}

const permissionSchema = new Schema<IPermission>({
  name: { type: String, required: true, unique: true }, // e.g. users.read
  description: { type: String },
  module: { type: String, required: true }, // e.g. users
  action: { type: String, required: true }, // e.g. read, create
}, {
  timestamps: true,
});

export const Permission: Model<IPermission> = mongoose.model<IPermission>('Permission', permissionSchema);
