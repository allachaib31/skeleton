import { z } from 'zod';
import { serviceTypes } from '../stock-services/stock-service.model';

const parseNumberField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).max(180).optional()
);

export const listShopServicesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(100)).optional(),
  search: optionalTrimmedString,
  type: z.enum(serviceTypes).optional(),
}).strict();

export const listShopProductsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(100)).optional(),
  search: optionalTrimmedString,
  serviceId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
  groupId: optionalTrimmedString,
}).strict();

export const shopProductParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
}).strict();

export const listShopCategoriesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(100)).optional(),
  serviceId: optionalTrimmedString,
  search: optionalTrimmedString,
}).strict();

export const listShopProductGroupsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(100)).optional(),
  search: optionalTrimmedString,
  serviceId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
}).strict();

export const listShopCategoryItemsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(100)).optional(),
  search: optionalTrimmedString,
  serviceId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
}).strict();

export const createShopOrderSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.preprocess(parseNumberField, z.number().int().min(1).max(100000)),
  requirements: z.record(z.string().trim(), z.union([z.string(), z.number(), z.boolean()]).transform(String)).optional(),
}).strict();
