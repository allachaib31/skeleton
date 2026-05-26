import { z } from 'zod';
import { apiGroups, apiSyncSchedules } from './settings-api.model';

const parseBooleanField = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const urlSchema = z.string().trim().url().max(2048);

export const createSettingsApiSchema = z.object({
  name: z.string().trim().min(1).max(160),
  link: urlSchema,
  token: z.string().trim().min(1).max(4096),
  group: z.enum(apiGroups),
  currencyId: z.string().trim().min(1),
  syncSchedule: z.enum(apiSyncSchedules),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

export const updateSettingsApiSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  link: urlSchema.optional(),
  token: z.string().trim().min(1).max(4096).optional(),
  group: z.enum(apiGroups).optional(),
  currencyId: z.string().trim().min(1).optional(),
  syncSchedule: z.enum(apiSyncSchedules).optional(),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

const giftCardProviderStringArray = z
  .array(z.string().trim().min(1).max(120))
  .max(100)
  .optional();

export const simulateGiftCardProvidersSchema = z.object({
  apiId: z.string().trim().min(1),
  action: z.enum(['PROFILE', 'PRODUCTS', 'CONTENT', 'CREATE_ORDER', 'CHECK_ORDERS']),
  products: z.object({
    productsId: giftCardProviderStringArray,
    base: z.boolean().optional(),
  }).optional(),
  content: z.object({
    parentId: z.coerce.number().int().min(0),
  }).optional(),
  order: z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
    orderUuid: z.string().trim().uuid().optional(),
    params: z.record(z.string().trim().min(1).max(80), z.string().trim().max(400)).optional(),
  }).optional(),
  check: z.object({
    orders: z.array(z.string().trim().min(1).max(160)).min(1).max(100),
    byUuid: z.boolean().optional(),
  }).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.action === 'CONTENT' && !data.content) {
    ctx.addIssue({ code: 'custom', path: ['content'], message: 'validation.required' });
  }
  if (data.action === 'CREATE_ORDER' && !data.order) {
    ctx.addIssue({ code: 'custom', path: ['order'], message: 'validation.required' });
  }
  if (data.action === 'CHECK_ORDERS' && !data.check) {
    ctx.addIssue({ code: 'custom', path: ['check'], message: 'validation.required' });
  }
});

export const simulateGiftCardProviders2Schema = z.object({
  apiId: z.string().trim().min(1),
  action: z.enum([
    'BALANCE',
    'INSTITUTIONS',
    'SUBMIT_BILL',
    'CHECK_BILL',
    'BULK_CHECK_BILL',
    'AIRTIME_TOPUP',
    'CHECK_AIRTIME',
    'PIN_PRODUCTS',
    'SUBMIT_PIN',
    'CHECK_PIN',
  ]),
  transactionId: z.string().trim().min(1).max(120).optional(),
  transactionIds: z.array(z.string().trim().min(1).max(120)).min(1).max(100).optional(),
  bill: z.object({
    institutionId: z.string().trim().min(1).max(80),
    transactionId: z.string().trim().min(1).max(120),
    subscriberName: z.string().trim().min(1).max(180),
    dueDate: z.string().trim().min(1).max(40),
    installationNumber: z.string().trim().min(1).max(80),
    institutionCode: z.string().trim().max(40).optional(),
    billNumber: z.string().trim().min(1).max(80),
    billAmount: z.string().trim().min(1).max(40),
  }).optional(),
  airtime: z.object({
    operator: z.string().trim().min(1).max(40),
    type: z.string().trim().min(1).max(40),
    amount: z.string().trim().min(1).max(40),
    phoneNumber: z.string().trim().min(1).max(40),
    transactionId: z.string().trim().min(1).max(120),
  }).optional(),
  pin: z.object({
    gameId: z.string().trim().min(1).max(80),
    denomination: z.string().trim().min(1).max(80),
    reference: z.string().trim().min(1).max(120),
    customerPhone: z.string().trim().min(1).max(40),
    playerInfo: z.string().trim().min(1).max(120),
  }).optional(),
}).strict().superRefine((data, ctx) => {
  if ((data.action === 'CHECK_BILL' || data.action === 'CHECK_AIRTIME' || data.action === 'CHECK_PIN') && !data.transactionId) {
    ctx.addIssue({ code: 'custom', path: ['transactionId'], message: 'validation.required' });
  }
  if (data.action === 'BULK_CHECK_BILL' && !data.transactionIds) {
    ctx.addIssue({ code: 'custom', path: ['transactionIds'], message: 'validation.required' });
  }
  if (data.action === 'SUBMIT_BILL' && !data.bill) {
    ctx.addIssue({ code: 'custom', path: ['bill'], message: 'validation.required' });
  }
  if (data.action === 'AIRTIME_TOPUP' && !data.airtime) {
    ctx.addIssue({ code: 'custom', path: ['airtime'], message: 'validation.required' });
  }
  if (data.action === 'SUBMIT_PIN' && !data.pin) {
    ctx.addIssue({ code: 'custom', path: ['pin'], message: 'validation.required' });
  }
});

export const simulateSocialMediaServiceProvidersSchema = z.object({
  apiId: z.string().trim().min(1),
  action: z.enum([
    'SERVICES',
    'ADD_ORDER',
    'ORDER_STATUS',
    'MULTIPLE_ORDER_STATUS',
    'CREATE_REFILL',
    'MULTIPLE_REFILL',
    'REFILL_STATUS',
    'MULTIPLE_REFILL_STATUS',
    'CREATE_CANCEL',
    'BALANCE',
  ]),
  service: z.string().trim().min(1).max(120).optional(),
  link: z.string().trim().min(1).max(2048).optional(),
  quantity: z.string().trim().min(1).max(80).optional(),
  order: z.string().trim().min(1).max(120).optional(),
  orders: z.array(z.string().trim().min(1).max(120)).min(1).max(100).optional(),
  refill: z.string().trim().min(1).max(120).optional(),
  refills: z.array(z.string().trim().min(1).max(120)).min(1).max(100).optional(),
  params: z.record(z.string().trim().min(1).max(80), z.string().trim().max(2000)).optional(),
}).strict();

export const simulateTemporaryNumberCodingSitesSchema = z.object({
  apiId: z.string().trim().min(1),
  action: z.enum([
    'GET_NUMBER',
    'GET_NUMBER_V2',
    'SET_STATUS',
    'GET_STATUS',
    'GET_STATUS_V2',
    'GET_BALANCE',
    'GET_PRICES',
    'GET_PRICES_V2',
    'GET_PRICES_V3',
    'GET_ACTIVE_ACTIVATIONS',
  ]),
  service: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().min(1).max(20).optional(),
  maxPrice: z.string().trim().min(1).max(40).optional(),
  providerIds: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  exceptProviderIds: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  activationId: z.string().trim().min(1).max(120).optional(),
  status: z.string().trim().min(1).max(20).optional(),
  extra: z.record(z.string().trim().min(1).max(80), z.union([z.string().max(500), z.number(), z.boolean()])).optional(),
}).strict().superRefine((data, ctx) => {
  if ((data.action === 'GET_NUMBER' || data.action === 'GET_NUMBER_V2') && !data.service) {
    ctx.addIssue({ code: 'custom', path: ['service'], message: 'validation.required' });
  }
  if ((data.action === 'GET_STATUS' || data.action === 'GET_STATUS_V2') && !data.activationId) {
    ctx.addIssue({ code: 'custom', path: ['activationId'], message: 'validation.required' });
  }
  if (data.action === 'SET_STATUS') {
    if (!data.activationId) ctx.addIssue({ code: 'custom', path: ['activationId'], message: 'validation.required' });
    if (!data.status) ctx.addIssue({ code: 'custom', path: ['status'], message: 'validation.required' });
  }
});
