import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  phone: z.string().optional().or(z.literal('')), // Optional or empty string
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
