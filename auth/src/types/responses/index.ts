import { z } from 'zod';
import { RoleSchema } from '../../db/schemas/userCred.schema';

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
});

export const VerifyResponseSchema = z.object({
  valid: z.boolean(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
