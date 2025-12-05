import { Request, Response, NextFunction } from 'express';
import { IJwtValidator } from '../auth/IJwtValidator';
import { RouteConfig } from '../config/routes';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const createAuthMiddleware = (
  jwtValidator: IJwtValidator,
  routes: RouteConfig[]
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const route = routes.find((r) => req.path.startsWith(r.pathPrefix));

      if (!route || !route.requiresAuth) {
        logger.debug({ path: req.path }, 'Public route, skipping auth');
        return next();
      }

      if (route.publicPaths && route.publicPaths.some((p) => req.path.startsWith(p))) {
        logger.debug({ path: req.path }, 'Public path within protected route, skipping auth');
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn({ path: req.path }, 'Missing or invalid Authorization header');
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const payload = await jwtValidator.validate(token);
      if (!payload) {
        logger.warn({ path: req.path }, 'Invalid or expired token');
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }

      req.headers['x-user-id'] = payload.userId;
      req.userId = payload.userId;

      logger.debug({ userId: payload.userId, path: req.path }, 'Request authenticated');
      next();
    } catch (err) {
      logger.error({ err, path: req.path }, 'Error in auth middleware');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  };
};
