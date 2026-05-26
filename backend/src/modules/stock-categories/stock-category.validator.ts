import { z } from 'zod';

const parseJsonField = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(160),
  fr: z.string().trim().min(1).max(160),
  ar: z.string().trim().min(1).max(160),
}).strict();

const localizedDescriptionSchema = z.object({
  en: z.string().trim().min(1).max(2000),
  fr: z.string().trim().min(1).max(2000),
  ar: z.string().trim().min(1).max(2000),
}).strict();

export const createStockCategorySchema = z.object({
  name: z.preprocess(parseJsonField, localizedTextSchema),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema),
  serviceId: z.string().trim().min(1),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

export const listStockCategoriesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  all: z.preprocess(emptyStringToUndefined, z.enum(['true']).optional()),
  search: z.preprocess(emptyStringToUndefined, z.string().trim().max(160).optional()),
  serviceId: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional()),
  isVisible: z.preprocess(emptyStringToUndefined, z.enum(['true', 'false']).optional()),
  isDeleted: z.preprocess(emptyStringToUndefined, z.enum(['true', 'false']).optional()),
}).strict();

export const updateStockCategorySchema = z.object({
  name: z.preprocess(parseJsonField, localizedTextSchema).optional(),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema).optional(),
  serviceId: z.string().trim().min(1).optional(),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const reorderStockCategoriesSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1),
}).strict();
