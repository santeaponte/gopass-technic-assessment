import express from 'express';

import { errorHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/routes';
import { projectsRouter } from './modules/projects/routes';
import { tasksRouter } from './modules/tasks/routes';
import { usersRouter } from './modules/users/routes';
import { healthRouter } from './routes/health';

export const app = express();

app.use(express.json());
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/projects', projectsRouter);
app.use('/tasks', tasksRouter);
app.use(errorHandler);
