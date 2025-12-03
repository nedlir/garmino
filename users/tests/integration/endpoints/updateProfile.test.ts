import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('PUT /users/:userId - Integration Tests', () => {
  beforeAll(async () => {
    testContext = await setupTestContainers();
    const { createTestApp } = await import('../testApp');
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  beforeEach(async () => {
    await cleanupDatabase(testContext);
  });

  it('should update user profile successfully when requester matches user', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Create initial profile
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username, first_name) VALUES ($1, $2, $3)`,
      [userId, 'oldusername', 'OldName']
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        username: 'newusername',
        first_name: 'NewName',
        last_name: 'NewLastName',
      })
      .expect(200);

    expect(response.body).toEqual({
      user_id: userId,
      username: 'newusername',
      first_name: 'NewName',
      last_name: 'NewLastName',
      avatar_url: null,
      bio: null,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });

    // Verify in database
    const result = await testContext.pgPool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    expect(result.rows[0].username).toBe('newusername');
    expect(result.rows[0].first_name).toBe('NewName');
  });

  it('should update only provided fields', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username, first_name, last_name) 
       VALUES ($1, $2, $3, $4)`,
      [userId, 'testuser', 'First', 'Last']
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        bio: 'New bio text',
      })
      .expect(200);

    expect(response.body.username).toBe('testuser');
    expect(response.body.first_name).toBe('First');
    expect(response.body.last_name).toBe('Last');
    expect(response.body.bio).toBe('New bio text');
  });

  it('should return 403 when requester tries to update another user profile', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174000';
    const requesterId = '423e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)`,
      [userId, 'targetuser']
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', requesterId)
      .send({
        username: 'hacker',
      })
      .expect(403);

    expect(response.body).toEqual({
      error: 'Forbidden',
      message: 'Cannot update another user\'s profile',
    });

    // Verify profile was not changed
    const result = await testContext.pgPool.query(
      'SELECT username FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    expect(result.rows[0].username).toBe('targetuser');
  });

  it('should return 401 when X-User-Id header is missing', async () => {
    const userId = '523e4567-e89b-12d3-a456-426614174000';

    const response = await request(app)
      .put(`/users/${userId}`)
      .send({
        username: 'newusername',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  });

  it('should return 404 when updating non-existent profile', async () => {
    const userId = '623e4567-e89b-12d3-a456-426614174000';

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        username: 'newusername',
      })
      .expect(404);

    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'User not found',
    });
  });

  it('should return 400 for invalid username (too short)', async () => {
    const userId = '723e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        username: 'ab',
      })
      .expect(400);

    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('Validation error');
  });

  it('should return 400 for invalid avatar URL', async () => {
    const userId = '823e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        avatar_url: 'not-a-valid-url',
      })
      .expect(400);

    expect(response.body.error).toBe('Bad Request');
  });

  it('should update avatar_url with valid URL', async () => {
    const userId = '923e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        avatar_url: 'https://example.com/avatar.png',
      })
      .expect(200);

    expect(response.body.avatar_url).toBe('https://example.com/avatar.png');
  });

  it('should handle empty update (no fields provided)', async () => {
    const userId = 'a23e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)`,
      [userId, 'testuser']
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({})
      .expect(200);

    expect(response.body.username).toBe('testuser');
  });

  it('should update bio with long text', async () => {
    const userId = 'b23e4567-e89b-12d3-a456-426614174000';
    const longBio = 'A'.repeat(500);
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        bio: longBio,
      })
      .expect(200);

    expect(response.body.bio).toBe(longBio);
  });

  it('should update updated_at timestamp', async () => {
    const userId = 'c23e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)`,
      [userId, 'testuser']
    );

    // Get initial timestamp
    const initialResult = await testContext.pgPool.query(
      'SELECT updated_at FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    const initialTimestamp = initialResult.rows[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app)
      .put(`/users/${userId}`)
      .set('X-User-Id', userId)
      .send({
        username: 'updateduser',
      })
      .expect(200);

    // Get updated timestamp
    const updatedResult = await testContext.pgPool.query(
      'SELECT updated_at FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    const updatedTimestamp = updatedResult.rows[0].updated_at;

    expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(
      new Date(initialTimestamp).getTime()
    );
  });
});
