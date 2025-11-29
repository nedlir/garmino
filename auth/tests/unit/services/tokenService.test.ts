import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  decodeAccessToken,
  parseExpiration,
} from '../../../src/services/tokenService';

describe('tokenService', () => {
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testEmail = 'test@example.com';

  describe('parseExpiration', () => {
    it('should parse seconds correctly', () => {
      expect(parseExpiration('30s')).toBe(30);
    });

    it('should parse minutes correctly', () => {
      expect(parseExpiration('15m')).toBe(900);
    });

    it('should parse hours correctly', () => {
      expect(parseExpiration('2h')).toBe(7200);
    });

    it('should parse days correctly', () => {
      expect(parseExpiration('7d')).toBe(604800);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseExpiration('invalid')).toThrow('Invalid expiration format');
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and email in token payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a UUID v4 token', () => {
      const token = generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.jti).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not.a.token')).toThrow();
    });
  });

  describe('decodeAccessToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
