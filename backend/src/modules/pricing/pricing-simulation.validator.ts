import { z } from 'zod';

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i);

const parseNumberField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

export const calculatePricingSimulationSchema = z.object({
  clientId: objectIdSchema,
  productId: objectIdSchema,
  quantity: z.preprocess(parseNumberField, z.number().min(1).max(100000)),
}).strict();
