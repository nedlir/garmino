import { Request, Response, NextFunction } from 'express';
import { RequestRouter } from '../routing/RequestRouter';
import { GatewayRequest } from '../adapters/IProtocolAdapter';
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
      const gatewayRequest: GatewayRequest = {
        method: req.method,
        path: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        protocol: 'http',
      };

      // Route the request (userId will be attached by auth middleware if authenticated)
      const gatewayResponse = await router.route(gatewayRequest, req.userId);

      if (gatewayResponse.status === 503) {
        logger.error({ path: req.path }, 'Service unavailable');
        res.status(503).json(gatewayResponse.body);
        return;
      }

      // forward response to client
      res.status(gatewayResponse.status);
      
      Object.entries(gatewayResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (gatewayResponse.body !== undefined) {
        res.json(gatewayResponse.body);
      } else {
        res.end();
      }
    } catch (err) {
      logger.error({ err, path: req.path }, 'Error in gateway middleware');
      next(err);
    }
  };
};
