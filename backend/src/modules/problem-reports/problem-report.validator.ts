import { z } from 'zod';
import { problemReportPriorities, problemReportStatuses, problemReportTypes } from './problem-report.model';

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i);

const parseNumberField = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const optionalObjectId = objectIdSchema.optional();
const optionalSearch = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(160).optional(),
);
const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);
const optionalProblemReportType = z.preprocess(emptyToUndefined, z.enum(problemReportTypes).optional());
const optionalProblemReportStatus = z.preprocess(emptyToUndefined, z.enum(problemReportStatuses).optional());
const optionalProblemReportPriority = z.preprocess(emptyToUndefined, z.enum(problemReportPriorities).optional());

export const problemReportQuerySchema = z.object({
  page: z.preprocess(parseNumberField, z.number().int().min(1)).optional(),
  limit: z.preprocess(parseNumberField, z.number().int().min(1).max(100)).optional(),
  search: optionalSearch,
  type: optionalProblemReportType,
  status: optionalProblemReportStatus,
  priority: optionalProblemReportPriority,
  assignedAdminId: optionalObjectId,
  clientId: optionalObjectId,
  relatedOrderId: optionalObjectId,
}).strict();

export const problemReportParamsSchema = z.object({
  id: objectIdSchema,
}).strict();

export const createProblemReportSchema = z.object({
  type: z.enum(problemReportTypes),
  priority: z.enum(problemReportPriorities).optional(),
  subject: z.string().trim().min(3).max(180),
  description: z.string().trim().min(3).max(5000),
  relatedOrderId: optionalObjectId,
  relatedPaymentRequestId: optionalObjectId,
  relatedFinancialMovementId: optionalObjectId,
  relatedProductId: optionalObjectId,
  relatedServiceId: optionalObjectId,
  relatedCategoryId: optionalObjectId,
}).strict();

export const createProblemReportMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
}).strict();

export const adminProblemReportAssignSchema = z.object({
  assignedAdminId: objectIdSchema.optional(),
}).strict();

export const adminProblemReportStatusSchema = z.object({
  status: z.enum(problemReportStatuses),
  resolutionNote: z.string().trim().max(5000).optional(),
}).strict();

export const adminProblemReportPrioritySchema = z.object({
  priority: z.enum(problemReportPriorities),
}).strict();

export const adminProblemReportMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  isInternal: z.boolean().optional(),
}).strict();
