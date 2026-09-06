import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../shared/errors';
import { verifyToken } from '../shared/jwt';

export const authenticate = (request: Request, _response: Response, next: NextFunction): void => {
	const authorization = request.header('authorization');
	const [scheme, token] = authorization?.split(' ') ?? [];

	if (scheme !== 'Bearer' || !token) {
		next(new AppError(401, 'Authentication required'));
		return;
	}

	try {
		request.user = verifyToken(token);
		next();
	} catch {
		next(new AppError(401, 'Invalid or expired token'));
	}
};
