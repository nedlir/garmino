import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('GET /users/:userId/garmin-connection - Integration Tests', () => {
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

  it('should retrieve Garmin connection with tokens', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, connected_at, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'oauth1_token_value', 'oauth2_token_value', connectedAt, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-connection`)
      .expect(200);

    expect(response.body).toMatchObject({
      user_id: userId,
      garmin_oauth1_token: 'oauth1_token_value',
      garmin_oauth2_token: 'oauth2_token_value',
      is_active: true,
    });
    expect(response.body.connected_at).toBeDefined();
  });

  it('should return 404 when connection does not exist', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-connection`)
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Garmin connection not found',
    });
  });

  it('should retrieve connection with only oauth1 token', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174000';
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, is_active)
       VALUES ($1, $2, $3)`,
      [userId, 'oauth1_only', true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-connection`)
      .expect(200);

    expect(response.body.garmin_oauth1_token).toBe('oauth1_only');
    expect(response.body.garmin_oauth2_token).toBeNull();
  });
});
