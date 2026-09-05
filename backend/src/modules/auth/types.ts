import type { UserRole } from '@prisma/client';

export type PublicUser = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	createdAt: Date;
};

export type AuthResponse = {
	user: PublicUser;
	token: string;
};
