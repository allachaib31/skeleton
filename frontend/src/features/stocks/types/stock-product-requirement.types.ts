import { ApiGroup } from '@/features/settings/types/settings.types';
import { LocalizedText } from './stock-service.types';

export const requirementInputTypes = ['TEXT', 'NUMBER', 'TEXTAREA', 'SELECT', 'CHECKBOX'] as const;
export type RequirementInputType = typeof requirementInputTypes[number];

export interface StockProductRequirement {
  _id: string;
  paramsName: string;
  message: LocalizedText;
  description: LocalizedText;
  apiGroup: ApiGroup;
  inputType: RequirementInputType;
  defaultValue?: string;
  isRequired: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface StockProductRequirementPayload {
  paramsName: string;
  message: LocalizedText;
  description: LocalizedText;
  apiGroup: ApiGroup;
  inputType: RequirementInputType;
  defaultValue?: string;
  isRequired: boolean;
  isDeleted: boolean;
}

export interface StockProductRequirementFilters {
  page: number;
  limit: number;
  search?: string;
  apiGroup?: ApiGroup;
  isDeleted?: boolean;
}
