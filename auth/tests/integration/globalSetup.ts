import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedTestContainer;

export async function setup() {
  console.log('Starting test containers...');
  
  // Start Postgres container
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('auth_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Start Redis container
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  // Store connection info in environment for tests to use
  const dbUrl = `postgresql://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@${postgresContainer.getHost()}:${postgresContainer.getPort()}/${postgresContainer.getDatabase()}`;
  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  
  // Run database migrations
  const pgPool = new Pool({
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    database: postgresContainer.getDatabase(),
    user: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
  });
  
  const initSql = fs.readFileSync(
    path.join(__dirname, '../../init-db.sql'),
    'utf-8'
  );
  await pgPool.query(initSql);
  await pgPool.end();
  
  // Write to a temp file that tests can read (env vars don't persist across processes)
  const config = {
    DATABASE_URL: dbUrl,
    REDIS_URL: redisUrl,
    POSTGRES_HOST: postgresContainer.getHost(),
    POSTGRES_PORT: postgresContainer.getPort(),
    POSTGRES_DB: postgresContainer.getDatabase(),
    POSTGRES_USER: postgresContainer.getUsername(),
    POSTGRES_PASSWORD: postgresContainer.getPassword(),
    REDIS_HOST: redisContainer.getHost(),
    REDIS_PORT: redisContainer.getMappedPort(6379),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.test-config.json'),
    JSON.stringify(config, null, 2)
  );

  console.log('Test containers started');
  console.log(`   PostgreSQL: ${dbUrl}`);
  console.log(`   Redis: ${redisUrl}`);
}

export async function teardown() {
  console.log('Stopping test containers...');
  
  if (postgresContainer) {
    await postgresContainer.stop();
  }
  if (redisContainer) {
    await redisContainer.stop();
  }
  
  // Clean up config file
  const configPath = path.join(__dirname, '.test-config.json');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  console.log('Test containers stopped');
}
