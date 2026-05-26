import { z } from 'zod';
import { paymentRequestStatuses } from './payment-request.model';

const emptyStringToUndefined = (value: unknown) => value === '' ? undefined : value;

const jsonArray = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z.array(z.object({
  key: z.string().min(1).max(120),
  value: z.string().max(2048).optional(),
})).default([]));

export const createPaymentRequestSchema = z.object({
  paymentGatewayId: z.string().min(1),
  amount: z.coerce.number().positive(),
  serialNumber: z.string().max(200).optional(),
  clientComment: z.string().max(1000).optional(),
  inputs: jsonArray,
}).strict();

export const paymentRequestQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(300).optional(),
  status: z.preprocess(emptyStringToUndefined, z.enum(paymentRequestStatuses).optional()),
  gatewayKind: z.preprocess(emptyStringToUndefined, z.enum(['PAYMENT_GATEWAY', 'BANK']).optional()),
  paymentGatewayId: z.preprocess(emptyStringToUndefined, z.string().optional()),
  clientId: z.preprocess(emptyStringToUndefined, z.string().optional()),
  search: z.string().optional(),
}).passthrough();

export const reviewPaymentRequestSchema = z.object({
  adminComment: z.string().max(1000).optional(),
}).strict();
