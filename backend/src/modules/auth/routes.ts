import { Router } from 'express';

import { AuthController } from './controller';
import { AuthService } from './service';
import { UserRepository } from './repository';

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
