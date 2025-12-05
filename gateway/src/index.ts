import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoute';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { JwtValidator } from './auth/JwtValidator';
import { HttpProtocolAdapter } from './adapters/HttpProtocolAdapter';
import { RequestRouter } from './routing/RequestRouter';
import { routes } from './config/routes';
import { createAuthMiddleware } from './middleware/authMiddleware';
import { createGatewayMiddleware } from './middleware/gatewayMiddleware';
import { startServer } from './config/server/startServer';
import { registerShutdownHandlers } from './config/server/shutdown';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/health', healthRoutes);

const jwtValidator = new JwtValidator(process.env.JWT_SECRET);
const httpAdapter = new HttpProtocolAdapter();
const requestRouter = new RequestRouter(httpAdapter);

routes.forEach(route => {
  requestRouter.registerRoute(route);
});

app.use(createAuthMiddleware(jwtValidator, routes));

app.use(createGatewayMiddleware(requestRouter));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

(async () => {
  const server = await startServer(app, PORT, httpAdapter, routes.length);
  if (server) {
    registerShutdownHandlers(server, httpAdapter);
  }
})();

export default app;
