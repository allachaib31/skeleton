import mongoose, { Document, Model, Schema } from 'mongoose';

export const apiGroups = [
  'TEMPORARY_NUMBER_CODING_SITES',
  'RENEWABLE_NUMBER_CODING_SITES',
  'SOCIAL_MEDIA_SERVICE_PROVIDERS',
  'GIFT_CARD_PROVIDERS',
  'GIFT_CARD_PROVIDERS_2',
  'SPECIAL_PROGRAMMING',
] as const;

export const apiSyncSchedules = [
  '*/1 * * * *',
  '*/5 * * * *',
  '*/10 * * * *',
  '*/20 * * * *',
  '*/30 * * * *',
  '*/40 * * * *',
  '*/50 * * * *',
  '0 * * * *',
  '0 */3 * * *',
  '0 */6 * * *',
  '0 */12 * * *',
  '0 0 * * *',
] as const;

export type ApiGroup = typeof apiGroups[number];
export type ApiSyncSchedule = typeof apiSyncSchedules[number];

export interface ISettingsApi extends Document {
  name: string;
  link: string;
  token: string;
  group: ApiGroup;
  currencyId: mongoose.Types.ObjectId;
  syncSchedule: ApiSyncSchedule;
  balance?: number;
  balanceCurrency?: string;
  balanceSyncedAt?: Date;
  lastSyncAt?: Date;
  syncStatus?: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  syncError?: string;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsApiSchema = new Schema<ISettingsApi>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    link: { type: String, required: true, trim: true, maxlength: 2048 },
    token: { type: String, required: true, select: false },
    group: { type: String, enum: apiGroups, required: true },
    currencyId: { type: Schema.Types.ObjectId, ref: 'SettingsCurrency', required: true },
    syncSchedule: { type: String, enum: apiSyncSchedules, required: true },
    balance: { type: Number },
    balanceCurrency: { type: String, trim: true, maxlength: 20 },
    balanceSyncedAt: { type: Date },
    lastSyncAt: { type: Date },
    syncStatus: { type: String, enum: ['IDLE', 'SYNCING', 'SUCCESS', 'ERROR'], default: 'IDLE' },
    syncError: { type: String, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settingsApiSchema.index({ group: 1, isDeleted: 1, isVisible: 1 });
settingsApiSchema.index({ currencyId: 1 });
settingsApiSchema.index({ syncSchedule: 1, lastSyncAt: 1, isVisible: 1, isDeleted: 1 });

export const SettingsApi: Model<ISettingsApi> = mongoose.model<ISettingsApi>('SettingsApi', settingsApiSchema);
