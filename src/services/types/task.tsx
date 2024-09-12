import { z } from 'zod';

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  label: z.string(),
  status: z.string().array(),
  priority: z.string().array(),
});

export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
];

export type Task = z.infer<typeof taskSchema>;
