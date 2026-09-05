import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';

import { AppError } from '../shared/errors';

export const authorize = (role: UserRole) =>
	(request: Request, _response: Response, next: NextFunction): void => {
		if (!request.user) {
			next(new AppError(401, 'Authentication required'));
			return;
		}

		if (request.user.role !== role) {
			next(new AppError(403, 'Insufficient permissions'));
			return;
		}

		next();
	};
