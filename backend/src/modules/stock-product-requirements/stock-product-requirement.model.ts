import mongoose, { Document, Model, Schema } from 'mongoose';
import { apiGroups, ApiGroup } from '../settings-apis/settings-api.model';
import { LocalizedText } from '../stock-services/stock-service.model';

export const requirementInputTypes = ['TEXT', 'NUMBER', 'TEXTAREA', 'SELECT', 'CHECKBOX'] as const;
export type RequirementInputType = typeof requirementInputTypes[number];

export interface IStockProductRequirement extends Document {
  paramsName: string;
  message: LocalizedText;
  description: LocalizedText;
  apiGroup: ApiGroup;
  inputType: RequirementInputType;
  defaultValue?: string;
  isRequired: boolean;
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

const stockProductRequirementSchema = new Schema<IStockProductRequirement>(
  {
    paramsName: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    apiGroup: { type: String, enum: apiGroups, required: true },
    inputType: { type: String, enum: requirementInputTypes, required: true },
    defaultValue: { type: String, trim: true, maxlength: 1000 },
    isRequired: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockProductRequirementSchema.index({ apiGroup: 1, isDeleted: 1 });
stockProductRequirementSchema.index({ paramsName: 1, apiGroup: 1 }, { unique: true });

export const StockProductRequirement: Model<IStockProductRequirement> = mongoose.model<IStockProductRequirement>(
  'StockProductRequirement',
  stockProductRequirementSchema
);
