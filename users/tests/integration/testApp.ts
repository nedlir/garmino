import express, { Express } from 'express';
import userRoutes from '../../src/routes/userRoutes';
import healthRoute from '../../src/routes/healthRoute';
import { notFoundHandler, errorHandler } from '../../src/middleware/errorHandler';

export function createTestApp(): Express {
  const app = express();
  
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use('/health', healthRoute);
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}
