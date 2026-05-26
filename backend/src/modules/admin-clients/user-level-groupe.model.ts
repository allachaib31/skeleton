import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserLevelGroupe extends Document {
  clientId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const userLevelGroupeSchema = new Schema<IUserLevelGroupe>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'StockServiceGroup', required: true },
    points: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

userLevelGroupeSchema.index({ clientId: 1, serviceId: 1 }, { unique: true });
userLevelGroupeSchema.index({ clientId: 1, groupId: 1 });

export const UserLevelGroupe: Model<IUserLevelGroupe> = mongoose.model<IUserLevelGroupe>(
  'UserLevelGroupe',
  userLevelGroupeSchema
);
