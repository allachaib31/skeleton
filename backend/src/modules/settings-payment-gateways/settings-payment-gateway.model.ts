import mongoose, { Document, Model, Schema } from 'mongoose';
import { LocalizedText } from '../stock-services/stock-service.model';

export const paymentGatewayKinds = ['PAYMENT_GATEWAY', 'BANK'] as const;
export const paymentGatewayTaxTypes = ['INCREASE', 'PERCENT'] as const;
export const paymentGatewayInfoTypes = ['TEXT', 'IMAGE', 'QR_CODE'] as const;

export type PaymentGatewayKind = typeof paymentGatewayKinds[number];
export type PaymentGatewayTaxType = typeof paymentGatewayTaxTypes[number];
export type PaymentGatewayInfoType = typeof paymentGatewayInfoTypes[number];

interface UploadedImage {
  uploadId: mongoose.Types.ObjectId;
  publicId: string;
  secureUrl: string;
}

interface PaymentGatewayInfoField {
  label: LocalizedText;
  type: PaymentGatewayInfoType;
  value: string;
}

export interface ISettingsPaymentGateway extends Document {
  kind: PaymentGatewayKind;
  name: LocalizedText;
  link?: string;
  token?: string;
  currencyId?: mongoose.Types.ObjectId;
  description?: LocalizedText;
  infoFields: PaymentGatewayInfoField[];
  taxType: PaymentGatewayTaxType;
  taxValue: number;
  minMoney: number;
  maxMoney: number;
  requiresImage: boolean;
  requiresSerialNumber: boolean;
  image: UploadedImage;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
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

const uploadedImageSchema = new Schema<UploadedImage>(
  {
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
  },
  { _id: false }
);

const paymentGatewayInfoFieldSchema = new Schema<PaymentGatewayInfoField>(
  {
    label: { type: localizedTextSchema, required: true },
    type: { type: String, enum: paymentGatewayInfoTypes, required: true },
    value: { type: String, required: true, trim: true, maxlength: 2048 },
  },
  { _id: false }
);

const settingsPaymentGatewaySchema = new Schema<ISettingsPaymentGateway>(
  {
    kind: { type: String, enum: paymentGatewayKinds, required: true, index: true },
    name: { type: localizedTextSchema, required: true },
    link: { type: String, trim: true, maxlength: 2048 },
    token: { type: String, trim: true, select: false },
    currencyId: { type: Schema.Types.ObjectId, ref: 'SettingsCurrency' },
    description: { type: localizedTextSchema },
    infoFields: { type: [paymentGatewayInfoFieldSchema], default: [] },
    taxType: { type: String, enum: paymentGatewayTaxTypes, required: true },
    taxValue: { type: Number, required: true, min: 0, default: 0 },
    minMoney: { type: Number, required: true, min: 0 },
    maxMoney: { type: Number, required: true, min: 0 },
    requiresImage: { type: Boolean, default: false },
    requiresSerialNumber: { type: Boolean, default: false },
    image: { type: uploadedImageSchema, required: true },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settingsPaymentGatewaySchema.index({ kind: 1, isDeleted: 1, isVisible: 1 });
settingsPaymentGatewaySchema.index({ currencyId: 1 });

export const SettingsPaymentGateway: Model<ISettingsPaymentGateway> = mongoose.model<ISettingsPaymentGateway>(
  'SettingsPaymentGateway',
  settingsPaymentGatewaySchema
);
