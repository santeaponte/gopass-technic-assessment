import express from 'express';

import { errorHandler } from './middlewares/error-handler';
import { healthRouter } from './routes/health';

export const app = express();

app.use(express.json());
app.use('/health', healthRouter);
app.use(errorHandler);
