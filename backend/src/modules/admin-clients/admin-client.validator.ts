import { z } from 'zod';
import { clientFinancialMovementTypes } from './client-financial-movement.model';
import { productSpecialPricingTypes } from '../stock-products/stock-product.model';

const parseNumberField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i);

export const createAdminClientSchema = z.object({
  email: z.string().trim().email().max(320),
  username: z.string().trim().min(2).max(80),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phoneNumber: z.string().trim().min(3).max(40),
  countryCode: z.string().trim().min(1).max(10),
  countryIso: z.string().trim().min(2).max(2),
  countryFlag: z.string().trim().min(1).max(8),
  status: z.enum(['active', 'inactive', 'banned', 'pending_verification']),
  password: z.string().min(8).max(128),
  referralClientId: z.string().trim().optional().or(z.literal('')),
}).strict();

export const updateAdminClientSchema = createAdminClientSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8).max(128).optional().or(z.literal('')),
  })
  .partial()
  .strict();

export const createClientMovementSchema = z.object({
  type: z.enum(clientFinancialMovementTypes),
  amount: z.preprocess(parseNumberField, z.number().positive()),
  paymentMethodId: z.string().trim().optional().or(z.literal('')),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
}).strict();

export const updateClientOpenCreditSchema = z.object({
  openCredit: z.preprocess(parseNumberField, z.number().max(0)),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
}).strict();

export const updateClientLevelSchema = z.object({
  groupId: z.string().trim().min(1),
}).strict();

export const createClientSpecialPriceSchema = z.object({
  serviceId: objectIdSchema,
  categoryId: objectIdSchema,
  productId: objectIdSchema,
  pricingType: z.enum(productSpecialPricingTypes),
  value: z.preprocess(parseNumberField, z.number().min(0)),
  negativeValue: z.preprocess(parseNumberField, z.number().min(0)),
}).strict();

export const updateClientSpecialPriceSchema = createClientSpecialPriceSchema.partial().strict();

export const bulkDeleteClientSpecialPricesSchema = z.object({
  ids: z.array(objectIdSchema).min(1),
}).strict();
