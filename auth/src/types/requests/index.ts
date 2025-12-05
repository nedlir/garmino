import { z } from 'zod';
import { RoleSchema } from '../../db/schemas/userCred.schema';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: RoleSchema.optional().default('user'),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().uuid(),
});

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().uuid(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
