import type { Request, Response } from 'express';

import { loginSchema, registerSchema } from './schemas';
import { AuthService } from './service';

export class AuthController {
	public constructor(private readonly authService: AuthService) {}

	public register = async (request: Request, response: Response): Promise<void> => {
		const input = registerSchema.parse(request.body);
		const result = await this.authService.register(input);
		response.status(201).json(result);
	};

	public login = async (request: Request, response: Response): Promise<void> => {
		const input = loginSchema.parse(request.body);
		const result = await this.authService.login(input);
		response.status(200).json(result);
	};
}
