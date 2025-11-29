import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { healthCheck as dbHealthCheck } from '../config/db/postgres';
import { healthCheck as redisHealthCheck } from '../config/db/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await dbHealthCheck();
    const redisHealthy = await redisHealthCheck();

    const healthy = dbHealthy && redisHealthy;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'auth-service',
      checks: {
        database: dbHealthy ? 'ok' : 'failed',
        redis: redisHealthy ? 'ok' : 'failed',
      },
    });
  } catch (err) {
    logger.error({ err }, 'Health check error');
    res.status(503).json({
      status: 'error',
      service: 'auth-service',
    });
  }
});

export default router;
