import { IRequestRouter } from './IRequestRouter';
import { GatewayRequest, GatewayResponse } from '../adapters/IProtocolAdapter';
import { RouteConfig } from '../config/routes';
import { IProtocolAdapter } from '../adapters/IProtocolAdapter';
import { logger } from '../utils/logger';

export class RequestRouter implements IRequestRouter {
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
    // Find the first route whose prefix matches the beginning of the path
    const route = this.routes.find(r => path.startsWith(r.pathPrefix));
    
    if (!route) {
      logger.debug({ path }, 'No matching route found');
      return null;
    }

    return route;
  }

  async route(request: GatewayRequest, userId?: string): Promise<GatewayResponse> {
    const route = this.getRouteForPath(request.path);

    if (!route) {
      logger.warn({ path: request.path }, 'Route not found');
      return {
        status: 404,
        headers: { 'content-type': 'application/json' },
        body: {
          error: 'Not Found',
          message: 'Route not found',
        },
      };
    }

    try {
      const targetUrl = `http://${route.targetService}:${route.targetPort}`;
      
      const enrichedRequest: GatewayRequest = {
        ...request,
        headers: {
          ...request.headers,
          'x-target-url': targetUrl,
        },
      };

      if (userId) {
        enrichedRequest.headers['x-user-id'] = userId;
      }

      logger.info({ 
        method: request.method, 
        path: request.path, 
        targetService: route.targetService,
        userId: userId || 'anonymous'
      }, 'Routing request');

      const response = await this.protocolAdapter.handleRequest(enrichedRequest);
      
      return response;
    } catch (error) {
      logger.error({ 
        err: error, 
        path: request.path, 
        targetService: route.targetService 
      }, 'Service unavailable');

      return {
        status: 503,
        headers: { 'content-type': 'application/json' },
        body: {
          error: 'Service Unavailable',
          message: 'Service temporarily unavailable',
        },
      };
    }
  }
}
