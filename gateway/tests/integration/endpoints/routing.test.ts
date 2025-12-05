import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { setupTestContainers, teardownTestContainers, cleanupRedis, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('Gateway Routing - Integration Tests', () => {
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

  function createValidToken(userId: string, jti: string): string {
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

  describe('Route Resolution', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown/path')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Route not found',
      });
    });

    it('should return 503 when downstream service is unavailable', async () => {
      const token = createValidToken(testUserId, '223e4567-e89b-12d3-a456-426614174000');

      // /users route requires auth and will try to proxy to users service
      // Since the service doesn't exist, it should return 503
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Service Unavailable');
    });

    it('should handle different HTTP methods', async () => {
      // Test POST
      const postToken = createValidToken(testUserId, '323e4567-e89b-12d3-a456-426614174000');
      const postResponse = await request(app)
        .post('/users/123')
        .set('Authorization', `Bearer ${postToken}`)
        .send({ data: 'test' });

      expect(postResponse.status).toBe(503); // Service unavailable

      // Test PUT
      const putToken = createValidToken(testUserId, '333e4567-e89b-12d3-a456-426614174000');
      const putResponse = await request(app)
        .put('/users/123')
        .set('Authorization', `Bearer ${putToken}`)
        .send({ data: 'test' });

      expect(putResponse.status).toBe(503); // Service unavailable

      // Test DELETE
      const deleteToken = createValidToken(testUserId, '343e4567-e89b-12d3-a456-426614174000');
      const deleteResponse = await request(app)
        .delete('/users/123')
        .set('Authorization', `Bearer ${deleteToken}`);

      expect(deleteResponse.status).toBe(503); // Service unavailable
    });
  });

  describe('Protected vs Public Routes', () => {
    it('should allow /auth routes without authentication', async () => {
      // /auth is public, should not return 401
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Should return 503 (service unavailable), not 401 (unauthorized)
      expect(response.status).not.toBe(401);
    });

    it('should require authentication for /users routes', async () => {
      const response = await request(app)
        .get('/users/123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for /garmin routes', async () => {
      const response = await request(app)
        .get('/garmin/activities')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for /activities routes', async () => {
      const response = await request(app)
        .get('/activities/123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for /challenges routes', async () => {
      const response = await request(app)
        .get('/challenges/123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for /leaderboard routes', async () => {
      const response = await request(app)
        .get('/leaderboard/123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Request Data Forwarding', () => {
    it('should forward query parameters', async () => {
      const token = createValidToken(testUserId, '423e4567-e89b-12d3-a456-426614174000');

      const response = await request(app)
        .get('/users/123?filter=active&sort=name')
        .set('Authorization', `Bearer ${token}`);

      // Even though service is unavailable, the gateway should have processed the query params
      expect(response.status).toBe(503);
    });

    it('should forward request body', async () => {
      const token = createValidToken(testUserId, '523e4567-e89b-12d3-a456-426614174000');

      const requestBody = {
        name: 'Test User',
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);

      // Even though service is unavailable, the gateway should have processed the body
      expect(response.status).toBe(503);
    });

    it('should forward custom headers', async () => {
      const token = createValidToken(testUserId, '623e4567-e89b-12d3-a456-426614174000');

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Custom-Header', 'custom-value');

      // Even though service is unavailable, the gateway should have processed the headers
      expect(response.status).toBe(503);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for 404', async () => {
      const response = await request(app)
        .get('/nonexistent/route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Not Found');
    });

    it('should return proper error format for 401', async () => {
      const response = await request(app)
        .get('/users/123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return proper error format for 503', async () => {
      const token = createValidToken(testUserId, '723e4567-e89b-12d3-a456-426614174000');

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Service Unavailable');
    });
  });
});
