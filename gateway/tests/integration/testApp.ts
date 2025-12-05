import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from '../../src/routes/healthRoute';
import { notFoundHandler, errorHandler } from '../../src/middleware/errorHandler';
import { JwtValidator } from '../../src/auth/JwtValidator';
import { HttpProtocolAdapter } from '../../src/adapters/HttpProtocolAdapter';
import { RequestRouter } from '../../src/routing/RequestRouter';
import { routes } from '../../src/config/routes';
import { createAuthMiddleware } from '../../src/middleware/authMiddleware';
import { createGatewayMiddleware } from '../../src/middleware/gatewayMiddleware';
import { initRedis } from '../../src/config/redis';

let redisInitialized = false;

export async function createTestApp(): Promise<Express> {
  const app = express();
  
  // Initialize Redis once
  if (!redisInitialized) {
    await initRedis();
    redisInitialized = true;
  }
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check route (no auth required)
  app.use('/health', healthRoutes);

  // Initialize gateway components
  const jwtValidator = new JwtValidator(process.env.JWT_SECRET);
  const httpAdapter = new HttpProtocolAdapter();
  const requestRouter = new RequestRouter(httpAdapter);

  // Register all routes
  routes.forEach(route => {
    requestRouter.registerRoute(route);
  });

  // Apply authentication middleware
  app.use(createAuthMiddleware(jwtValidator, routes));

  // Apply gateway routing middleware for all routes
  app.use(createGatewayMiddleware(requestRouter));

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}
