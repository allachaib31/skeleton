import { z } from 'zod';
import { stockWarehouseTypes } from './stock-warehouse.model';
import { stockWarehouseItemStatuses } from './stock-warehouse-item.model';

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

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i);

export const listStockWarehousesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: optionalString,
  serviceId: optionalString,
  categoryId: optionalString,
  productId: optionalString,
  type: z.preprocess(emptyToUndefined, z.enum(stockWarehouseTypes).optional()),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const createStockWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(180),
  productId: objectIdSchema,
  type: z.enum(stockWarehouseTypes),
  costPrice: z.preprocess(parseNumberField, z.number().min(0)).default(0),
  sellNote: z.string().trim().max(2000).optional().or(z.literal('')),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
}).strict();

export const updateStockWarehouseSchema = createStockWarehouseSchema
  .extend({
    isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
  })
  .partial()
  .strict();

export const listStockWarehouseItemsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: optionalString,
  warehouseId: optionalString,
  productId: optionalString,
  status: z.preprocess(emptyToUndefined, z.enum(stockWarehouseItemStatuses).optional()),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const createStockWarehouseItemSchema = z.object({
  warehouseId: objectIdSchema,
  code: z.string().trim().min(1).max(400),
  serialNumber: z.string().trim().max(180).optional().or(z.literal('')),
  pin: z.string().trim().max(180).optional().or(z.literal('')),
  costPrice: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).strict();

export const importStockWarehouseItemsSchema = z.object({
  warehouseId: objectIdSchema,
  lines: z.string().trim().min(1),
  costPrice: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).strict();

export const updateStockWarehouseItemSchema = z.object({
  code: z.string().trim().min(1).max(400).optional(),
  serialNumber: z.string().trim().max(180).optional().or(z.literal('')),
  pin: z.string().trim().max(180).optional().or(z.literal('')),
  status: z.enum(stockWarehouseItemStatuses).optional(),
  costPrice: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const bulkUpdateStockWarehouseItemsSchema = z.object({
  ids: z.array(objectIdSchema).min(1),
  status: z.enum(stockWarehouseItemStatuses).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict().refine((data) => data.status !== undefined || data.isDeleted !== undefined, {
  message: 'stockWarehouses.bulk_update_field_required',
});
