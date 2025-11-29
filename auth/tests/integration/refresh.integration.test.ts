import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from './config';

let testContext: TestContext;
let app: Express;

describe('POST /auth/refresh - Integration Tests', () => {
  const testUser = {
    email: 'refreshuser@example.com',
    password: 'SecurePass123!',
  };

  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Connect to containers (already started by globalSetup)
    testContext = await setupTestContainers();
    
    // Import app modules AFTER env vars are set
    const { createTestApp } = await import('./testApp');
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  beforeEach(async () => {
    await cleanupDatabase(testContext);
    
    // Register and login to get tokens
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    userId = response.body.user.id;
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('should refresh tokens successfully', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toEqual({
      id: userId,
      email: testUser.email,
    });

    // New tokens should be different
    expect(response.body.accessToken).not.toBe(accessToken);
    expect(response.body.refreshToken).not.toBe(refreshToken);
  });

  it('should revoke old refresh token', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    // Old refresh token should be removed from Redis
    const oldToken = await testContext.redisClient.get(`refresh:${refreshToken}`);
    expect(oldToken).toBeNull();

    // New refresh token should exist
    const newToken = await testContext.redisClient.get(`refresh:${response.body.refreshToken}`);
    expect(newToken).toBe(userId);
  });

  it('should not allow reusing old refresh token', async () => {
    // First refresh
    await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    // Try to use old token again
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid refresh token');
  });

  it('should return 401 for invalid refresh token', async () => {
    const fakeToken = '550e8400-e29b-41d4-a716-446655440000';
    
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: fakeToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid refresh token');
  });

  it('should return 400 for malformed refresh token', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'not-a-uuid' })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 for missing refresh token', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 401 if user was deleted', async () => {
    // Delete the user from database
    await testContext.pgPool.query(
      'DELETE FROM user_creds WHERE id = $1',
      [userId]
    );

    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid refresh token');
  });

  it('should handle expired refresh token', async () => {
    // Manually delete the refresh token from Redis to simulate expiration
    await testContext.redisClient.del(`refresh:${refreshToken}`);

    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(response.body.error).toBe('Invalid refresh token');
  });

  it('should allow multiple refresh operations', async () => {
    // First refresh
    const response1 = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    // Second refresh with new token
    const response2 = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: response1.body.refreshToken })
      .expect(200);

    // Third refresh with newest token
    const response3 = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: response2.body.refreshToken })
      .expect(200);

    // All tokens should be different
    expect(response1.body.refreshToken).not.toBe(refreshToken);
    expect(response2.body.refreshToken).not.toBe(response1.body.refreshToken);
    expect(response3.body.refreshToken).not.toBe(response2.body.refreshToken);

    // Only the latest token should exist in Redis
    const latest = await testContext.redisClient.get(`refresh:${response3.body.refreshToken}`);
    expect(latest).toBe(userId);

    const old1 = await testContext.redisClient.get(`refresh:${refreshToken}`);
    const old2 = await testContext.redisClient.get(`refresh:${response1.body.refreshToken}`);
    const old3 = await testContext.redisClient.get(`refresh:${response2.body.refreshToken}`);
    
    expect(old1).toBeNull();
    expect(old2).toBeNull();
    expect(old3).toBeNull();
  });
});
