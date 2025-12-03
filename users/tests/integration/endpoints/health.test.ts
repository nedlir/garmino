import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { setupTestContainers, teardownTestContainers, TestContext } from '../config';

let testContext: TestContext;
let app: Express;

describe('GET /health - Integration Tests', () => {
  beforeAll(async () => {
    testContext = await setupTestContainers();
    const { createTestApp } = await import('../testApp');
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestContainers(testContext);
  });

  it('should return 200 OK with service status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'users',
      uptime: expect.any(Number),
    });
  });

  it('should return uptime as a positive number', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof response.body.uptime).toBe('number');
  });

  it('should increment uptime on subsequent calls', async () => {
    const response1 = await request(app)
      .get('/health')
      .expect(200);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1100));

    const response2 = await request(app)
      .get('/health')
      .expect(200);

    expect(response2.body.uptime).toBeGreaterThan(response1.body.uptime);
  });

  it('should have correct content-type header', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
