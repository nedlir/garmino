import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('GET /users/:userId - Integration Tests', () => {
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

  it('should return user profile when it exists', async () => {
    // Create a test user profile
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username, first_name, last_name, avatar_url, bio)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'testuser', 'Test', 'User', 'https://example.com/avatar.jpg', 'Test bio']
    );

    const response = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    expect(response.body).toEqual({
      user_id: userId,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it('should return 404 when user profile does not exist', async () => {
    const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174999';

    const response = await request(app)
      .get(`/users/${nonExistentUserId}`)
      .expect(404);

    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'User not found',
    });
  });

  it('should return profile with null fields when optional fields are not set', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174000';
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    expect(response.body).toEqual({
      user_id: userId,
      username: null,
      first_name: null,
      last_name: null,
      avatar_url: null,
      bio: null,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it('should handle special characters in username', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174000';
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)`,
      [userId, 'test_user-123']
    );

    const response = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    expect(response.body.username).toBe('test_user-123');
  });

  it('should return profile with long bio text', async () => {
    const userId = '423e4567-e89b-12d3-a456-426614174000';
    const longBio = 'A'.repeat(500);
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, bio) VALUES ($1, $2)`,
      [userId, longBio]
    );

    const response = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    expect(response.body.bio).toBe(longBio);
    expect(response.body.bio.length).toBe(500);
  });
});
