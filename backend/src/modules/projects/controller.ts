import type { Request, Response } from 'express';

import { projectIdSchema, projectSearchSchema, createProjectSchema, updateProjectSchema } from './schemas';
import { ProjectService } from './service';

export class ProjectController {
	public constructor(private readonly projectService: ProjectService) {}

	public findAll = async (request: Request, response: Response): Promise<void> => {
		const { search } = projectSearchSchema.parse(request.query);
		const user = request.user;
		if (!user) {
			response.status(401).json({ error: 'Authentication required' });
			return;
		}

		const projects = await this.projectService.findAll(search, user.userId, user.role);
		response.status(200).json(projects);
	};

	public findById = async (request: Request, response: Response): Promise<void> => {
		const { id } = projectIdSchema.parse(request.params);
		const user = request.user;
		if (!user) {
			response.status(401).json({ error: 'Authentication required' });
			return;
		}

		const project = await this.projectService.findById(id, user.userId, user.role);
		response.status(200).json(project);
	};

	public create = async (request: Request, response: Response): Promise<void> => {
		const input = createProjectSchema.parse(request.body);
		const ownerId = request.user?.userId;

		if (!ownerId) {
			response.status(401).json({ error: 'Authentication required' });
			return;
		}

		const project = await this.projectService.create(input, ownerId);
		response.status(201).json(project);
	};

	public update = async (request: Request, response: Response): Promise<void> => {
		const { id } = projectIdSchema.parse(request.params);
		const input = updateProjectSchema.parse(request.body);
		const project = await this.projectService.update(id, input);
		response.status(200).json(project);
	};

	public delete = async (request: Request, response: Response): Promise<void> => {
		const { id } = projectIdSchema.parse(request.params);
		await this.projectService.delete(id);
		response.status(204).send();
	};
}
