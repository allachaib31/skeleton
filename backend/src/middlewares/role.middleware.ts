import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../common/errors/HttpError';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      return next(HttpError.unauthorized('permissions.user_not_authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(HttpError.forbidden('permissions.role_forbidden'));
    }

    next();
  };
};
