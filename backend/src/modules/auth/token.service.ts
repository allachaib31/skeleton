import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.config';
import { redisGet, redisSet } from '../../config/redis.config';

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_ACCESS_SECRET!,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET!);
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const blacklistToken = async (jti: string, ttlSeconds: number): Promise<void> => {
  await redisSet(`blacklist:token:${jti}`, 'true', ttlSeconds);
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  const isBlacklisted = await redisGet<string>(`blacklist:token:${jti}`);
  return !!isBlacklisted;
};
