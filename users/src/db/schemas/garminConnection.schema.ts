import { z } from 'zod';

export const GarminConnectionSchema = z.object({
  user_id: z.string().uuid(),
  garmin_oauth1_token: z.string().nullable(),
  garmin_oauth2_token: z.string().nullable(),
  connected_at: z.date().nullable(),
  last_sync_at: z.date().nullable(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Schema for INSERT operations
export const CreateGarminConnectionSchema = z.object({
  user_id: z.string().uuid(),
  garmin_oauth1_token: z.string().optional(),
  garmin_oauth2_token: z.string().optional(),
});

// Schema for UPDATE operations
export const UpdateGarminConnectionSchema = z.object({
  garmin_oauth1_token: z.string().optional(),
  garmin_oauth2_token: z.string().optional(),
  last_sync_at: z.date().optional(),
  is_active: z.boolean().optional(),
});

export type GarminConnection = z.infer<typeof GarminConnectionSchema>;
export type CreateGarminConnection = z.infer<typeof CreateGarminConnectionSchema>;
export type UpdateGarminConnection = z.infer<typeof UpdateGarminConnectionSchema>;
