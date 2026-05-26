import { z } from 'zod';
import { apiGroups } from '../settings-apis/settings-api.model';
import { requirementInputTypes } from './stock-product-requirement.model';

const parseBooleanField = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const parseNumberField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

const parseJsonField = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(500),
  fr: z.string().trim().min(1).max(500),
  ar: z.string().trim().min(1).max(500),
}).strict();

const localizedDescriptionSchema = z.object({
  en: z.string().trim().min(1).max(2000),
  fr: z.string().trim().min(1).max(2000),
  ar: z.string().trim().min(1).max(2000),
}).strict();

export const listStockProductRequirementsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: optionalTrimmedString,
  apiGroup: z.enum(apiGroups).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const createStockProductRequirementSchema = z.object({
  paramsName: z.string().trim().min(1).max(160),
  message: z.preprocess(parseJsonField, localizedTextSchema),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema),
  apiGroup: z.enum(apiGroups),
  inputType: z.enum(requirementInputTypes),
  defaultValue: z.string().trim().max(1000).optional(),
  isRequired: z.preprocess(parseBooleanField, z.boolean()).default(false),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

export const updateStockProductRequirementSchema = createStockProductRequirementSchema.partial().strict();
