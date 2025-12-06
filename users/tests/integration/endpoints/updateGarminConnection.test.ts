import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('PUT /users/:userId/garmin-connection - Integration Tests', () => {
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

  it('should create new Garmin connection when none exists', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Create user profile first
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth1_token: 'new_oauth1_token',
        garmin_oauth2_token: 'new_oauth2_token',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      user_id: userId,
      garmin_oauth1_token: 'new_oauth1_token',
      garmin_oauth2_token: 'new_oauth2_token',
      is_active: true,
    });
    expect(response.body.connected_at).toBeDefined();
  });

  it('should update existing Garmin connection', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    // Create existing connection
    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, connected_at, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'old_oauth1', 'old_oauth2', connectedAt, true]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth1_token: 'updated_oauth1_token',
        garmin_oauth2_token: 'updated_oauth2_token',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      user_id: userId,
      garmin_oauth1_token: 'updated_oauth1_token',
      garmin_oauth2_token: 'updated_oauth2_token',
      is_active: true,
    });
  });

  it('should update only oauth1 token', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'old_oauth1', 'old_oauth2', true]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth1_token: 'new_oauth1_only',
      })
      .expect(200);

    expect(response.body.garmin_oauth1_token).toBe('new_oauth1_only');
    expect(response.body.garmin_oauth2_token).toBe('old_oauth2');
  });

  it('should update only oauth2 token', async () => {
    const userId = '423e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'old_oauth1', 'old_oauth2', true]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth2_token: 'new_oauth2_only',
      })
      .expect(200);

    expect(response.body.garmin_oauth1_token).toBe('old_oauth1');
    expect(response.body.garmin_oauth2_token).toBe('new_oauth2_only');
  });

  it('should return 400 when no token fields provided', async () => {
    const userId = '523e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Bad Request',
      message: 'At least one token field must be provided',
    });
  });

  it('should update is_active flag', async () => {
    const userId = '623e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, is_active)
       VALUES ($1, $2, $3)`,
      [userId, 'oauth1_token', true]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth1_token: 'oauth1_token',
        is_active: false,
      })
      .expect(200);

    expect(response.body.is_active).toBe(false);
  });

  it('should preserve connected_at when updating existing connection', async () => {
    const userId = '723e4567-e89b-12d3-a456-426614174000';
    const originalConnectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, connected_at, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'old_token', originalConnectedAt, true]
    );

    const response = await request(app)
      .put(`/users/${userId}/garmin-connection`)
      .send({
        garmin_oauth1_token: 'new_token',
      })
      .expect(200);

    expect(response.body.connected_at).toBe(originalConnectedAt.toISOString());
  });
});
