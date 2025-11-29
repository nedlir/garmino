import { z } from 'zod';

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().uuid(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
});

export const VerifyResponseSchema = z.object({
  valid: z.boolean(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
