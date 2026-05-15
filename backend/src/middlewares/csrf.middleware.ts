import { NextFunction, Request, Response } from 'express';
import { isAllowedClientOrigin } from '../config/security.config';
import { HttpError } from '../common/errors/HttpError';

const getRequestOrigin = (req: Request): string | undefined => {
  const origin = req.get('origin');
  if (origin) return origin;

  const referer = req.get('referer');
  if (!referer) return undefined;

  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
};

export const csrfOriginGuard = (req: Request, _res: Response, next: NextFunction): void => {
  const origin = getRequestOrigin(req);

  if (origin && !isAllowedClientOrigin(origin)) {
    return next(HttpError.forbidden('errors.request_origin_not_allowed'));
  }

  next();
};
