import { z } from 'zod';

export const PostSchema = z.object({
  id: z.number({required_error: 'Id deve ser passado'}),
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

export type PostType = z.infer<typeof PostSchema>;
