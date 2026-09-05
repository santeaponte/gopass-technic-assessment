import type { User, UserRole } from '@prisma/client';

import { prisma } from '../../shared/prisma';

export type UserRecord = Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'role' | 'createdAt'>;
export type PublicUserRecord = Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

const publicUserSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	createdAt: true,
} as const;

const authUserSelect = {
	...publicUserSelect,
	passwordHash: true,
} as const;

export class UserRepository {
	public findByEmail(email: string): Promise<UserRecord | null> {
		return prisma.user.findUnique({
			where: { email },
			select: authUserSelect,
		});
	}

	public createViewer(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
		return prisma.user.create({
			data: {
				...data,
				role: 'VIEWER' satisfies UserRole,
			},
			select: authUserSelect,
		});
	}

	public findAll(): Promise<PublicUserRecord[]> {
		return prisma.user.findMany({
			select: publicUserSelect,
			orderBy: { createdAt: 'asc' },
		});
	}

	public findById(id: string): Promise<PublicUserRecord | null> {
		return prisma.user.findUnique({
			where: { id },
			select: publicUserSelect,
		});
	}
}
