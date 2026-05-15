import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRole extends Document {
  name: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER' | 'GUEST';
  permissions: mongoose.Types.ObjectId[];
  description?: string;
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER', 'GUEST']
  },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  description: { type: String },
  isSystem: { type: Boolean, default: false }
}, {
  timestamps: true,
});

export const Role: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);
