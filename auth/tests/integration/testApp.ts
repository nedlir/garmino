import express, { Express } from 'express';
import authRoutes from '../../src/routes/apiRoutes';
import healthRoute from '../../src/routes/healthRoute';
import { errorHandler } from '../../src/middleware/errorHandler';

export function createTestApp(): Express {
  const app = express();
  
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use('/health', healthRoute);
  app.use(errorHandler);
  
  return app;
}
