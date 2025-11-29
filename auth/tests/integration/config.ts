import { Pool } from 'pg';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

interface TestConfig {
  DATABASE_URL: string;
  REDIS_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
}

export interface TestContext {
  pgPool: Pool;
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
  process.env.DATABASE_URL = config.DATABASE_URL;
  process.env.REDIS_URL = config.REDIS_URL;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-integration-tests';

  // Create database pool for test utilities
  const pgPool = new Pool({
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
  });

  // Create Redis client for test utilities
  const redisClient = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  });

  return {
    pgPool,
    redisClient,
  };
}

export async function teardownTestContainers(context: TestContext): Promise<void> {
  // Only close connections, containers are managed by globalSetup/globalTeardown
  if (context?.pgPool) {
    await context.pgPool.end();
  }
  if (context?.redisClient) {
    await context.redisClient.quit();
  }
}

export async function cleanupDatabase(context: TestContext): Promise<void> {
  await context.pgPool.query('TRUNCATE TABLE user_creds CASCADE');
  const keys = await context.redisClient.keys('*');
  if (keys.length > 0) {
    await context.redisClient.del(...keys);
  }
}
