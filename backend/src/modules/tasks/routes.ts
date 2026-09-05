import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { TaskController } from './controller';
import { TaskRepository } from './repository';
import { TaskService } from './service';

const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);
const taskController = new TaskController(taskService);

export const tasksRouter = Router();

tasksRouter.get('/', authenticate, taskController.findAll);
tasksRouter.get('/:id', authenticate, taskController.findById);
tasksRouter.post('/', authenticate, authorize('ADMIN'), taskController.create);
tasksRouter.patch('/:id', authenticate, authorize('ADMIN'), taskController.update);
tasksRouter.delete('/:id', authenticate, authorize('ADMIN'), taskController.archive);
tasksRouter.patch('/:id/status', authenticate, taskController.changeStatus);
