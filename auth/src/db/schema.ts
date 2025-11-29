import { z } from 'zod';

export const UserCredSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  email_verified: z.boolean(),
  is_active: z.boolean(),
  last_login_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const UserCredPublicSchema = UserCredSchema.omit({ password_hash: true });

export const CreateUserCredSchema = z.object({
  email: z.string().email(),
  password_hash: z.string().min(1),
});

export const UpdateUserCredSchema = z.object({
  email: z.string().email().optional(),
  password_hash: z.string().min(1).optional(),
  email_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
  last_login_at: z.date().nullable().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export type UserCred = z.infer<typeof UserCredSchema>;
export type UserCredPublic = z.infer<typeof UserCredPublicSchema>;
export type CreateUserCred = z.infer<typeof CreateUserCredSchema>;
export type UpdateUserCred = z.infer<typeof UpdateUserCredSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
