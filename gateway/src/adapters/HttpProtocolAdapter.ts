import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { IProtocolAdapter } from './IProtocolAdapter';
import { logger } from '../utils/logger';

export class HttpProtocolAdapter implements IProtocolAdapter {
  public readonly name = 'http';

  async initialize(): Promise<void> {
    logger.info('HTTP Protocol Adapter initialized');
  }

  async proxyRequest(req: Request, res: Response, targetUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proxyOptions: Options = {
        target: targetUrl,
        changeOrigin: true,
        logLevel: 'silent',
        onError: (err: Error, _req: Request, res: Response) => {
          logger.error({ err, target: targetUrl }, 'Proxy error occurred');
          if (!res.headersSent) {
            res.status(503).json({
              error: 'Service Unavailable',
              message: 'Service temporarily unavailable',
            });
          }
        },
        onProxyReq: fixRequestBody,
        onProxyRes: (_proxyRes: any, _req: Request, res: Response) => {
          res.on('finish', resolve);
        },
      };

      const proxy = createProxyMiddleware(proxyOptions);
      
      proxy(req, res, (err?: any) => {
        if (err) {
          logger.error({ err, targetUrl }, 'Proxy error');
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  }

  async shutdown(): Promise<void> {
    logger.info('HTTP Protocol Adapter shut down');
  }
}
