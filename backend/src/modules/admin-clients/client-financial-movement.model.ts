import mongoose, { Document, Model, Schema } from 'mongoose';

export const clientFinancialMovementTypes = ['DEPOSIT', 'WITHDRAW'] as const;
export type ClientFinancialMovementType = typeof clientFinancialMovementTypes[number];
export const clientFinancialMovementSources = ['ADMIN', 'PAYMENT_GATEWAY', 'BANK', 'PAYMENT_CODE', 'ORDER'] as const;
export type ClientFinancialMovementSource = typeof clientFinancialMovementSources[number];

export interface IClientFinancialMovement extends Document {
  clientId: mongoose.Types.ObjectId;
  type: ClientFinancialMovementType;
  amount: number;
  paymentMethodId?: mongoose.Types.ObjectId;
  source: ClientFinancialMovementSource;
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: string;
  originalAmount?: number;
  currencyId?: mongoose.Types.ObjectId;
  comment?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientFinancialMovementSchema = new Schema<IClientFinancialMovement>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: clientFinancialMovementTypes, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'SettingsPaymentGateway' },
    source: { type: String, enum: clientFinancialMovementSources, default: 'ADMIN', required: true, index: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String, trim: true },
    originalAmount: { type: Number, min: 0 },
    currencyId: { type: Schema.Types.ObjectId, ref: 'SettingsCurrency' },
    comment: { type: String, trim: true, maxlength: 1000 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

clientFinancialMovementSchema.index({ clientId: 1, createdAt: -1 });

export const ClientFinancialMovement: Model<IClientFinancialMovement> = mongoose.model<IClientFinancialMovement>(
  'ClientFinancialMovement',
  clientFinancialMovementSchema
);
