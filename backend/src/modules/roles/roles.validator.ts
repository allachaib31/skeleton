import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string()
    .min(2)
    .max(50)
    .regex(/^[A-Z_]+$/, 'Name must be uppercase and contain no spaces (use underscores)'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
}).strict();

export const updateRoleSchema = z.object({
  name: z.string()
    .min(2)
    .max(50)
    .regex(/^[A-Z_]+$/, 'Name must be uppercase and contain no spaces (use underscores)')
    .optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
}).strict();
