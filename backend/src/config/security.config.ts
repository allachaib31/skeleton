import rateLimit from 'express-rate-limit';
import { CorsOptions } from 'cors';
import type { HelmetOptions } from 'helmet';
import { env } from './env.config';
import { sendError } from '../common/responses/api.response';
import { translate } from './i18n.config';

const rateLimitHandler = (req: any, res: any, _next: any, options: any) => {
  sendError(res, translate(String(options.message), req.language), null, options.statusCode);
};

export const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'rateLimit.global',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login/register requests per hour
  message: 'rateLimit.auth',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const uploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: 'rateLimit.upload',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const getAllowedOrigins = () => env.CLIENT_URLS.split(',').map((url) => url.trim()).filter(Boolean);

export const isAllowedClientOrigin = (origin?: string): boolean => {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  const isLocalDevOrigin =
    env.NODE_ENV === 'development' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowWildcard = env.NODE_ENV !== 'production' && allowedOrigins.includes('*');

  return allowedOrigins.includes(origin) || allowWildcard || isLocalDevOrigin;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedClientOrigin(origin)) {
      return callback(null, true);
    }

    callback(new Error('errors.cors_not_allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
};

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy:
    env.NODE_ENV === 'production'
      ? {
          useDefaults: true,
          directives: {
            'default-src': ["'self'"],
            'base-uri': ["'self'"],
            'connect-src': ["'self'", ...getAllowedOrigins().filter((origin) => origin !== '*')],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'img-src': ["'self'", 'data:'],
            'object-src': ["'none'"],
            'script-src': ["'self'"],
            'style-src': ["'self'"],
          },
        }
      : false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: {
    policy: 'no-referrer',
  },
};
