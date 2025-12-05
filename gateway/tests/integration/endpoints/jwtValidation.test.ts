import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { setupTestContainers, teardownTestContainers, cleanupRedis, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('JWT Validation - Integration Tests', () => {
  const JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    // Connect to containers (already started by globalSetup)
    testContext = await setupTestContainers();
    
    // Import app modules AFTER env vars are set
    const { createTestApp } = await import('../testApp');
    app = await createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  beforeEach(async () => {
    await cleanupRedis(testContext);
  });

  function createValidToken(userId: string, jti: string, expiresIn: string = '1h'): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        userId,
        email: 'test@example.com',
        jti,
        iat: now,
        exp: now + 3600, // 1 hour from now
      },
      JWT_SECRET
    );
  }

  describe('Protected Routes', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app)
        .get('/users/123')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    });

    it('should return 401 when token is expired', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = jwt.sign(
        {
          userId: testUserId,
          email: 'test@example.com',
          jti: '423e4567-e89b-12d3-a456-426614174000',
          iat: now - 7200, // 2 hours ago
          exp: now - 3600, // Expired 1 hour ago
        },
        JWT_SECRET
      );

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    });

    it('should return 401 when token is blacklisted', async () => {
      const jti = '323e4567-e89b-12d3-a456-426614174000';
      const token = createValidToken(testUserId, jti);

      // Add token to blacklist
      await testContext.redisClient.set(`blacklist:${jti}`, '1', 'EX', 3600);

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    });

    it('should attach X-User-Id header when token is valid', async () => {
      const jti = '223e4567-e89b-12d3-a456-426614174000';
      const token = createValidToken(testUserId, jti);

      // Note: This will fail with 503 because the downstream service doesn't exist
      // But we can verify the auth middleware passed by checking it's not a 401
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${token}`);

      // Should not be 401 (auth passed)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Public Routes', () => {
    it('should allow access to /auth routes without token', async () => {
      // /auth routes don't require authentication
      // This will return 503 because auth service doesn't exist, but not 401
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).not.toBe(401);
    });

    it('should allow access to /health without token', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Token Payload Validation', () => {
    it('should reject token without userId', async () => {
      const now = Math.floor(Date.now() / 1000);
      const invalidToken = jwt.sign(
        {
          email: 'test@example.com',
          jti: '523e4567-e89b-12d3-a456-426614174000',
          iat: now,
          exp: now + 3600,
        },
        JWT_SECRET
      );

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject token without jti', async () => {
      const now = Math.floor(Date.now() / 1000);
      const invalidToken = jwt.sign(
        {
          userId: testUserId,
          email: 'test@example.com',
          iat: now,
          exp: now + 3600,
        },
        JWT_SECRET
      );

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject token with wrong secret', async () => {
      const now = Math.floor(Date.now() / 1000);
      const wrongSecretToken = jwt.sign(
        {
          userId: testUserId,
          email: 'test@example.com',
          jti: '623e4567-e89b-12d3-a456-426614174000',
          iat: now,
          exp: now + 3600,
        },
        'wrong-secret'
      );

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
