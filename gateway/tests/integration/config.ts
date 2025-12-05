import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

interface TestConfig {
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
}

export interface TestContext {
  redisClient: Redis;
}

function loadTestConfig(): TestConfig {
  const configPath = path.join(__dirname, '.test-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'Test config not found. Make sure globalSetup has run. ' +
      'Run tests with: npm run test:integration'
    );
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export async function setupTestContainers(): Promise<TestContext> {
  const config = loadTestConfig();
  
  // Set environment variables BEFORE any app modules are imported
  process.env.REDIS_URL = config.REDIS_URL;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  // Create Redis client for test utilities
  const redisClient = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  });

  return {
    redisClient,
  };
}

export async function teardownTestContainers(context: TestContext): Promise<void> {
  // Only close connections, containers are managed by globalSetup/globalTeardown
  if (context?.redisClient) {
    await context.redisClient.quit();
  }
}

export async function cleanupRedis(context: TestContext): Promise<void> {
  const keys = await context.redisClient.keys('*');
  if (keys.length > 0) {
    await context.redisClient.del(...keys);
  }
}
