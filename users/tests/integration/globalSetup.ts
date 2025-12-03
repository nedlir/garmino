import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let postgresContainer: StartedPostgreSqlContainer;

export async function setup() {
  console.log('Starting test containers...');
  
  // Start Postgres container
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('users_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Store connection info in environment for tests to use
  const dbUrl = `postgresql://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@${postgresContainer.getHost()}:${postgresContainer.getPort()}/${postgresContainer.getDatabase()}`;
  
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
    POSTGRES_HOST: postgresContainer.getHost(),
    POSTGRES_PORT: postgresContainer.getPort(),
    POSTGRES_DB: postgresContainer.getDatabase(),
    POSTGRES_USER: postgresContainer.getUsername(),
    POSTGRES_PASSWORD: postgresContainer.getPassword(),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.test-config.json'),
    JSON.stringify(config, null, 2)
  );

  console.log('Test containers started');
  console.log(`   PostgreSQL: ${dbUrl}`);
}

export async function teardown() {
  console.log('Stopping test containers...');
  
  if (postgresContainer) {
    await postgresContainer.stop();
  }
  
  // Clean up config file
  const configPath = path.join(__dirname, '.test-config.json');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  console.log('Test containers stopped');
}
