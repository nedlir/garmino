import { z } from 'zod';

export const TokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  jti: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
