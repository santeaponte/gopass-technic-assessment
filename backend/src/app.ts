import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/routes';
import { projectsRouter } from './modules/projects/routes';
import { tasksRouter } from './modules/tasks/routes';
import { usersRouter } from './modules/users/routes';
import { healthRouter } from './routes/health';

export const app = express();

const openApiDocument = yaml.load(
	fs.readFileSync(path.resolve(process.cwd(), 'src/docs/openapi.yaml'), 'utf8'),
) as swaggerUi.JsonObject;

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/projects', projectsRouter);
app.use('/tasks', tasksRouter);
app.use(errorHandler);
