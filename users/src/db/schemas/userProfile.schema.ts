import { z } from 'zod';

export const UserProfileSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Schema for INSERT operations
export const CreateUserProfileSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string().min(3).max(100).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

// Schema for UPDATE operations
export const UpdateUserProfileSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
