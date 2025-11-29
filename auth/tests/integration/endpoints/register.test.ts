import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('POST /auth/register - Integration Tests', () => {
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
  });

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toEqual({
      id: expect.any(String),
      email: 'newuser@example.com',
    });

    // Verify JWT format
    expect(response.body.accessToken.split('.')).toHaveLength(3);
    
    // Verify UUID format for refresh token
    expect(response.body.refreshToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should store user in database with hashed password', async () => {
    const password = 'SecurePass123!';
    
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'dbtest@example.com',
        password,
      })
      .expect(201);

    // Query database directly
    const result = await testContext.pgPool.query(
      'SELECT * FROM user_creds WHERE email = $1',
      ['dbtest@example.com']
    );

    expect(result.rows).toHaveLength(1);
    const user = result.rows[0];
    
    expect(user.email).toBe('dbtest@example.com');
    expect(user.password_hash).not.toBe(password);
    expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    expect(user.email_verified).toBe(false);
    expect(user.is_active).toBe(true);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
    expect(user.last_login_at).toBeNull();
  });

  it('should store refresh token in Redis', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'redistest@example.com',
        password: 'SecurePass123!',
      })
      .expect(201);

    const refreshToken = response.body.refreshToken;
    const userId = response.body.user.id;

    // Check Redis directly
    const storedUserId = await testContext.redisClient.get(`refresh:${refreshToken}`);
    expect(storedUserId).toBe(userId);

    // Check TTL is set
    const ttl = await testContext.redisClient.ttl(`refresh:${refreshToken}`);
    expect(ttl).toBeGreaterThan(0);
  });

  it('should return 409 for duplicate email', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'SecurePass123!',
    };

    // First registration
    await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Duplicate registration
    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(409);

    expect(response.body).toEqual({
      error: 'Email already exists',
    });
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'SecurePass123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'email',
          message: expect.any(String),
        }),
      ])
    );
  });

  it('should return 400 for password shorter than 8 characters', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'short',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'password',
        }),
      ])
    );
  });

  it('should return 400 for missing email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        password: 'SecurePass123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 for missing password', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should handle special characters in email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'user+test@example.co.uk',
        password: 'SecurePass123!',
      })
      .expect(201);

    expect(response.body.user.email).toBe('user+test@example.co.uk');
  });

  it('should be case-sensitive for email', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        email: 'Test@Example.com',
        password: 'SecurePass123!',
      })
      .expect(201);

    // Different case should work (no unique constraint on lowercase)
    await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      })
      .expect(201);
  });
});
