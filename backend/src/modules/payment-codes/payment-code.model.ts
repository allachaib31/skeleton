import mongoose, { Document, Model, Schema } from 'mongoose';

export const paymentCodeStatuses = ['AVAILABLE', 'USED', 'DISABLED', 'EXPIRED'] as const;
export type PaymentCodeStatus = typeof paymentCodeStatuses[number];

export interface IPaymentCode extends Document {
  codeHash: string;
  codePrefix?: string;
  codeLast4: string;
  value: number;
  currencyId: mongoose.Types.ObjectId;
  status: PaymentCodeStatus;
  usedByClientId?: mongoose.Types.ObjectId;
  usedMovementId?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentCodeSchema = new Schema<IPaymentCode>(
  {
    codeHash: { type: String, required: true, unique: true, select: false },
    codePrefix: { type: String, trim: true, uppercase: true, maxlength: 20 },
    codeLast4: { type: String, required: true, trim: true, maxlength: 4 },
    value: { type: Number, required: true, min: 0 },
    currencyId: { type: Schema.Types.ObjectId, ref: 'SettingsCurrency', required: true, index: true },
    status: { type: String, enum: paymentCodeStatuses, default: 'AVAILABLE', required: true, index: true },
    usedByClientId: { type: Schema.Types.ObjectId, ref: 'User' },
    usedMovementId: { type: Schema.Types.ObjectId, ref: 'ClientFinancialMovement' },
    expiresAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 2000 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

paymentCodeSchema.index({ status: 1, isDeleted: 1 });
paymentCodeSchema.index({ usedByClientId: 1 });
paymentCodeSchema.index({ expiresAt: 1 });

export const PaymentCode: Model<IPaymentCode> = mongoose.model<IPaymentCode>('PaymentCode', paymentCodeSchema);
