import type { Prisma, ProjectStatus } from '@prisma/client';

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
	createdAt: true,
	updatedAt: true,
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
	dueDate?: Date;
	ownerId: string;
};

export type UpdateProjectData = {
	name?: string;
	description?: string;
	status?: ProjectStatus;
	dueDate?: Date;
};

export class ProjectRepository {
	public findAll(search?: string): Promise<ProjectRecord[]> {
		const where: Prisma.ProjectWhereInput | undefined = search
			? {
				OR: [
					{ name: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				],
			}
			: undefined;

		return prisma.project.findMany({
			where,
			select: projectSelect,
			orderBy: { createdAt: 'asc' },
		});
	}

	public findById(id: string): Promise<ProjectRecord | null> {
		return prisma.project.findUnique({
			where: { id },
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
		return prisma.project.delete({
			where: { id },
		}).then(() => undefined);
	}
}
