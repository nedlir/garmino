import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerShutdownHandlers } from './config/server/shutdown';
import { startServer } from './config/server/startServer';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoute';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

registerShutdownHandlers();

startServer(app, PORT);