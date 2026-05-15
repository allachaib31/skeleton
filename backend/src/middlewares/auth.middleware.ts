import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { redisGet } from '../config/redis.config';
import { HttpError } from '../common/errors/HttpError';

interface JwtPayload {
  userId: string;
  role: string;
  jti?: string;
  permissions?: string[];
  [key: string]: unknown;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(HttpError.unauthorized('errors.no_token'));
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    
    // Check if token has jti and is blacklisted
    if (decoded.jti) {
      const isBlacklisted = await redisGet<boolean>(`blacklist:token:${decoded.jti}`);
      if (isBlacklisted) {
        return next(HttpError.unauthorized('errors.token_blacklisted'));
      }
    }

    // Attach user to req
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
    
    next();
  } catch (error) {
    next(HttpError.unauthorized('auth.token_invalid_or_expired'));
  }
};
