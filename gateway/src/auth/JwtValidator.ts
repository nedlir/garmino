import jwt from 'jsonwebtoken';
import { TokenPayload, TokenPayloadSchema } from '../types/tokenPayload';
import { IJwtValidator } from './IJwtValidator';
import { isTokenBlacklisted } from '../config/redis';
import { logger } from '../utils/logger';

export class JwtValidator implements IJwtValidator {
  private jwtSecret: string;

  constructor(jwtSecret?: string) {
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'secret-key';
  }

  async validate(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      const validated = TokenPayloadSchema.parse(decoded);

      const isBlacklisted = await this.checkBlacklist(validated.jti);
      if (isBlacklisted) {
        logger.warn({ jti: validated.jti }, 'Token is blacklisted');
        return null;
      }

      logger.debug({ userId: validated.userId, jti: validated.jti }, 'Token validated successfully');
      return validated;
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        logger.warn({ err: err.message }, 'Invalid JWT token');
        return null;
      }
      if (err instanceof jwt.TokenExpiredError) {
        logger.warn('JWT token expired');
        return null;
      }

      logger.error({ err }, 'Error validating JWT token');
      return null;
    }
  }

  extractUserId(token: string): string | null {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded === 'string') {
        return null;
      }

      const validated = TokenPayloadSchema.parse(decoded);
      return validated.userId;
    } catch (err) {
      logger.error({ err }, 'Error extracting user ID from token');
      return null;
    }
  }


  async checkBlacklist(jti: string): Promise<boolean> {
    try {
      return await isTokenBlacklisted(jti);
    } catch (err) {
      logger.error({ err, jti }, 'Error checking token blacklist');
      // In case of error, fail closed (treat as blacklisted)
      return true;
    }
  }
}
