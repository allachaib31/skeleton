import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../common/errors/HttpError';
import { redisGet } from '../config/redis.config';

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        return next(HttpError.unauthorized('permissions.user_not_authenticated'));
      }

      // Check from req.user payload if directly attached in JWT
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        return next();
      }

      // Fallback check against Redis cache
      const cachedPermissions = await redisGet<string[]>(`permissions:${req.user.id}`);
      if (cachedPermissions && cachedPermissions.includes(permission)) {
        return next();
      }

      return next(HttpError.forbidden('permissions.permission_forbidden'));
    } catch (error) {
      next(error);
    }
  };
};
