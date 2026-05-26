import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordMessage = 'Password must be at least 8 characters, contain uppercase, lowercase, number and special character';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  phoneNumber: z.string().max(30).optional(),
  countryCode: z.string().max(8).optional(),
  countryIso: z.string().length(2).optional(),
  countryFlag: z.string().max(8).optional(),
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(passwordRegex, passwordMessage),
});

export const listFinancialMovementsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(['DEPOSIT', 'WITHDRAW']).optional(),
  excludeSource: z.enum(['ADMIN', 'PAYMENT_GATEWAY', 'BANK', 'PAYMENT_CODE', 'ORDER']).optional(),
}).strict();
