import mongoose, { Document, Model, Schema } from 'mongoose';

export const paymentCodeJournalStatuses = ['SUCCESS', 'FAILED'] as const;
export type PaymentCodeJournalStatus = typeof paymentCodeJournalStatuses[number];

export const paymentCodeJournalReasons = [
  'REDEEMED',
  'NOT_FOUND',
  'USED',
  'DISABLED',
  'EXPIRED',
  'DELETED',
  'INVALID_FORMAT',
  'CLIENT_NOT_FOUND',
] as const;
export type PaymentCodeJournalReason = typeof paymentCodeJournalReasons[number];

export interface IPaymentCodeJournal extends Document {
  clientId?: mongoose.Types.ObjectId;
  paymentCodeId?: mongoose.Types.ObjectId;
  codeHash: string;
  codePrefix?: string;
  codeLast4?: string;
  status: PaymentCodeJournalStatus;
  reason: PaymentCodeJournalReason;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const paymentCodeJournalSchema = new Schema<IPaymentCodeJournal>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    paymentCodeId: { type: Schema.Types.ObjectId, ref: 'PaymentCode', index: true },
    codeHash: { type: String, required: true, select: false },
    codePrefix: { type: String, trim: true, uppercase: true, maxlength: 20 },
    codeLast4: { type: String, trim: true, maxlength: 4 },
    status: { type: String, enum: paymentCodeJournalStatuses, required: true, index: true },
    reason: { type: String, enum: paymentCodeJournalReasons, required: true, index: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

paymentCodeJournalSchema.index({ createdAt: -1 });

export const PaymentCodeJournal: Model<IPaymentCodeJournal> = mongoose.model<IPaymentCodeJournal>('PaymentCodeJournal', paymentCodeJournalSchema);
