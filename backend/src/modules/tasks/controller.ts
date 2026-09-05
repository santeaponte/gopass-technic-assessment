import type { Request, Response } from 'express';

import { taskIdSchema, taskSearchSchema, createTaskSchema, updateTaskSchema, changeTaskStatusSchema } from './schemas';
import { TaskService } from './service';

export class TaskController {
	public constructor(private readonly taskService: TaskService) {}

	public findAll = async (request: Request, response: Response): Promise<void> => {
		const { search, projectId } = taskSearchSchema.parse(request.query);
		response.status(200).json(await this.taskService.findAll(search, projectId));
	};

	public findById = async (request: Request, response: Response): Promise<void> => {
		const { id } = taskIdSchema.parse(request.params);
		response.status(200).json(await this.taskService.findById(id));
	};

	public create = async (request: Request, response: Response): Promise<void> => {
		const input = createTaskSchema.parse(request.body);
		const creatorId = request.user?.userId;
		if (!creatorId) {
			response.status(401).json({ error: 'Authentication required' });
			return;
		}
		response.status(201).json(await this.taskService.create(input, creatorId));
	};

	public update = async (request: Request, response: Response): Promise<void> => {
		const { id } = taskIdSchema.parse(request.params);
		const input = updateTaskSchema.parse(request.body);
		response.status(200).json(await this.taskService.update(id, input));
	};

	public changeStatus = async (request: Request, response: Response): Promise<void> => {
		const { id } = taskIdSchema.parse(request.params);
		const input = changeTaskStatusSchema.parse(request.body);
		const user = request.user;
		if (!user) {
			response.status(401).json({ error: 'Authentication required' });
			return;
		}
		response.status(200).json(await this.taskService.changeStatus(id, input, user.role, user.userId));
	};

	public archive = async (request: Request, response: Response): Promise<void> => {
		const { id } = taskIdSchema.parse(request.params);
		await this.taskService.archive(id);
		response.status(204).send();
	};
}
