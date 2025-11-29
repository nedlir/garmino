import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { TokenPayloadSchema, type TokenPayload } from '../types/payloads';
import * as tokenRepository from '../db/repositories/tokenRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

enum TimeUnit {
  SECONDS = 's',
  MINUTES = 'm',
  HOURS = 'h',
  DAYS = 'd',
}

export const parseExpiration = (expiration: string): number => {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1), 10);

  if (isNaN(value)) {
    throw new Error(`Invalid expiration format: ${expiration}`);
  }

  switch (unit) {
    case TimeUnit.SECONDS:
      return value;
    case TimeUnit.MINUTES:
      return value * 60;
    case TimeUnit.HOURS:
      return value * 60 * 60;
    case TimeUnit.DAYS:
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid expiration format: ${expiration}`);
  }
};

export const generateAccessToken = (
  userId: string,
  email: string
): string => {
  try {
    const jti = uuidv4();
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId,
      email,
      jti,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    logger.debug({ userId, email, jti }, 'Access token generated');
    return token;
  } catch (err) {
    logger.error({ err, userId, email }, 'Error generating access token');
    throw err;
  }
};

export const generateRefreshToken = (): string => {
  return uuidv4();
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const validated = TokenPayloadSchema.parse(decoded);

    logger.debug({ userId: validated.userId, jti: validated.jti }, 'Access token verified');
    return validated;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn({ err: err.message }, 'Invalid access token');
      throw new Error('Invalid token');
    }
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn('Access token expired');
      throw new Error('Token expired');
    }

    logger.error({ err }, 'Error verifying access token');
    throw err;
  }
};

export const decodeAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return null;
    }

    const validated = TokenPayloadSchema.parse(decoded);
    return validated;
  } catch (err) {
    logger.error({ err }, 'Error decoding access token');
    return null;
  }
};

export const storeRefreshToken = async (
  token: string,
  userId: string
): Promise<void> => {
  const ttl = parseExpiration(REFRESH_TOKEN_EXPIRES_IN);
  await tokenRepository.storeRefreshToken(token, userId, ttl);
};

export const validateRefreshToken = async (
  token: string
): Promise<string | null> => {
  return await tokenRepository.getRefreshToken(token);
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await tokenRepository.deleteRefreshToken(token);
};

export const blacklistAccessToken = async (jti: string): Promise<void> => {
  const ttl = parseExpiration(JWT_EXPIRES_IN);
  await tokenRepository.blacklistAccessToken(jti, ttl);
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  return await tokenRepository.isTokenBlacklisted(jti);
};
