import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoute';
import userRoutes from './routes/userRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(helmet());
app.use(cors());

app.use(express.json());

app.use('/health', healthRoutes);
app.use('/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Users service running on port ${PORT}`);
  });
};

startServer();

export { app };
