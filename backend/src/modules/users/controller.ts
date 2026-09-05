import type { Request, Response } from 'express';

import { userIdSchema } from './schemas';
import { UserService } from './service';

export class UserController {
	public constructor(private readonly userService: UserService) {}

	public findAll = async (_request: Request, response: Response): Promise<void> => {
		const users = await this.userService.findAll();
		response.status(200).json(users);
	};

	public findById = async (request: Request, response: Response): Promise<void> => {
		const { id } = userIdSchema.parse(request.params);
		const user = await this.userService.findById(id);
		response.status(200).json(user);
	};
}
