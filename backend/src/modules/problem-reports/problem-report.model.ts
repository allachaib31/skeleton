import mongoose, { Document, Model, Schema } from 'mongoose';

export const problemReportTypes = [
  'ORDER',
  'PAYMENT',
  'WALLET',
  'PRODUCT',
  'API_PROVIDER',
  'WAREHOUSE',
  'ACCOUNT_SECURITY',
  'REFUND',
  'GENERAL',
] as const;

export const problemReportStatuses = [
  'OPEN',
  'WAITING_ADMIN',
  'WAITING_CLIENT',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'CLOSED',
] as const;

export const problemReportPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const problemReportSenderRoles = ['CLIENT', 'ADMIN'] as const;

export type ProblemReportType = typeof problemReportTypes[number];
export type ProblemReportStatus = typeof problemReportStatuses[number];
export type ProblemReportPriority = typeof problemReportPriorities[number];
export type ProblemReportSenderRole = typeof problemReportSenderRoles[number];

export interface IProblemReport extends Document {
  reportNumber: string;
  clientId: mongoose.Types.ObjectId;
  assignedAdminId?: mongoose.Types.ObjectId;
  type: ProblemReportType;
  status: ProblemReportStatus;
  priority: ProblemReportPriority;
  subject: string;
  description: string;
  relatedOrderId?: mongoose.Types.ObjectId;
  relatedPaymentRequestId?: mongoose.Types.ObjectId;
  relatedFinancialMovementId?: mongoose.Types.ObjectId;
  relatedProductId?: mongoose.Types.ObjectId;
  relatedServiceId?: mongoose.Types.ObjectId;
  relatedCategoryId?: mongoose.Types.ObjectId;
  relatedApiId?: mongoose.Types.ObjectId;
  relatedWarehouseId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  lastMessageBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionNote?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProblemReportMessage extends Document {
  reportId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: ProblemReportSenderRole;
  message: string;
  isInternal: boolean;
  readByClientAt?: Date;
  readByAdminAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const problemReportSchema = new Schema<IProblemReport>({
  reportNumber: { type: String, required: true, unique: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String, enum: problemReportTypes, required: true, index: true },
  status: { type: String, enum: problemReportStatuses, default: 'OPEN', index: true },
  priority: { type: String, enum: problemReportPriorities, default: 'NORMAL', index: true },
  subject: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  relatedOrderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
  relatedPaymentRequestId: { type: Schema.Types.ObjectId, ref: 'PaymentRequest', index: true },
  relatedFinancialMovementId: { type: Schema.Types.ObjectId, ref: 'ClientFinancialMovement', index: true },
  relatedProductId: { type: Schema.Types.ObjectId, ref: 'StockProduct', index: true },
  relatedServiceId: { type: Schema.Types.ObjectId, ref: 'StockService', index: true },
  relatedCategoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', index: true },
  relatedApiId: { type: Schema.Types.ObjectId, ref: 'SettingsApi', index: true },
  relatedWarehouseId: { type: Schema.Types.ObjectId, ref: 'StockWarehouse', index: true },
  lastMessageAt: { type: Date, index: true },
  lastMessageBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  resolutionNote: { type: String, trim: true, maxlength: 5000 },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

problemReportSchema.index({ createdAt: -1 });
problemReportSchema.index({ clientId: 1, status: 1, createdAt: -1 });

const problemReportMessageSchema = new Schema<IProblemReportMessage>({
  reportId: { type: Schema.Types.ObjectId, ref: 'ProblemReport', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: problemReportSenderRoles, required: true },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  isInternal: { type: Boolean, default: false, index: true },
  readByClientAt: { type: Date },
  readByAdminAt: { type: Date },
}, { timestamps: true });

problemReportMessageSchema.index({ reportId: 1, createdAt: 1 });

export const ProblemReport: Model<IProblemReport> = mongoose.model<IProblemReport>('ProblemReport', problemReportSchema);
export const ProblemReportMessage: Model<IProblemReportMessage> = mongoose.model<IProblemReportMessage>('ProblemReportMessage', problemReportMessageSchema);
