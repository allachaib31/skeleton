import { z } from 'zod';
import { stockPromotionTargetTypes, stockPromotionTypes } from './stock-promotion.model';

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

const parseDateField = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim() !== '') return new Date(value);
  return value;
};

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

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

const stockPromotionBaseSchema = z.object({
  name: localizedTextSchema,
  description: localizedDescriptionSchema,
  promotionType: z.enum(stockPromotionTypes),
  value: z.preprocess(parseNumberField, z.number().min(0)),
  targetType: z.enum(stockPromotionTargetTypes),
  serviceId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
  productId: optionalTrimmedString,
  productGroupId: optionalTrimmedString,
  clientId: optionalTrimmedString,
  clientLevelGroupId: optionalTrimmedString,
  minOrderAmount: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  maxDiscountAmount: z.preprocess(parseNumberField, z.number().min(0)).optional(),
  startAt: z.preprocess(parseDateField, z.date()),
  endAt: z.preprocess(parseDateField, z.date()).optional(),
  priority: z.preprocess(parseNumberField, z.number().int()).default(0),
  usageLimit: z.preprocess(parseNumberField, z.number().int().min(1)).optional(),
  perClientLimit: z.preprocess(parseNumberField, z.number().int().min(1)).optional(),
  isActive: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
}).strict();

const validatePromotionTarget = (data: z.infer<typeof stockPromotionBaseSchema>, ctx: z.RefinementCtx) => {
  const requiredFieldByTarget: Record<string, keyof typeof data | null> = {
    ALL_PRODUCTS: null,
    SERVICE: 'serviceId',
    CATEGORY: 'categoryId',
    PRODUCT: 'productId',
    PRODUCT_GROUP: 'productGroupId',
    CLIENT: 'clientId',
    CLIENT_LEVEL_GROUP: 'clientLevelGroupId',
  };
  const requiredField = requiredFieldByTarget[data.targetType];

  if (requiredField && !data[requiredField]) {
    ctx.addIssue({ code: 'custom', path: [requiredField], message: 'stockPromotions.target_required' });
  }
  if (data.endAt && data.endAt < data.startAt) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'stockPromotions.end_date_invalid' });
  }
};

export const listStockPromotionsSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  search: optionalTrimmedString,
  targetType: z.enum(stockPromotionTargetTypes).optional(),
  promotionType: z.enum(stockPromotionTypes).optional(),
  isActive: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();

export const listStockPromotionUsagesSchema = z.object({
  page: z.preprocess(parseNumberField, z.number().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().min(1).max(300)).optional(),
  promotionId: optionalTrimmedString,
  clientId: optionalTrimmedString,
  productId: optionalTrimmedString,
}).strict();

export const createStockPromotionSchema = stockPromotionBaseSchema.superRefine(validatePromotionTarget);

export const updateStockPromotionSchema = stockPromotionBaseSchema.partial().superRefine((data, ctx) => {
  if (data.targetType) validatePromotionTarget(data as z.infer<typeof stockPromotionBaseSchema>, ctx);
  if (data.startAt && data.endAt && data.endAt < data.startAt) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'stockPromotions.end_date_invalid' });
  }
});
