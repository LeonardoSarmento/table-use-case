import { z } from 'zod';
import { Filters, PaginatedData } from './FilterExtension';
import { roleSchema } from '../Role';

export const UserTable = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: roleSchema.array(),
});

export type UserTableType = z.infer<typeof UserTable>;
export type UserFilters = Filters<UserTableType>;
export type UserRequest = PaginatedData<UserTableType>;
