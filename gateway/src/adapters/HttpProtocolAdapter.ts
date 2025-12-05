import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { IProtocolAdapter, GatewayRequest, GatewayResponse } from './IProtocolAdapter';
import { logger } from '../utils/logger';

export class HttpProtocolAdapter implements IProtocolAdapter {
  public readonly name = 'http';
  private proxyCache: Map<string, ReturnType<typeof createProxyMiddleware>>;

  constructor() {
    this.proxyCache = new Map();
  }

  async initialize(): Promise<void> {
    logger.info('HTTP Protocol Adapter initialized');
  }


  async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    return new Promise((resolve, reject) => {
      const targetUrl = request.headers['x-target-url'];
      
      if (!targetUrl) {
        reject(new Error('Target URL not specified in request headers'));
        return;
      }

      const proxy = this.getOrCreateProxy(targetUrl);

      const expressReq = this.adaptToExpressRequest(request);
      const expressRes = this.adaptToExpressResponse(resolve, reject);

      proxy(expressReq as Request, expressRes as Response, (err?: any) => {
        if (err) {
          logger.error({ err, targetUrl }, 'Proxy error');
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  }


  async shutdown(): Promise<void> {
    this.proxyCache.clear();
    logger.info('HTTP Protocol Adapter shut down');
  }


  private getOrCreateProxy(targetUrl: string): ReturnType<typeof createProxyMiddleware> {
    if (!this.proxyCache.has(targetUrl)) {
      const proxyOptions: Options = {
        target: targetUrl,
        changeOrigin: true,
        logLevel: 'silent', 
        onError: (err: Error, _req: Request, _res: Response) => {
          logger.error({ err, target: targetUrl }, 'Proxy error occurred');
        },
        onProxyReq: (_proxyReq: any, req: Request) => {
          logger.debug({ 
            method: req.method, 
            path: req.url, 
            target: targetUrl 
          }, 'Forwarding request');
        },
        onProxyRes: (proxyRes: any, req: Request) => {
          logger.debug({ 
            status: proxyRes.statusCode, 
            path: req.url 
          }, 'Received response');
        },
      };

      const proxy = createProxyMiddleware(proxyOptions);
      this.proxyCache.set(targetUrl, proxy);
    }

    return this.proxyCache.get(targetUrl)!;
  }

  /**
   * Adapt GatewayRequest to Express Request format
   * Requirement 1.2: Preserve original request body, query parameters, and relevant headers
   */
  private adaptToExpressRequest(request: GatewayRequest): Partial<Request> {
    return {
      method: request.method,
      url: request.path,
      headers: request.headers,
      body: request.body,
      query: request.query || {},
    } as Partial<Request>;
  }

  /**
   * Adapt Express Response to GatewayResponse format
   * Requirement 1.3: Forward response with appropriate status codes and headers
   */
  private adaptToExpressResponse(
    resolve: (response: GatewayResponse) => void,
    _reject: (error: Error) => void
  ): Partial<Response> {
    let statusCode = 200;
    const headers: Record<string, string> = {};
    const bodyChunks: Buffer[] = [];

    return {
      statusCode,
      status(code: number) {
        statusCode = code;
        return this as Response;
      },
      setHeader(name: string, value: string | string[]) {
        headers[name] = Array.isArray(value) ? value.join(', ') : value;
        return this as Response;
      },
      getHeader(name: string) {
        return headers[name];
      },
      write(chunk: Buffer | string) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bodyChunks.push(buffer);
        return true;
      },
      end(chunk?: Buffer | string) {
        if (chunk) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bodyChunks.push(buffer);
        }

        const bodyBuffer = Buffer.concat(bodyChunks);
        let body: unknown;

        // Try to parse as JSON
        try {
          const bodyString = bodyBuffer.toString('utf-8');
          body = bodyString ? JSON.parse(bodyString) : undefined;
        } catch {
          // If not JSON, return as string
          body = bodyBuffer.toString('utf-8') || undefined;
        }

        resolve({
          status: statusCode,
          headers,
          body,
        });
      },
      on(_event: string, _handler: (...args: unknown[]) => void) {
        // Event handler stub for Response interface compatibility
        return this as Response;
      },
    } as Partial<Response>;
  }
}
