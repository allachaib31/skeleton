import { z } from 'zod';
import { productFulfillmentTypes, productQuantityModes, productSpecialPricingTypes } from './stock-product.model';

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

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

const parseCustomQuantities = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  if (value.trim() === '') return [];
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item));
};

const parseJsonField = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseJsonArrayField = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  if (value.trim() === '') return [];
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
  en: z.string().trim().min(1).max(20000),
  fr: z.string().trim().min(1).max(20000),
  ar: z.string().trim().min(1).max(20000),
}).strict();

const productSpecialSellPriceSchema = z.object({
  pricingType: z.enum(productSpecialPricingTypes),
  value: z.preprocess(parseNumberField, z.number().min(0)),
  negativeValue: z.preprocess(parseNumberField, z.number().min(0)),
  agentRatio: z.preprocess(parseNumberField, z.number().min(0)),
}).strict();

const stockProductBaseSchema = z.object({
  serviceId: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  groupId: z.string().trim().optional(),
  apiId: z.string().trim().optional(),
  name: z.preprocess(parseJsonField, localizedTextSchema),
  serviceNumber: z.string().trim().max(120).optional(),
  costPrice: z.preprocess(parseNumberField, z.number().min(0)),
  costManual: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  forQuantity: z.preprocess(parseNumberField, z.number().min(1)),
  description: z.preprocess(parseJsonField, localizedDescriptionSchema),
  quantityMode: z.enum(productQuantityModes),
  minQuantity: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  maxQuantity: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  customQuantities: z.preprocess(parseCustomQuantities, z.array(z.number().min(0))).optional(),
  speed: z.string().trim().max(120).optional(),
  startTime: z.string().trim().max(120).optional(),
  quantityAvailable: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
  dripfeed: z.preprocess(parseBooleanField, z.boolean()).default(false),
  refill: z.preprocess(parseBooleanField, z.boolean()).default(false),
  cancel: z.preprocess(parseBooleanField, z.boolean()).default(false),
  stock: z.preprocess(parseBooleanField, z.boolean()).default(true),
  fulfillmentType: z.enum(productFulfillmentTypes).default('MANUAL'),
  requirements: z.preprocess(parseJsonArrayField, z.array(z.string().trim().min(1))).default([]),
  visibleCountryCodes: z.preprocess(parseJsonArrayField, z.array(z.string().trim().min(1).max(20))).default([]),
}).strict();

export const createStockProductSchema = stockProductBaseSchema.superRefine((data, ctx) => {
  if ((data.quantityMode === 'QUANTITY' || data.quantityMode === 'COUNTER') && (data.minQuantity === undefined || data.maxQuantity === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['minQuantity'], message: 'stockProducts.min_max_quantity_required' });
  }
  if (data.quantityMode === 'CUSTOMIZE' && (!data.customQuantities || data.customQuantities.length === 0)) {
    ctx.addIssue({ code: 'custom', path: ['customQuantities'], message: 'stockProducts.custom_quantities_required' });
  }
  if (data.fulfillmentType === 'MANUAL' && data.costManual === undefined) {
    ctx.addIssue({ code: 'custom', path: ['costManual'], message: 'stockProducts.cost_manual_required' });
  }
});

export const listStockProductsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  all: z.enum(['true']).optional(),
  search: optionalTrimmedString,
  serviceId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
  groupId: optionalTrimmedString,
  apiId: optionalTrimmedString,
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
  hasSpecialSellPrice: z.preprocess(parseBooleanField, z.boolean()).optional(),
  fulfillmentType: z.enum(productFulfillmentTypes).optional(),
}).strict();

export const updateStockProductSchema = stockProductBaseSchema
  .extend({
    isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
  })
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if ((data.quantityMode === 'QUANTITY' || data.quantityMode === 'COUNTER') && (data.minQuantity === undefined || data.maxQuantity === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['minQuantity'], message: 'stockProducts.min_max_quantity_required' });
    }
    if (data.quantityMode === 'CUSTOMIZE' && (!data.customQuantities || data.customQuantities.length === 0)) {
      ctx.addIssue({ code: 'custom', path: ['customQuantities'], message: 'stockProducts.custom_quantities_required' });
    }
    if (data.fulfillmentType === 'MANUAL' && data.costManual === undefined) {
      ctx.addIssue({ code: 'custom', path: ['costManual'], message: 'stockProducts.cost_manual_required' });
    }
  });

export const reorderStockProductsSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1),
}).strict();

export const bulkUpdateStockProductsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
  groupId: z.string().trim().optional(),
  specialSellPrice: productSpecialSellPriceSchema.nullable().optional(),
}).strict().refine(
  (data) => data.isVisible !== undefined || data.isDeleted !== undefined || data.groupId !== undefined || data.specialSellPrice !== undefined,
  { message: 'stockProducts.bulk_update_field_required' }
);

export const previewApiProductsImportSchema = z.object({
  apiGroup: z.enum(['GIFT_CARD_PROVIDERS', 'SOCIAL_MEDIA_SERVICE_PROVIDERS', 'GIFT_CARD_PROVIDERS_2', 'TEMPORARY_NUMBER_CODING_SITES', 'RENEWABLE_NUMBER_CODING_SITES']),
  apiId: z.string().trim().min(1),
}).strict();

export const importApiProductsSchema = z.object({
  apiGroup: z.enum(['GIFT_CARD_PROVIDERS', 'SOCIAL_MEDIA_SERVICE_PROVIDERS', 'GIFT_CARD_PROVIDERS_2', 'TEMPORARY_NUMBER_CODING_SITES', 'RENEWABLE_NUMBER_CODING_SITES']),
  apiId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
  categoryId: z.string().trim().min(1).optional(),
  productIds: z.array(z.union([z.string().trim().min(1), z.number()])).min(1).max(10000),
  autoCreateCategories: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  isVisible: z.boolean().default(false),
  stock: z.boolean().default(true),
}).strict().superRefine((data, ctx) => {
  if (!data.autoCreateCategories && !data.categoryId) {
    ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'stockProducts.import_category_required' });
  }
});

export const productApiConnectionParamsSchema = z.object({
  productId: z.string().trim().min(1),
}).strict();

export const productApiConnectionIdParamsSchema = z.object({
  productId: z.string().trim().min(1),
  connectionId: z.string().trim().min(1),
}).strict();

export const createProductApiConnectionSchema = z.object({
  apiId: z.string().trim().min(1),
  providerProductId: z.union([z.string().trim().min(1), z.number()]),
}).strict();

export const updateProductApiConnectionSchema = createProductApiConnectionSchema.partial().strict();
