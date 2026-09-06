import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { UserController } from './controller';
import { UserRepository } from './repository';
import { UserService } from './service';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

export const usersRouter = Router();

usersRouter.get('/', authenticate, authorize('ADMIN'), userController.findAll);
usersRouter.post('/', authenticate, authorize('ADMIN'), userController.createUser);
usersRouter.patch('/:id/status', authenticate, authorize('ADMIN'), userController.updateStatus);
usersRouter.get('/:id', authenticate, userController.findById);
