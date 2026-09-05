import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors';
import { signToken } from '../../shared/jwt';
import { hashPassword, comparePassword } from '../../shared/password';
import type { AuthResponse, PublicUser } from './types';
import type { LoginInput, RegisterInput } from './schemas';
import { UserRepository } from './repository';

export class AuthService {
	public constructor(private readonly userRepository: UserRepository) {}

	public async register(input: RegisterInput): Promise<AuthResponse> {
		const passwordHash = await hashPassword(input.password);

		try {
			const user = await this.userRepository.createViewer({
				name: input.name,
				email: input.email,
				passwordHash,
			});

			return this.toAuthResponse(user);
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError(409, 'Email is already registered');
			}

			throw error;
		}
	}

	public async login(input: LoginInput): Promise<AuthResponse> {
		const user = await this.userRepository.findByEmail(input.email);
		const passwordMatches = user ? await comparePassword(input.password, user.passwordHash) : false;

		if (!user || !passwordMatches) {
			throw new AppError(401, 'Invalid email or password');
		}

		return this.toAuthResponse(user);
	}

	private toAuthResponse(user: {
		id: string;
		name: string;
		email: string;
		role: PublicUser['role'];
		createdAt: Date;
		passwordHash: string;
	}): AuthResponse {
		const publicUser: PublicUser = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
		};

		return {
			user: publicUser,
			token: signToken({ userId: user.id, role: user.role }),
		};
	}
}
