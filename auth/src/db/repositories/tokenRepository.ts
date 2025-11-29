import redis from '../../config/db/redis';
import { logger } from '../../utils/logger';
import {
  RefreshTokenSchema,
  UserIdSchema,
  JtiSchema,
  type RefreshToken,
  type Jti,
} from '../schemas/token.schema';

// Redis key naming conventions
const getRefreshKey = (token: RefreshToken): string => `refresh:${token}`;
const getBlacklistKey = (jti: Jti): string => `blacklist:jti:${jti}`;

export const storeRefreshToken = async (
  token: string,
  userId: string,
  ttl: number
): Promise<void> => {
  try {
    const validatedToken = RefreshTokenSchema.parse(token);
    const validatedUserId = UserIdSchema.parse(userId);

    const key = getRefreshKey(validatedToken);
    await redis.setex(key, ttl, validatedUserId);

    logger.debug({ token, userId, ttl }, 'Refresh token stored');
  } catch (err) {
    logger.error({ err, token, userId }, 'Error storing refresh token');
    throw err;
  }
};

export const getRefreshToken = async (token: string): Promise<string | null> => {
  try {
    const validatedToken = RefreshTokenSchema.parse(token);

    const key = getRefreshKey(validatedToken);
    const userId = await redis.get(key);

    if (!userId) {
      return null;
    }

    const validatedUserId = UserIdSchema.parse(userId);
    return validatedUserId;
  } catch (err) {
    logger.error({ err, token }, 'Error getting refresh token');
    throw err;
  }
};

export const deleteRefreshToken = async (token: string): Promise<void> => {
  try {
    const validatedToken = RefreshTokenSchema.parse(token);

    const key = getRefreshKey(validatedToken);
    await redis.del(key);

    logger.debug({ token }, 'Refresh token deleted');
  } catch (err) {
    logger.error({ err, token }, 'Error deleting refresh token');
    throw err;
  }
};

export const blacklistAccessToken = async (
  jti: string,
  ttl: number
): Promise<void> => {
  try {
    const validatedJti = JtiSchema.parse(jti);

    const key = getBlacklistKey(validatedJti);
    await redis.setex(key, ttl, 'revoked');

    logger.debug({ jti, ttl }, 'Access token blacklisted');
  } catch (err) {
    logger.error({ err, jti }, 'Error blacklisting access token');
    throw err;
  }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    const validatedJti = JtiSchema.parse(jti);

    const key = getBlacklistKey(validatedJti);
    const exists = await redis.exists(key);

    return exists === 1;
  } catch (err) {
    logger.error({ err, jti }, 'Error checking token blacklist');
    throw err;
  }
};
