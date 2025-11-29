import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('POST /auth/login - Integration Tests', () => {
  const testUser = {
    email: 'loginuser@example.com',
    password: 'SecurePass123!',
  };

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
    
    // Register a test user before each test
    await request(app)
      .post('/auth/register')
      .send(testUser);
  });

  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toEqual({
      id: expect.any(String),
      email: testUser.email,
    });
  });

  it('should update last_login_at timestamp', async () => {
    // Get user before login
    const beforeResult = await testContext.pgPool.query(
      'SELECT last_login_at FROM user_creds WHERE email = $1',
      [testUser.email]
    );
    expect(beforeResult.rows[0].last_login_at).toBeNull();

    // Login
    await request(app)
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    // Check last_login_at was updated
    const afterResult = await testContext.pgPool.query(
      'SELECT last_login_at FROM user_creds WHERE email = $1',
      [testUser.email]
    );
    expect(afterResult.rows[0].last_login_at).not.toBeNull();
    expect(afterResult.rows[0].last_login_at).toBeInstanceOf(Date);
  });

  it('should store new refresh token in Redis', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    const refreshToken = response.body.refreshToken;
    const userId = response.body.user.id;

    const storedUserId = await testContext.redisClient.get(`refresh:${refreshToken}`);
    expect(storedUserId).toBe(userId);
  });

  it('should return 401 for non-existent email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: 'Invalid credentials',
    });
  });

  it('should return 401 for incorrect password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: 'Invalid credentials',
    });
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'not-an-email',
        password: 'SecurePass123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 for missing email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password: 'SecurePass123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 for missing password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should allow multiple logins for same user', async () => {
    // First login
    const response1 = await request(app)
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    // Second login
    const response2 = await request(app)
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    // Both should have different tokens
    expect(response1.body.accessToken).not.toBe(response2.body.accessToken);
    expect(response1.body.refreshToken).not.toBe(response2.body.refreshToken);

    // Both refresh tokens should exist in Redis
    const userId = response1.body.user.id;
    const stored1 = await testContext.redisClient.get(`refresh:${response1.body.refreshToken}`);
    const stored2 = await testContext.redisClient.get(`refresh:${response2.body.refreshToken}`);
    
    expect(stored1).toBe(userId);
    expect(stored2).toBe(userId);
  });

  it('should handle case-sensitive email login', async () => {
    // Try to login with different case
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email.toUpperCase(),
        password: testUser.password,
      })
      .expect(401);

    expect(response.body.error).toBe('Invalid credentials');
  });
});
