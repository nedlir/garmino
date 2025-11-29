import { Pool } from 'pg';
import { logger } from '../../utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

export const initDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    logger.info('PostgreSQL connection pool initialized');
    client.release();
  } catch (err) {
    logger.error({ err }, 'Failed to initialize PostgreSQL connection pool');
    throw err;
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch (err) {
    logger.error({ err }, 'PostgreSQL health check failed');
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL connection pool closed');
  } catch (err) {
    logger.error({ err }, 'Error closing PostgreSQL connection pool');
    throw err;
  }
};

export default pool;
