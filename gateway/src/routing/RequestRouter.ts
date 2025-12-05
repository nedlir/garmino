import { Request, Response } from 'express';
import { RouteConfig } from '../config/routes';
import { IProtocolAdapter } from '../adapters/IProtocolAdapter';
import { logger } from '../utils/logger';

export class RequestRouter {
  private routes: RouteConfig[] = [];
  private protocolAdapter: IProtocolAdapter;

  constructor(protocolAdapter: IProtocolAdapter) {
    this.protocolAdapter = protocolAdapter;
  }

  registerRoute(config: RouteConfig): void {
    this.routes.push(config);
    logger.debug({ pathPrefix: config.pathPrefix, targetService: config.targetService }, 'Route registered');
  }

  getRouteForPath(path: string): RouteConfig | null {
    const route = this.routes.find(r => path.startsWith(r.pathPrefix));
    if (!route) {
      logger.debug({ path }, 'No matching route found');
      return null;
    }
    return route;
  }

  async proxyRequest(req: Request, res: Response, userId?: string): Promise<boolean> {
    const route = this.getRouteForPath(req.path);

    if (!route) {
      logger.warn({ path: req.path }, 'Route not found');
      return false;
    }

    const targetUrl = `http://${route.targetService}:${route.targetPort}`;

    if (userId) {
      req.headers['x-user-id'] = userId;
    }

    logger.info({ 
      method: req.method, 
      path: req.path, 
      targetService: route.targetService,
      userId: userId || 'anonymous'
    }, 'Routing request');

    await this.protocolAdapter.proxyRequest(req, res, targetUrl);
    return true;
  }
}
