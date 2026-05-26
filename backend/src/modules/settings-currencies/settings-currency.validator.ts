import { z } from 'zod';

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

const baseCurrencySchema = {
  name: z.string().trim().min(1).max(120),
  shortName: z.string().trim().min(1).max(12).transform((value) => value.toUpperCase()),
  price: z.preprocess(parseNumberField, z.number().min(0)),
  priceBuy: z.preprocess(parseNumberField, z.number().min(0)),
  isDollar: z.preprocess(parseBooleanField, z.boolean()).default(false),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).default(true),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).default(false),
};

export const createSettingsCurrencySchema = z.object(baseCurrencySchema).strict();

export const updateSettingsCurrencySchema = z.object({
  name: baseCurrencySchema.name.optional(),
  shortName: baseCurrencySchema.shortName.optional(),
  price: baseCurrencySchema.price.optional(),
  priceBuy: baseCurrencySchema.priceBuy.optional(),
  isDollar: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isVisible: z.preprocess(parseBooleanField, z.boolean()).optional(),
  isDeleted: z.preprocess(parseBooleanField, z.boolean()).optional(),
}).strict();
