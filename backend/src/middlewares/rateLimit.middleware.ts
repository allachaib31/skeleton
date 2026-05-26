import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.config';
import { Request, Response } from 'express';
import { sendError } from '../common/responses/api.response';
import { translate } from '../config/i18n.config';

const sendCommand = ((...args: string[]) =>
  redis.call(args[0], ...args.slice(1)) as unknown as Promise<any>) as any;

const createStore = (prefix: string) =>
  new RedisStore({
    sendCommand,
    prefix,
  });

const handler = (req: Request, res: Response, _next: any, options: any) => {
  sendError(res, translate(String(options.message), req.language), null, options.statusCode);
};

export const authRateLimit = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : createStore('rl:auth:'),
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: 'rateLimit.auth',
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const uploadRateLimit = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : createStore('rl:upload:'),
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per window
  message: 'rateLimit.upload',
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const paymentCodeRedeemRateLimit = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : createStore('rl:payment-code:'),
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: 'rateLimit.payment_code',
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
