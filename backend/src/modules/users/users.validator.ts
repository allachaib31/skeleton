import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordMessage = 'Password must be at least 8 characters, contain uppercase, lowercase, number and special character';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(passwordRegex, passwordMessage),
});
