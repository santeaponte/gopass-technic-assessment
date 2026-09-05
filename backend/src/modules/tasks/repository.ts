import type { Prisma, TaskPriority, TaskStatus, UserRole } from '@prisma/client';

import { prisma } from '../../shared/prisma';

const publicUserSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	createdAt: true,
} as const;

const projectSelect = {
	id: true,
	name: true,
	description: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	dueDate: true,
	owner: { select: publicUserSelect },
} as const;

const taskSelect = {
	id: true,
	title: true,
	description: true,
	status: true,
	priority: true,
	notes: true,
	projectId: true,
	project: { select: projectSelect },
	archivedAt: true,
	createdAt: true,
	updatedAt: true,
	dueDate: true,
	assignee: { select: publicUserSelect },
} as const;

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
export type CreateTaskData = {
	title: string;
	description?: string | null;
	priority?: TaskPriority;
	projectId: string;
	dueDate?: Date | null;
	assigneeId?: string | null;
};
export type UpdateTaskData = Partial<CreateTaskData>;

export class TaskRepository {
	public constructor(private readonly database: DatabaseClient = prisma) {}

	public async transaction<T>(callback: (repository: TaskRepository) => Promise<T>): Promise<T> {
		return prisma.$transaction(async (transactionClient) => callback(new TaskRepository(transactionClient)));
	}

	public findAll(search?: string, projectId?: string): Promise<TaskRecord[]> {
		const where: Prisma.TaskWhereInput = {
			archivedAt: null,
			...(projectId ? { projectId } : {}),
			...(search
				? {
					OR: [
						{ title: { contains: search, mode: 'insensitive' } },
						{ description: { contains: search, mode: 'insensitive' } },
					],
				}
				: {}),
		};

		return this.database.task.findMany({
			where,
			select: taskSelect,
			orderBy: { createdAt: 'asc' },
		});
	}

	public findById(id: string): Promise<TaskRecord | null> {
		return this.database.task.findFirst({
			where: { id, archivedAt: null },
			select: taskSelect,
		});
	}

	public findProjectById(id: string): Promise<{ id: string } | null> {
		return this.database.project.findUnique({ where: { id }, select: { id: true } });
	}

	public findUserById(id: string): Promise<{ id: string } | null> {
		return this.database.user.findUnique({ where: { id }, select: { id: true } });
	}

	public create(data: CreateTaskData): Promise<TaskRecord> {
		return this.database.task.create({ data, select: taskSelect });
	}

	public update(id: string, data: UpdateTaskData): Promise<TaskRecord> {
		return this.database.task.update({ where: { id }, data, select: taskSelect });
	}

	public updateStatus(id: string, status: TaskStatus): Promise<TaskRecord> {
		return this.database.task.update({ where: { id }, data: { status }, select: taskSelect });
	}

	public archive(id: string): Promise<void> {
		return this.database.task.update({ where: { id }, data: { archivedAt: new Date() }, select: { id: true } }).then(() => undefined);
	}

	public createStatusChange(data: {
		taskId: string;
		fromStatus: TaskStatus | null;
		toStatus: TaskStatus;
		comment?: string | null;
		changedBy: string;
	}): Promise<void> {
		return this.database.taskStatusChange.create({ data }).then(() => undefined);
	}

	public async getCurrentStatus(id: string): Promise<{ status: TaskStatus; assigneeId: string | null } | null> {
		return this.database.task.findFirst({
			where: { id, archivedAt: null },
			select: { status: true, assigneeId: true },
		});
	}
}

export type TaskRole = UserRole;
