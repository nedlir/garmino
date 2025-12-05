import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { initRedis, closeRedis } from './config/redis';
import healthRoutes from './routes/healthRoute';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize Redis
    await initRedis();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Gateway service listening on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeRedis();
        } catch (err) {
          logger.error({ err }, 'Error closing Redis during shutdown');
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

export default app;
