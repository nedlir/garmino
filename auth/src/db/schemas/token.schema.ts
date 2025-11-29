import { z } from 'zod';

// Validates refresh token (UUID)
export const RefreshTokenSchema = z.string().uuid();

// Validates userId from Redis (UUID)
export const UserIdSchema = z.string().uuid();

// Validates JWT ID (UUID)
export const JtiSchema = z.string().uuid();

// Validates blacklist value ('revoked')
export const BlacklistValueSchema = z.literal('revoked');

// Export types
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type Jti = z.infer<typeof JtiSchema>;
export type BlacklistValue = z.infer<typeof BlacklistValueSchema>;
