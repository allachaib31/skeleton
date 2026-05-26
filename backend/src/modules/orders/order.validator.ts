import { z } from 'zod';
import { orderStatuses, orderFulfillmentSources } from './order.model';

const parseNumberField = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export const listOrdersSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().int().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().int().min(1).max(300)).optional(),
  search: z.string().trim().max(120).optional(),
  clientId: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  status: z.enum(orderStatuses).optional(),
  fulfillmentSource: z.enum(orderFulfillmentSources).optional(),
  assignedAdminId: z.string().trim().optional(),
  needsAdminAction: z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean()).optional(),
});

export const orderIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createOrderSchema = z.object({
  clientId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  quantity: z.preprocess(parseNumberField, z.number().int().min(1)),
  requirements: z.record(z.string().trim(), z.union([z.string(), z.number(), z.boolean()]).transform(String)).optional(),
});

export const completeOrderSchema = z.object({
  deliveredItems: z.array(z.object({
    code: z.string().trim().max(400).optional(),
    serialNumber: z.string().trim().max(180).optional(),
    pin: z.string().trim().max(180).optional(),
    extraData: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
  providerResponse: z.record(z.string(), z.unknown()).optional(),
});

export const failOrderSchema = z.object({
  issueReason: z.string().trim().min(1).max(2000),
});

export const switchOrderApiSchema = z.object({
  connectionId: z.string().trim().min(1),
  requirements: z.record(z.string().trim(), z.union([z.string(), z.number(), z.boolean()]).transform(String)).optional(),
});
