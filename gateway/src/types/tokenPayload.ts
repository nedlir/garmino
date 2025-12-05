import { z } from 'zod';

export const RoleSchema = z.enum(['user', 'admin']);

export const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  jti: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
});

export type Role = z.infer<typeof RoleSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
