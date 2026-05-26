import { z } from 'zod';
import { paymentGatewayInfoTypes, paymentGatewayKinds, paymentGatewayTaxTypes } from './settings-payment-gateway.model';

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

const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(180),
  fr: z.string().trim().min(1).max(180),
  ar: z.string().trim().min(1).max(180),
}).strict();

const localizedDescriptionSchema = z.object({
  en: z.string().trim().min(1).max(3000),
  fr: z.string().trim().min(1).max(3000),
  ar: z.string().trim().min(1).max(3000),
}).strict();

const infoFieldSchema = z.object({
  label: localizedTextSchema,
  type: z.enum(paymentGatewayInfoTypes),
  value: z.string().trim().min(1).max(2048),
}).strict();

const paymentGatewayBaseSchema = z.object({
  kind: z.enum(paymentGatewayKinds),
  name: z.preprocess(parseJsonField, localizedTextSchema),
  link: z.string().trim().max(2048).optional(),
  token: z.string().trim().max(4096).optional(),
  currencyId: z.string().trim().optional(),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema).optional(),
  infoFields: z.preprocess(parseJsonField, z.array(infoFieldSchema)).default([]),
  taxType: z.enum(paymentGatewayTaxTypes),
  taxValue: z.preprocess(parseNumberField, z.number().min(0)),
  minMoney: z.preprocess(parseNumberField, z.number().min(0)),
  maxMoney: z.preprocess(parseNumberField, z.number().min(0)),
  requiresImage: z.preprocess(parseBooleanField, z.boolean()).default(false),
  requiresSerialNumber: z.preprocess(parseBooleanField, z.boolean()).default(false),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

export const createSettingsPaymentGatewaySchema = paymentGatewayBaseSchema.superRefine((data, ctx) => {
  if (data.maxMoney < data.minMoney) {
    ctx.addIssue({ code: 'custom', path: ['maxMoney'], message: 'settingsPaymentGateways.max_money_invalid' });
  }
  if (data.kind === 'PAYMENT_GATEWAY' && (!data.link || !data.token)) {
    ctx.addIssue({ code: 'custom', path: ['link'], message: 'settingsPaymentGateways.gateway_credentials_required' });
  }
  if (data.kind === 'BANK' && (!data.currencyId || !data.description)) {
    ctx.addIssue({ code: 'custom', path: ['currencyId'], message: 'settingsPaymentGateways.bank_details_required' });
  }
});

export const updateSettingsPaymentGatewaySchema = paymentGatewayBaseSchema.partial().superRefine((data, ctx) => {
  if (data.maxMoney !== undefined && data.minMoney !== undefined && data.maxMoney < data.minMoney) {
    ctx.addIssue({ code: 'custom', path: ['maxMoney'], message: 'settingsPaymentGateways.max_money_invalid' });
  }
  if (data.kind === 'BANK' && (!data.currencyId || !data.description)) {
    ctx.addIssue({ code: 'custom', path: ['currencyId'], message: 'settingsPaymentGateways.bank_details_required' });
  }
});
