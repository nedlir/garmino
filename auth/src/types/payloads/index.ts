import { z } from 'zod';
import { RoleSchema } from '../../db/schemas/userCred.schema';

export const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  jti: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
