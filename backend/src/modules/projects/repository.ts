import type { Prisma, ProjectStatus, TaskPriority, UserRole } from '@prisma/client';

import { prisma } from '../../shared/prisma';

const ownerSelect = {
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
	priority: true,
	createdAt: true,
	updatedAt: true,
	startDate: true,
	dueDate: true,
	owner: {
		select: ownerSelect,
	},
} as const;

export type ProjectRecord = Prisma.ProjectGetPayload<{
	select: typeof projectSelect;
}>;

export type CreateProjectData = {
	name: string;
	description?: string;
	status?: ProjectStatus;
	priority?: TaskPriority;
	startDate?: Date;
	dueDate?: Date;
	ownerId: string;
};

export type UpdateProjectData = {
	name?: string;
	description?: string;
	status?: ProjectStatus;
	priority?: TaskPriority;
	startDate?: Date;
	dueDate?: Date;
};

export class ProjectRepository {
	public findAll(search: string | undefined, userId: string, role: UserRole): Promise<ProjectRecord[]> {
		const where: Prisma.ProjectWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		if (role === 'VIEWER') {
			where.tasks = {
				some: {
					OR: [{ creatorId: userId }, { assigneeId: userId }],
					archivedAt: null,
				},
			};
		}

		return prisma.project.findMany({
			where,
			select: projectSelect,
			orderBy: { createdAt: 'asc' },
		});
	}

	public findById(id: string, userId?: string, role?: UserRole): Promise<ProjectRecord | null> {
		const where: Prisma.ProjectWhereInput = { id };

		if (role === 'VIEWER' && userId) {
			where.tasks = {
				some: {
					OR: [{ creatorId: userId }, { assigneeId: userId }],
					archivedAt: null,
				},
			};
		}

		return prisma.project.findFirst({
			where,
			select: projectSelect,
		});
	}

	public create(data: CreateProjectData): Promise<ProjectRecord> {
		const { ownerId, ...projectData } = data;

		return prisma.project.create({
			data: {
				...projectData,
				owner: { connect: { id: ownerId } },
			},
			select: projectSelect,
		});
	}

	public update(id: string, data: UpdateProjectData): Promise<ProjectRecord> {
		return prisma.project.update({
			where: { id },
			data,
			select: projectSelect,
		});
	}

	public delete(id: string): Promise<void> {
		return prisma.project.delete({ where: { id } }).then(() => undefined);
	}

}
