import type { User, UserRole } from '@prisma/client';

import { prisma } from '../../shared/prisma';

export type UserRecord = Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'role' | 'createdAt'>;

export class UserRepository {
	public findByEmail(email: string): Promise<UserRecord | null> {
		return prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				email: true,
				passwordHash: true,
				role: true,
				createdAt: true,
			},
		});
	}

	public createViewer(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
		return prisma.user.create({
			data: {
				...data,
				role: 'VIEWER' satisfies UserRole,
			},
			select: {
				id: true,
				name: true,
				email: true,
				passwordHash: true,
				role: true,
				createdAt: true,
			},
		});
	}
}
