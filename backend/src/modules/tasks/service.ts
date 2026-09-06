import { Prisma } from '@prisma/client';
import type { TaskStatus, UserRole } from '@prisma/client';
import { AppError } from '../../shared/errors';
import { TaskRepository } from './repository';
import type { ChangeTaskStatusInput, CreateTaskInput, UpdateTaskInput } from './schemas';

const allowedTransitions: Record<TaskStatus, Partial<Record<TaskStatus, UserRole[]>>> = {
	PENDING: {
		IN_PROGRESS: ['ADMIN', 'VIEWER'],
		IN_REVIEW: ['ADMIN', 'VIEWER'],
		DONE: ['ADMIN'],
	},
	IN_PROGRESS: {
		PENDING: ['ADMIN', 'VIEWER'],
		IN_REVIEW: ['ADMIN', 'VIEWER'],
		DONE: ['ADMIN'],
	},
	IN_REVIEW: {
		DONE: ['ADMIN'],
		IN_PROGRESS: ['ADMIN', 'VIEWER'],
		PENDING: ['ADMIN', 'VIEWER'],
	},
	DONE: {
		PENDING: ['ADMIN'],
		IN_PROGRESS: ['ADMIN'],
		IN_REVIEW: ['ADMIN'],
	},
};

const validNextStatuses: Record<TaskStatus, TaskStatus[]> = {
	PENDING: ['IN_PROGRESS', 'IN_REVIEW', 'DONE'],
	IN_PROGRESS: ['PENDING', 'IN_REVIEW', 'DONE'],
	IN_REVIEW: ['DONE', 'IN_PROGRESS', 'PENDING'],
	DONE: ['PENDING', 'IN_PROGRESS', 'IN_REVIEW'],
};

export class TaskService {
	public constructor(private readonly taskRepository: TaskRepository) {}

	public findAll(search: string | undefined, projectId: string | undefined, userId: string, role: UserRole) {
		return this.taskRepository.findAll(search, projectId, userId, role);
	}

	public async findById(id: string, userId?: string, role?: UserRole) {
		const task = await this.taskRepository.findById(id, userId, role);
		if (!task) {
			throw new AppError(404, 'Task not found');
		}
		return task;
	}

	public async create(input: CreateTaskInput, creatorId: string, role: UserRole) {
		try {
			return await this.taskRepository.transaction(async (repository) => {
				await this.ensureProjectExists(repository, input.projectId, creatorId, role);
				await this.ensureProjectIsActive(repository, input.projectId);
				await this.ensureUserExists(repository, input.assigneeId);
				const task = await repository.create({ ...input, creatorId });
				await repository.createStatusChange({
					taskId: task.id,
					fromStatus: null,
					toStatus: 'PENDING',
					changedBy: creatorId,
				});

				return repository.findById(task.id);
			});
		} catch (error: unknown) {
			this.rethrowTaskTitleConflict(error);
		}
	}

	public async update(id: string, input: UpdateTaskInput, userId: string, role: UserRole) {
		try {
			return await this.taskRepository.transaction(async (repository) => {
				const task = await repository.findById(id, userId, role);
				if (!task) {
					throw new AppError(404, 'Task not found');
				}
				await this.ensureProjectIsActive(repository, task.projectId);

				if (role === 'VIEWER' && Object.keys(input).some((field) => field !== 'assigneeId')) {
					throw new AppError(403, 'Viewers can only update task assignee');
				}

				if (input.projectId) {
					await this.ensureProjectExists(repository, input.projectId);
				}
				if (input.assigneeId) {
					await this.ensureUserExists(repository, input.assigneeId);
				}
				if (input.creatorId) {
					await this.ensureUserExists(repository, input.creatorId);
				}

				await repository.update(id, input);
				return repository.findById(id, userId, role);
			});
		} catch (error: unknown) {
			this.rethrowTaskTitleConflict(error);
		}
	}

	public async changeStatus(id: string, input: ChangeTaskStatusInput, role: UserRole, changedBy: string) {
		return this.taskRepository.transaction(async (repository) => {
			const visibleTask = await repository.findById(id, changedBy, role);
			if (!visibleTask) {
				throw new AppError(404, 'Task not found');
			}
			await this.ensureProjectIsActive(repository, visibleTask.projectId);

			const currentTask = await repository.getCurrentStatus(id);
			if (!currentTask) {
				throw new AppError(404, 'Task not found');
			}

			if (!validNextStatuses[currentTask.status].includes(input.status)) {
				throw new AppError(409, 'Invalid task status transition');
			}

			if (role === 'VIEWER' && currentTask.creatorId !== changedBy && currentTask.assigneeId !== changedBy) {
				throw new AppError(403, 'Only the task creator or assignee can change this task status');
			}

			const permittedRoles = allowedTransitions[currentTask.status][input.status] ?? [];
			if (!permittedRoles.includes(role)) {
				throw new AppError(403, 'Insufficient permissions for this task status transition');
			}

			await repository.updateStatus(id, input.status);
			await repository.createStatusChange({
				taskId: id,
				fromStatus: currentTask.status,
				toStatus: input.status,
				comment: input.comment,
				changedBy,
			});

			return repository.findById(id);
		});
	}

	public async delete(id: string, userId: string, role: UserRole): Promise<void> {
		if (role !== 'ADMIN') {
			throw new AppError(403, 'Only administrators can delete tasks');
		}

		const task = await this.findById(id, userId, role);
		await this.ensureProjectIsActive(this.taskRepository, task.projectId);
		try {
			await this.taskRepository.delete(task.id);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new AppError(404, 'Task not found');
			}
			throw error;
		}
	}

	private async ensureTaskExists(repository: TaskRepository, id: string): Promise<void> {
		const task = await repository.findById(id);
		if (!task) {
			throw new AppError(404, 'Task not found');
		}
	}

	private async ensureProjectExists(repository: TaskRepository, id: string, userId?: string, role?: UserRole): Promise<void> {
		const project = await repository.findProjectById(id, userId, role);
		if (!project) {
			throw new AppError(404, 'Project not found');
		}
	}

	private async ensureProjectIsActive(repository: TaskRepository, id: string): Promise<void> {
		const project = await repository.findProjectById(id);
		if (!project) {
			throw new AppError(404, 'Project not found');
		}
		if (project.status !== 'ACTIVE') {
			throw new AppError(409, 'El proyecto está inactivo. Actívalo antes de modificar sus tareas');
		}
	}

	private async ensureUserExists(repository: TaskRepository, id: string | null | undefined): Promise<void> {
		if (!id) {
			return;
		}

		const user = await repository.findUserById(id);
		if (!user) {
			throw new AppError(404, 'Assignee was not found');
		}
	}

	private rethrowTaskTitleConflict(error: unknown): never {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
			throw new AppError(409, 'Ya existe una tarea con ese nombre en este proyecto');
		}

		throw error;
	}
}
