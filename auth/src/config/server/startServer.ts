import { Express } from 'express';
import { logger } from '../../utils/logger';
import { initDatabase } from '../db/postgres';
import { connectRedis } from '../db/redis';

export const startServer = async (app: Express, port: number) => {
  try {
    logger.info('Starting auth service...');

    await initDatabase();
    logger.info('Database initialized');

    await connectRedis();
    logger.info('Redis connected');

    app.listen(port, () => {
      logger.info(`Auth service running on port ${port}`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};
