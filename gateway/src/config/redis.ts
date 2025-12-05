import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      const delay = Math.min(retries * 50, 2000);
      logger.warn(`Retrying Redis connection, attempt ${retries}`);
      return delay;
    },
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connecting');
});

redisClient.on('ready', () => {
  logger.info('Redis ready');
});

redisClient.on('error', (err: Error) => {
  logger.error({ err }, 'Redis error');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis reconnecting');
});

export const initRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis');
    throw err;
  }
};

export const closeRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing Redis connection');
    throw err;
  }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    const key = `blacklist:${jti}`;
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (err) {
    logger.error({ err, jti }, 'Error checking token blacklist');
    throw err;
  }
};

export default redisClient;
