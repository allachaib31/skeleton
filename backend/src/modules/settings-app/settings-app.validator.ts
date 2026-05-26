import { z } from 'zod';

export const updateSettingsAppSchema = z.object({
  appName: z.string().trim().min(1).max(120).optional(),
}).strict();
