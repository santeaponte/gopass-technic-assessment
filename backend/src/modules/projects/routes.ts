import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { ProjectController } from './controller';
import { ProjectRepository } from './repository';
import { ProjectService } from './service';

const projectRepository = new ProjectRepository();
const projectService = new ProjectService(projectRepository);
const projectController = new ProjectController(projectService);

export const projectsRouter = Router();

projectsRouter.get('/', authenticate, projectController.findAll);
projectsRouter.get('/:id', authenticate, projectController.findById);
projectsRouter.post('/', authenticate, authorize('ADMIN'), projectController.create);
projectsRouter.patch('/:id', authenticate, authorize('ADMIN'), projectController.update);
projectsRouter.delete('/:id', authenticate, authorize('ADMIN'), projectController.delete);
