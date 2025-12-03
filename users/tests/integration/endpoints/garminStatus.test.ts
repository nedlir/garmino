import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, cleanupDatabase, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('GET /users/:userId/garmin-status - Integration Tests', () => {
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

  it('should return connected status when Garmin connection exists', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    const lastSyncAt = new Date('2024-01-20T15:30:00Z');
    
    // Create user profile first
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    // Create Garmin connection
    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, connected_at, last_sync_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'oauth1_token_value', 'oauth2_token_value', connectedAt, lastSyncAt, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body).toEqual({
      isConnected: true,
      connectedAt: connectedAt.toISOString(),
      lastSyncAt: lastSyncAt.toISOString(),
      isActive: true,
    });
  });

  it('should return not connected status when no Garmin connection exists', async () => {
    const userId = '223e4567-e89b-12d3-a456-426614174000';
    
    // Create user profile without Garmin connection
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body).toEqual({
      isConnected: false,
      connectedAt: null,
      lastSyncAt: null,
      isActive: false,
    });
  });

  it('should return inactive status when connection is inactive', async () => {
    const userId = '323e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, connected_at, is_active)
       VALUES ($1, $2, $3)`,
      [userId, connectedAt, false]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body).toEqual({
      isConnected: true,
      connectedAt: connectedAt.toISOString(),
      lastSyncAt: null,
      isActive: false,
    });
  });

  it('should return status with null lastSyncAt when never synced', async () => {
    const userId = '423e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, connected_at, is_active)
       VALUES ($1, $2, $3)`,
      [userId, connectedAt, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body).toEqual({
      isConnected: true,
      connectedAt: connectedAt.toISOString(),
      lastSyncAt: null,
      isActive: true,
    });
  });

  it('should handle connection with both OAuth tokens', async () => {
    const userId = '523e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, connected_at, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'token1', 'token2', connectedAt, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body.isConnected).toBe(true);
    // OAuth tokens should not be exposed in the response
    expect(response.body).not.toHaveProperty('garmin_oauth1_token');
    expect(response.body).not.toHaveProperty('garmin_oauth2_token');
  });

  it('should handle connection with only OAuth1 token', async () => {
    const userId = '623e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, connected_at, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'oauth1_only', connectedAt, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body.isConnected).toBe(true);
    expect(response.body.isActive).toBe(true);
  });

  it('should return not connected for user that never existed', async () => {
    const nonExistentUserId = '723e4567-e89b-12d3-a456-426614174000';

    const response = await request(app)
      .get(`/users/${nonExistentUserId}/garmin-status`)
      .expect(200);

    expect(response.body).toEqual({
      isConnected: false,
      connectedAt: null,
      lastSyncAt: null,
      isActive: false,
    });
  });

  it('should handle recent sync timestamp', async () => {
    const userId = '823e4567-e89b-12d3-a456-426614174000';
    const connectedAt = new Date('2024-01-15T10:00:00Z');
    const recentSync = new Date();
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, connected_at, last_sync_at, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, connectedAt, recentSync, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body.isConnected).toBe(true);
    expect(new Date(response.body.lastSyncAt).getTime()).toBeCloseTo(
      recentSync.getTime(),
      -3 // Within 1 second
    );
  });

  it('should handle old connection with recent sync', async () => {
    const userId = '923e4567-e89b-12d3-a456-426614174000';
    const oldConnection = new Date('2023-01-01T00:00:00Z');
    const recentSync = new Date('2024-12-01T12:00:00Z');
    
    await testContext.pgPool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    await testContext.pgPool.query(
      `INSERT INTO garmin_connections (user_id, connected_at, last_sync_at, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, oldConnection, recentSync, true]
    );

    const response = await request(app)
      .get(`/users/${userId}/garmin-status`)
      .expect(200);

    expect(response.body.isConnected).toBe(true);
    expect(new Date(response.body.lastSyncAt).getTime()).toBeGreaterThan(
      new Date(response.body.connectedAt).getTime()
    );
  });
});
