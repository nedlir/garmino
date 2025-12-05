import { GenericContainer, StartedTestContainer } from 'testcontainers';
import fs from 'fs';
import path from 'path';

let redisContainer: StartedTestContainer;

export async function setup() {
  console.log('Starting test containers...');
  
  // Start Redis container for token blacklist
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  
  // Write to a temp file that tests can read
  const config = {
    REDIS_URL: redisUrl,
    REDIS_HOST: redisContainer.getHost(),
    REDIS_PORT: redisContainer.getMappedPort(6379),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.test-config.json'),
    JSON.stringify(config, null, 2)
  );

  console.log('Test containers started');
  console.log(`   Redis: ${redisUrl}`);
}

export async function teardown() {
  console.log('Stopping test containers...');
  
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
