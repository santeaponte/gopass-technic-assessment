import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';

const authTokenPayloadSchema = z.object({
	userId: z.string().uuid(),
	role: z.enum(['ADMIN', 'VIEWER']),
});

export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;

export const signToken = (payload: AuthTokenPayload): string =>
	jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
	});

export const verifyToken = (token: string): AuthTokenPayload => {
	const decoded: string | JwtPayload = jwt.verify(token, env.JWT_SECRET);
	return authTokenPayloadSchema.parse(decoded);
};
