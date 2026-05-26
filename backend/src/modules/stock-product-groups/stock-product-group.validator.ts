import { z } from 'zod';

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

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(180),
  fr: z.string().trim().min(1).max(180),
  ar: z.string().trim().min(1).max(180),
}).strict();

const localizedDescriptionSchema = z.object({
  en: z.string().trim().min(1).max(20000),
  fr: z.string().trim().min(1).max(20000),
  ar: z.string().trim().min(1).max(20000),
}).strict();

export const listStockProductGroupsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: z.preprocess(emptyStringToUndefined, z.string().trim().max(160).optional()),
}).strict();

export const createStockProductGroupSchema = z.object({
  name: z.preprocess(parseJsonField, localizedTextSchema),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema),
}).strict();
