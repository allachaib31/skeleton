import mongoose, { Document, Model, Schema } from 'mongoose';
import { ApiGroup, apiGroups } from '../settings-apis/settings-api.model';
import { LocalizedText } from '../stock-services/stock-service.model';

export const orderStatuses = ['PENDING_MANUAL', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export type OrderStatus = typeof orderStatuses[number];

export const orderFulfillmentSources = ['WAREHOUSE', 'API', 'MANUAL'] as const;
export type OrderFulfillmentSource = typeof orderFulfillmentSources[number];

export interface OrderRequirementSnapshot {
  requirementId?: mongoose.Types.ObjectId;
  paramsName: string;
  message?: LocalizedText;
  value: string;
}

export interface OrderDeliveredItem {
  warehouseItemId?: mongoose.Types.ObjectId;
  code?: string;
  serialNumber?: string;
  pin?: string;
  extraData?: Record<string, unknown>;
}

export interface IOrder extends Document {
  orderNumber: string;
  clientId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  productName: LocalizedText;
  quantity: number;
  fulfillmentSource: OrderFulfillmentSource;
  status: OrderStatus;
  needsAdminAction: boolean;
  issueReason?: string;
  assignedAdminId?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  apiId?: mongoose.Types.ObjectId;
  apiGroup?: ApiGroup;
  apiProductId?: string;
  apiConnectionId?: mongoose.Types.ObjectId;
  providerOrderId?: string;
  providerResponse?: Record<string, unknown>;
  providerStatus?: string;
  statusCheckAttempts: number;
  nextStatusCheckAt?: Date;
  statusCheckStartedAt?: Date;
  statusCheckLastAt?: Date;
  unitCost: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMovementId?: mongoose.Types.ObjectId;
  refundMovementId?: mongoose.Types.ObjectId;
  promotionId?: mongoose.Types.ObjectId;
  promotionUsageId?: mongoose.Types.ObjectId;
  levelPointsApplied: boolean;
  levelPointsAppliedAt?: Date;
  levelPointsAmount?: number;
  requirementSnapshots: OrderRequirementSnapshot[];
  deliveredItems: OrderDeliveredItem[];
  completedAt?: Date;
  cancelledAt?: Date;
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

const orderRequirementSnapshotSchema = new Schema<OrderRequirementSnapshot>(
  {
    requirementId: { type: Schema.Types.ObjectId, ref: 'StockProductRequirement' },
    paramsName: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: localizedTextSchema },
    value: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { _id: false }
);

const orderDeliveredItemSchema = new Schema<OrderDeliveredItem>(
  {
    warehouseItemId: { type: Schema.Types.ObjectId, ref: 'StockWarehouseItem' },
    code: { type: String, trim: true, maxlength: 400 },
    serialNumber: { type: String, trim: true, maxlength: 180 },
    pin: { type: String, trim: true, maxlength: 180 },
    extraData: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'StockProduct', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'StockService', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'StockCategory', required: true, index: true },
    productName: { type: localizedTextSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    fulfillmentSource: { type: String, enum: orderFulfillmentSources, required: true, index: true },
    status: { type: String, enum: orderStatuses, required: true, index: true },
    needsAdminAction: { type: Boolean, default: false, index: true },
    issueReason: { type: String, trim: true, maxlength: 2000 },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAt: { type: Date },
    apiId: { type: Schema.Types.ObjectId, ref: 'SettingsApi' },
    apiGroup: { type: String, enum: apiGroups },
    apiProductId: { type: String, trim: true, maxlength: 180 },
    apiConnectionId: { type: Schema.Types.ObjectId, ref: 'StockProductApiConnection' },
    providerOrderId: { type: String, trim: true, maxlength: 200 },
    providerResponse: { type: Schema.Types.Mixed },
    providerStatus: { type: String, trim: true, maxlength: 120 },
    statusCheckAttempts: { type: Number, default: 0, min: 0, index: true },
    nextStatusCheckAt: { type: Date, index: true },
    statusCheckStartedAt: { type: Date },
    statusCheckLastAt: { type: Date },
    unitCost: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    paymentMovementId: { type: Schema.Types.ObjectId, ref: 'ClientFinancialMovement' },
    refundMovementId: { type: Schema.Types.ObjectId, ref: 'ClientFinancialMovement' },
    promotionId: { type: Schema.Types.ObjectId, ref: 'StockPromotion' },
    promotionUsageId: { type: Schema.Types.ObjectId, ref: 'StockPromotionUsage' },
    levelPointsApplied: { type: Boolean, default: false, index: true },
    levelPointsAppliedAt: { type: Date },
    levelPointsAmount: { type: Number, min: 0 },
    requirementSnapshots: { type: [orderRequirementSnapshotSchema], default: [] },
    deliveredItems: { type: [orderDeliveredItemSchema], default: [] },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, needsAdminAction: 1, createdAt: -1 });
orderSchema.index({ assignedAdminId: 1, status: 1 });
orderSchema.index({ fulfillmentSource: 1, status: 1, needsAdminAction: 1, nextStatusCheckAt: 1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
