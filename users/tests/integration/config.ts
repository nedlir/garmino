import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

interface TestConfig {
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
}

export interface TestContext {
  pgPool: Pool;
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
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  // Create database pool for test utilities
  const pgPool = new Pool({
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
  });

  return {
    pgPool,
  };
}

export async function teardownTestContainers(context: TestContext): Promise<void> {
  // Only close connections, containers are managed by globalSetup/globalTeardown
  if (context?.pgPool) {
    await context.pgPool.end();
  }
}

export async function cleanupDatabase(context: TestContext): Promise<void> {
  await context.pgPool.query('TRUNCATE TABLE user_profiles CASCADE');
  await context.pgPool.query('TRUNCATE TABLE garmin_connections CASCADE');
}
