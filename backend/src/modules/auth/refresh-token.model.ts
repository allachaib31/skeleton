import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  sessionId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
}, {
  timestamps: true,
});

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
