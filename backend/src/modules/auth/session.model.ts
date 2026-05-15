import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    device?: string;
    os?: string;
    browser?: string;
  };
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    os: String,
    browser: String
  },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

sessionSchema.index({ userId: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);
