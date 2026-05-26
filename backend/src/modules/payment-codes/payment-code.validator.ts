import { z } from 'zod';
import { paymentCodeStatuses } from './payment-code.model';

const parseNumberField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

const parseBooleanField = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);
const optionalString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i);

const codeSchema = z.string().trim().min(16).max(80).regex(/^[A-Za-z0-9-]+$/);

export const listPaymentCodesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: optionalString,
  currencyId: optionalString,
  status: z.preprocess(emptyToUndefined, z.enum(paymentCodeStatuses).optional()),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const createPaymentCodeSchema = z.object({
  code: codeSchema.optional().or(z.literal('')),
  value: z.preprocess(parseNumberField, z.number().positive()),
  currencyId: objectIdSchema,
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).strict();

export const generatePaymentCodesSchema = z.object({
  prefix: z.string().trim().max(12).regex(/^[A-Za-z0-9]*$/).optional().or(z.literal('')),
  count: z.preprocess(parseNumberField, z.number().int().min(1).max(500)),
  value: z.preprocess(parseNumberField, z.number().positive()),
  currencyId: objectIdSchema,
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).strict();

export const importPaymentCodesSchema = z.object({
  codes: z.string().trim().min(1).max(50000),
  value: z.preprocess(parseNumberField, z.number().positive()),
  currencyId: objectIdSchema,
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).strict();

export const updatePaymentCodeSchema = z.object({
  status: z.enum(paymentCodeStatuses).optional(),
  expiresAt: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const redeemPaymentCodeSchema = z.object({
  code: codeSchema,
}).strict();

export const listPaymentCodeJournalSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  clientId: optionalString,
  status: optionalString,
  reason: optionalString,
}).strict();
