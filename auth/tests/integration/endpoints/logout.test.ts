import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';
import jwt from 'jsonwebtoken';

let testContext: TestContext;
let app: Express;

describe('POST /auth/logout - Integration Tests', () => {
  const testUser = {
    email: 'logoutuser@example.com',
    password: 'SecurePass123!',
  };

  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Connect to containers (already started by globalSetup)
    testContext = await setupTestContainers();
    
    // Import app modules AFTER env vars are set
    const { createTestApp } = await import('../testApp');
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  beforeEach(async () => {
    await cleanupDatabase(testContext);
    
    // Register to get tokens
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    userId = response.body.user.id;
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('should logout successfully', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Logged out successfully',
    });
  });

  it('should blacklist access token', async () => {
    const decoded = jwt.decode(accessToken) as any;
    const jti = decoded.jti;

    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // Check if JTI is blacklisted in Redis
    const isBlacklisted = await testContext.redisClient.exists(`blacklist:jti:${jti}`);
    expect(isBlacklisted).toBe(1);
  });

  it('should revoke refresh token', async () => {
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // Refresh token should be removed from Redis
    const storedToken = await testContext.redisClient.get(`refresh:${refreshToken}`);
    expect(storedToken).toBeNull();
  });

  it('should return 401 for missing authorization header', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for invalid authorization header format', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', accessToken) // Missing "Bearer "
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for malformed access token', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalid-token')
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid access token');
  });

  it('should return 400 for missing refresh token', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid refresh token format', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: 'not-a-uuid' })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should allow logout even if refresh token already expired', async () => {
    // Delete refresh token from Redis
    await testContext.redisClient.del(`refresh:${refreshToken}`);

    // Logout should still work (blacklist access token)
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    expect(response.body.message).toBe('Logged out successfully');

    // Access token should still be blacklisted
    const decoded = jwt.decode(accessToken) as any;
    const isBlacklisted = await testContext.redisClient.exists(`blacklist:jti:${decoded.jti}`);
    expect(isBlacklisted).toBe(1);
  });

  it('should prevent using blacklisted token for logout again', async () => {
    // First logout
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // Try to logout again with same token
    const response = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid access token');
  });

  it('should handle multiple sessions logout independently', async () => {
    // Create second session
    const response2 = await request(app)
      .post('/auth/login')
      .send(testUser);

    const accessToken2 = response2.body.accessToken;
    const refreshToken2 = response2.body.refreshToken;

    // Logout first session
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // Second session should still work
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken2}`)
      .send({ refreshToken: refreshToken2 })
      .expect(200);

    // Both tokens should be blacklisted
    const decoded1 = jwt.decode(accessToken) as any;
    const decoded2 = jwt.decode(accessToken2) as any;

    const blacklisted1 = await testContext.redisClient.exists(`blacklist:jti:${decoded1.jti}`);
    const blacklisted2 = await testContext.redisClient.exists(`blacklist:jti:${decoded2.jti}`);

    expect(blacklisted1).toBe(1);
    expect(blacklisted2).toBe(1);
  });
});
