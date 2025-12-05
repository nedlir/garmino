import { Server } from 'http';
import { logger } from '../../utils/logger';
import { closeRedis } from '../redis';
import { HttpProtocolAdapter } from '../../adapters/HttpProtocolAdapter';

export const gracefulShutdown = async (
  server: Server,
  httpAdapter: HttpProtocolAdapter,
  signal: string
) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await httpAdapter.shutdown();
      await closeRedis();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

export const registerShutdownHandlers = (
  server: Server,
  httpAdapter: HttpProtocolAdapter
) => {
  process.on('SIGTERM', () => gracefulShutdown(server, httpAdapter, 'SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown(server, httpAdapter, 'SIGINT'));
};
