import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors';
import { ProjectRepository } from './repository';
import type { CreateProjectInput, UpdateProjectInput } from './schemas';

export class ProjectService {
	public constructor(private readonly projectRepository: ProjectRepository) {}

	public findAll(search?: string) {
		return this.projectRepository.findAll(search);
	}

	public async findById(id: string) {
		const project = await this.projectRepository.findById(id);

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
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new AppError(404, 'Project owner not found');
			}

			throw error;
		}
	}

	public async update(id: string, input: UpdateProjectInput) {
		await this.ensureExists(id);
		return this.projectRepository.update(id, input);
	}

	public async delete(id: string): Promise<void> {
		await this.ensureExists(id);

		try {
			await this.projectRepository.delete(id);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
				throw new AppError(409, 'Project cannot be deleted while it has tasks');
			}

			throw error;
		}
	}

	private async ensureExists(id: string): Promise<void> {
		const project = await this.projectRepository.findById(id);

		if (!project) {
			throw new AppError(404, 'Project not found');
		}
	}
}
