import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoute';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());

// Routes
app.use('/health', healthRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Users service running on port ${PORT}`);
  });
};

startServer();

export { app };
