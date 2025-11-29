import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';
import jwt from 'jsonwebtoken';

let testContext: TestContext;
let app: Express;

describe('POST /auth/verify - Integration Tests', () => {
  const testUser = {
    email: 'verifyuser@example.com',
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

  it('should verify valid token successfully', async () => {
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      valid: true,
      userId,
      email: testUser.email,
    });
  });

  it('should return 401 for missing authorization header', async () => {
    const response = await request(app)
      .post('/auth/verify')
      .expect(401);

    expect(response.body.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for invalid authorization header format', async () => {
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', accessToken) // Missing "Bearer "
      .expect(401);

    expect(response.body.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for malformed token', async () => {
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toEqual({ valid: false });
  });

  it('should return 401 for expired token', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      {
        userId,
        email: testUser.email,
        jti: 'test-jti',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Expired 1 hour ago
    );

    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body).toEqual({ valid: false });
  });

  it('should return 401 for blacklisted token', async () => {
    // Logout to blacklist the token
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // Try to verify the blacklisted token
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body).toEqual({ valid: false });
  });

  it('should verify token from different user', async () => {
    // Register another user
    const user2Response = await request(app)
      .post('/auth/register')
      .send({
        email: 'user2@example.com',
        password: 'SecurePass123!',
      });

    const user2Token = user2Response.body.accessToken;
    const user2Id = user2Response.body.user.id;

    // Verify second user's token
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(response.body).toEqual({
      valid: true,
      userId: user2Id,
      email: 'user2@example.com',
    });

    // First user's token should still work
    const response1 = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response1.body.userId).toBe(userId);
  });

  it('should verify token after user login again', async () => {
    // Login again to get new token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send(testUser);

    const newAccessToken = loginResponse.body.accessToken;

    // Both old and new tokens should be valid
    const oldTokenResponse = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const newTokenResponse = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    expect(oldTokenResponse.body.valid).toBe(true);
    expect(newTokenResponse.body.valid).toBe(true);
    expect(oldTokenResponse.body.userId).toBe(newTokenResponse.body.userId);
  });

  it('should return 401 for token with invalid signature', async () => {
    // Create token with wrong secret
    const invalidToken = jwt.sign(
      {
        userId,
        email: testUser.email,
        jti: 'test-jti',
      },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    expect(response.body).toEqual({ valid: false });
  });

  it('should handle token verification after refresh', async () => {
    // Refresh to get new access token
    const refreshResponse = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken });

    const newAccessToken = refreshResponse.body.accessToken;

    // New token should be valid
    const response = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      valid: true,
      userId,
      email: testUser.email,
    });

    // Old token should still be valid (not blacklisted by refresh)
    const oldResponse = await request(app)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(oldResponse.body.valid).toBe(true);
  });
});
