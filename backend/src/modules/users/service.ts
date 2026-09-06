import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors';
import { hashPassword } from '../../shared/password';
import { UserRepository } from './repository';
import type { CreateViewerInput } from './schemas';

export class UserService {
	public constructor(private readonly userRepository: UserRepository) {}

	public findAll() {
		return this.userRepository.findAll();
	}

	public async createViewer(input: CreateViewerInput) {
		try {
			const passwordHash = await hashPassword(input.password);
			const user = await this.userRepository.createViewer({
				name: input.name,
				email: input.email,
				passwordHash,
			});

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
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
}
