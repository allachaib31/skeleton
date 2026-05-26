import mongoose, { Document, Model, Schema } from 'mongoose';
import { LocalizedText } from '../stock-services/stock-service.model';
import { PaymentGatewayKind, PaymentGatewayTaxType } from '../settings-payment-gateways/settings-payment-gateway.model';

export const paymentRequestStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const paymentRequestInputTypes = ['TEXT', 'IMAGE', 'QR_CODE', 'SERIAL'] as const;

export type PaymentRequestStatus = typeof paymentRequestStatuses[number];
export type PaymentRequestInputType = typeof paymentRequestInputTypes[number];

interface PaymentRequestUpload {
  uploadId: mongoose.Types.ObjectId;
  publicId: string;
  secureUrl: string;
}

interface PaymentRequestInput {
  key: string;
  label: LocalizedText;
  type: PaymentRequestInputType;
  value?: string;
  upload?: PaymentRequestUpload;
}

export interface IPaymentRequest extends Document {
  clientId: mongoose.Types.ObjectId;
  paymentGatewayId: mongoose.Types.ObjectId;
  gatewayKind: PaymentGatewayKind;
  currencyId?: mongoose.Types.ObjectId;
  amount: number;
  creditedAmount: number;
  taxType: PaymentGatewayTaxType;
  taxValue: number;
  taxAmount: number;
  payableAmount: number;
  status: PaymentRequestStatus;
  serialNumber?: string;
  clientComment?: string;
  adminComment?: string;
  inputs: PaymentRequestInput[];
  proofImage?: PaymentRequestUpload;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    en: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const paymentRequestUploadSchema = new Schema<PaymentRequestUpload>(
  {
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
  },
  { _id: false }
);

const paymentRequestInputSchema = new Schema<PaymentRequestInput>(
  {
    key: { type: String, required: true, trim: true, maxlength: 120 },
    label: { type: localizedTextSchema, required: true },
    type: { type: String, enum: paymentRequestInputTypes, required: true },
    value: { type: String, trim: true, maxlength: 2048 },
    upload: { type: paymentRequestUploadSchema },
  },
  { _id: false }
);

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentGatewayId: { type: Schema.Types.ObjectId, ref: 'SettingsPaymentGateway', required: true, index: true },
    gatewayKind: { type: String, enum: ['PAYMENT_GATEWAY', 'BANK'], required: true, index: true },
    currencyId: { type: Schema.Types.ObjectId, ref: 'SettingsCurrency' },
    amount: { type: Number, required: true, min: 0 },
    creditedAmount: { type: Number, required: true, min: 0 },
    taxType: { type: String, enum: ['INCREASE', 'PERCENT'], required: true },
    taxValue: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    payableAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: paymentRequestStatuses, default: 'PENDING', required: true, index: true },
    serialNumber: { type: String, trim: true, maxlength: 200 },
    clientComment: { type: String, trim: true, maxlength: 1000 },
    adminComment: { type: String, trim: true, maxlength: 1000 },
    inputs: { type: [paymentRequestInputSchema], default: [] },
    proofImage: { type: paymentRequestUploadSchema },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

paymentRequestSchema.index({ status: 1, createdAt: -1 });
paymentRequestSchema.index({ clientId: 1, createdAt: -1 });

export const PaymentRequest: Model<IPaymentRequest> = mongoose.model<IPaymentRequest>(
  'PaymentRequest',
  paymentRequestSchema
);
