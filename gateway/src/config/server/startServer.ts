import { Express } from 'express';
import { logger } from '../../utils/logger';
import { initRedis } from '../redis';
import { HttpProtocolAdapter } from '../../adapters/HttpProtocolAdapter';

export const startServer = async (
  app: Express,
  port: number,
  httpAdapter: HttpProtocolAdapter,
  routeCount: number
) => {
  try {
    logger.info('Starting gateway service...');

    await initRedis();
    logger.info('Redis initialized');

    await httpAdapter.initialize();
    logger.info('HTTP adapter initialized');

    return app.listen(port, () => {
      logger.info(`Gateway service listening on port ${port}`);
      logger.info(`Registered ${routeCount} service routes`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};
