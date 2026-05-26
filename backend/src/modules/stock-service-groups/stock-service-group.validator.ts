import { z } from 'zod';
import { serviceGroupPricingTypes } from './stock-service-group.model';

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

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

export const listStockServiceGroupsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  serviceId: optionalTrimmedString,
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

const stockServiceGroupBaseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  serviceId: z.string().trim().min(1),
  pricingType: z.enum(serviceGroupPricingTypes),
  value: z.preprocess(parseNumberField, z.number().min(0)),
  negativeValue: z.preprocess(parseNumberField, z.number().min(0)),
  percentAgent: z.preprocess(parseNumberField, z.number().min(0)),
  entitlementValue: z.preprocess(parseNumberField, z.number().min(0)),
  isDefault: z.preprocess(parseBooleanField, z.boolean()).default(false),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

export const createStockServiceGroupSchema = stockServiceGroupBaseSchema;

export const updateStockServiceGroupSchema = stockServiceGroupBaseSchema.partial().strict();
