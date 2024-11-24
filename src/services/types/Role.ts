import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'OPERATOR']);

export type RolesType = z.infer<typeof roleSchema>;
