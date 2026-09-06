import { Prisma } from '@prisma/client';
import type { UserRole } from '@prisma/client';

import { AppError } from '../../shared/errors';
import { ProjectRepository } from './repository';
import type { CreateProjectInput, UpdateProjectInput } from './schemas';

export class ProjectService {
	public constructor(private readonly projectRepository: ProjectRepository) {}

	public findAll(search: string | undefined, userId: string, role: UserRole) {
		return this.projectRepository.findAll(search, userId, role);
	}

	public async findById(id: string, userId: string, role: UserRole) {
		const project = await this.projectRepository.findById(id, userId, role);

		if (!project) {
			throw new AppError(404, 'Project not found');
		}

		return project;
	}

	public async create(input: CreateProjectInput, ownerId: string) {
		try {
			return await this.projectRepository.create({
				...input,
				ownerId,
			});
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError(409, 'Project name is already in use');
			}

			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new AppError(404, 'Project owner not found');
			}

			throw error;
		}
	}

	public async update(id: string, input: UpdateProjectInput) {
		const currentProject = await this.ensureExists(id);

		if (currentProject.status !== 'ACTIVE' && (input.status !== 'ACTIVE' || Object.keys(input).some((field) => field !== 'status'))) {
			throw new AppError(409, 'El proyecto está inactivo. Actívalo antes de modificarlo');
		}

		const startDate = input.startDate ?? currentProject.startDate;
		const dueDate = input.dueDate ?? currentProject.dueDate;

		if (startDate && dueDate && startDate > dueDate) {
			throw new AppError(422, 'La fecha de inicio debe ser anterior o igual a la fecha de entrega');
		}

		try {
			return await this.projectRepository.update(id, input);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError(409, 'Project name is already in use');
			}

			throw error;
		}
	}

	public async delete(id: string): Promise<void> {
		await this.ensureExists(id);

		try {
			await this.projectRepository.delete(id);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
				throw new AppError(409, 'No puedes eliminar un proyecto que todavía tiene tareas');
			}
			throw error;
		}
	}

	private async ensureExists(id: string) {
		const project = await this.projectRepository.findById(id);

		if (!project) {
			throw new AppError(404, 'Project not found');
		}

		return project;
	}
}
