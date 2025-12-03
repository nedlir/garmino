import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './routes/healthRoute';
import apiRoutes from './routes/apiRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { swaggerSpec } from './swagger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(helmet());
app.use(cors());

app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/health', healthRoutes);
app.use('/users', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Users service running on port ${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
};

startServer();

export { app };
