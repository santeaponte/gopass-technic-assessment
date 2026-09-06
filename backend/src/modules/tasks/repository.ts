import type { Prisma, ProjectStatus, TaskPriority, TaskStatus, UserRole } from '@prisma/client';

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
	startDate: true,
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
	creatorId: true,
	project: { select: projectSelect },
	creator: { select: publicUserSelect },
	archivedAt: true,
	createdAt: true,
	updatedAt: true,
	dueDate: true,
	assignee: { select: publicUserSelect },
	statusHistory: {
		orderBy: { createdAt: 'asc' },
		select: {
			id: true,
			fromStatus: true,
			toStatus: true,
			comment: true,
			createdAt: true,
			changedByUser: { select: publicUserSelect },
		},
	},
} as const;

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
export type CreateTaskData = {
	title: string;
	description?: string | null;
	notes?: string | null;
	priority?: TaskPriority;
	projectId: string;
	creatorId: string;
	dueDate?: Date | null;
	assigneeId?: string | null;
};
export type UpdateTaskData = Partial<CreateTaskData>;

export class TaskRepository {
	public constructor(private readonly database: DatabaseClient = prisma) {}

	public async transaction<T>(callback: (repository: TaskRepository) => Promise<T>): Promise<T> {
		return prisma.$transaction(async (transactionClient) => callback(new TaskRepository(transactionClient)));
	}

	public findAll(search: string | undefined, projectId: string | undefined, userId: string, role: UserRole): Promise<TaskRecord[]> {
		const where: Prisma.TaskWhereInput = {
			archivedAt: null,
			...(projectId ? { projectId } : {}),
		};
		const filters: Prisma.TaskWhereInput[] = [];

		if (search) {
			filters.push({
				OR: [
					{ title: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				],
			});
		}

		if (role === 'VIEWER') {
			filters.push({
				OR: [{ creatorId: userId }, { assigneeId: userId }],
			});
			filters.push({ project: { status: 'ACTIVE' } });
		}

		if (filters.length > 0) {
			where.AND = filters;
		}

		return this.database.task.findMany({
			where,
			select: taskSelect,
			orderBy: { createdAt: 'asc' },
		});
	}

	public findById(id: string, userId?: string, role?: UserRole): Promise<TaskRecord | null> {
		const where: Prisma.TaskWhereInput = { id, archivedAt: null };

		if (role === 'VIEWER' && userId) {
			where.OR = [{ creatorId: userId }, { assigneeId: userId }];
			where.project = { status: 'ACTIVE' };
		}

		return this.database.task.findFirst({
			where,
			select: taskSelect,
		});
	}

	public findProjectById(id: string, userId?: string, role?: UserRole): Promise<{ id: string; status: ProjectStatus } | null> {
		const where: Prisma.ProjectWhereInput = { id };

		if (role === 'VIEWER' && userId) {
			where.tasks = {
				some: {
					OR: [{ creatorId: userId }, { assigneeId: userId }],
					archivedAt: null,
				},
			};
			where.status = 'ACTIVE';
		}

		return this.database.project.findFirst({ where, select: { id: true, status: true } });
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

	public delete(id: string): Promise<void> {
		return this.database.task.delete({ where: { id } }).then(() => undefined);
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

	public async getCurrentStatus(id: string): Promise<{ status: TaskStatus; creatorId: string; assigneeId: string | null } | null> {
		return this.database.task.findFirst({
			where: { id, archivedAt: null },
			select: { status: true, creatorId: true, assigneeId: true },
		});
	}
}

export type TaskRole = UserRole;
