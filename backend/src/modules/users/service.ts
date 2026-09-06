import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors';
import { hashPassword } from '../../shared/password';
import { UserRepository } from './repository';
import type { CreateUserInput } from './schemas';

export class UserService {
	public constructor(private readonly userRepository: UserRepository) {}

	public findAll() {
		return this.userRepository.findAll();
	}

	public async createUser(input: CreateUserInput) {
		try {
			const passwordHash = await hashPassword(input.password);
			const user = await this.userRepository.createUser({
				name: input.name,
				email: input.email,
				passwordHash,
				role: input.role,
			});

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
				createdAt: user.createdAt,
			};
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError(409, 'Email is already registered');
			}

			throw error;
		}
	}

	public async findById(id: string) {
		const user = await this.userRepository.findById(id);

		if (!user) {
			throw new AppError(404, 'User not found');
		}

		return user;
	}

	public async updateStatus(id: string, isActive: boolean, currentUserId: string) {
		if (id === currentUserId && !isActive) {
			throw new AppError(409, 'No puedes desactivar tu propio usuario');
		}

		try {
			return await this.userRepository.updateStatus(id, isActive);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new AppError(404, 'User not found');
			}
			throw error;
		}
	}
}
