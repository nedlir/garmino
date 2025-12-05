import { z } from 'zod';

export const RoleSchema = z.enum(['user', 'admin']);

export const UserCredSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  role: RoleSchema.optional().default('user'),
  created_at: z.date(),
  updated_at: z.date(),
  last_login_at: z.date().nullable(),
});

// Schema for INSERT operations
export const CreateUserCredSchema = z.object({
  email: z.string().email(),
  password_hash: z.string().min(1),
  role: RoleSchema.optional().default('user'),
});

// Schema for UPDATE operations
export const UpdateUserCredSchema = z.object({
  email: z.string().email().optional(),
  password_hash: z.string().min(1).optional(),
  last_login_at: z.date().optional(),
});

export type Role = z.infer<typeof RoleSchema>;
export type UserCred = z.infer<typeof UserCredSchema>;
export type CreateUserCred = z.infer<typeof CreateUserCredSchema>;
export type UpdateUserCred = z.infer<typeof UpdateUserCredSchema>;