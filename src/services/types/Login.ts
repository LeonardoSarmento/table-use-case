import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string({ required_error: 'O campo é obrigatório amigão' }).trim(),
  password: z
    .string({ required_error: 'Preciso dele pra testar aqui na maquininha' })
    .min(3, { message: 'Tá faltando número nisso ai amigo' })
    .max(14, { message: 'Oloko amigo isso não é alemão não pra que tanta letra' })
    .trim(),
});

export type LoginType = z.infer<typeof LoginSchema>;
