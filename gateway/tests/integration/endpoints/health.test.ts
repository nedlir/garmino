import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('GET /health - Integration Tests', () => {
  beforeAll(async () => {
    // Connect to containers (already started by globalSetup)
    testContext = await setupTestContainers();
    
    // Import app modules AFTER env vars are set
    const { createTestApp } = await import('../testApp');
    app = await createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  it('should return 200 with service status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      service: 'gateway',
      status: 'healthy',
      uptime: expect.any(Number),
    });
  });

  it('should return uptime as a positive number', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should not require authentication', async () => {
    // No Authorization header
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
  });
});
