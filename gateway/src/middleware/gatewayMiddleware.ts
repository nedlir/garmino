import { Request, Response, NextFunction } from 'express';
import { RequestRouter } from '../routing/RequestRouter';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const createGatewayMiddleware = (router: RequestRouter) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Proxy the request directly using real Express req/res
      const handled = await router.proxyRequest(req, res, req.userId);
      
      if (!handled) {
        // Route not found
        res.status(404).json({
          error: 'Not Found',
          message: 'Route not found',
        });
      }
    } catch (err) {
      logger.error({ err, path: req.path }, 'Error in gateway middleware');
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Service temporarily unavailable',
        });
      }
    }
  };
};
