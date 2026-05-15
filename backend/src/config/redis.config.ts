import Redis from 'ioredis';
import { env } from './env.config';
import { logger } from '../common/utils/logger';

const memoryStore = new Map<string, string>();
const isTest = env.NODE_ENV === 'test';

const testRedis = {
  status: 'ready',
  get: async (key: string) => memoryStore.get(key) ?? null,
  set: async (key: string, value: string) => {
    memoryStore.set(key, value);
    return 'OK';
  },
  del: async (key: string) => {
    const existed = memoryStore.delete(key);
    return existed ? 1 : 0;
  },
  flushdb: async () => {
    memoryStore.clear();
    return 'OK';
  },
  quit: async () => {
    memoryStore.clear();
    return 'OK';
  },
  disconnect: () => {
    memoryStore.clear();
  },
  call: async (command: string, ...args: string[]) => {
    const normalized = command.toLowerCase();
    if (normalized === 'get') return testRedis.get(args[0]);
    if (normalized === 'set') return testRedis.set(args[0], args[1]);
    if (normalized === 'del') return testRedis.del(args[0]);
    return null;
  },
};

export const redis = isTest ? testRedis as unknown as Redis : new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

if (!isTest) {
  redis.on('connect', () => {
    logger.info('✅ Successfully connected to Redis');
  });

  redis.on('error', (err) => {
    logger.error('❌ Redis connection error:', err.message);
  });
}

export const redisSet = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
  const stringValue = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, stringValue, 'EX', ttlSeconds);
  } else {
    await redis.set(key, stringValue);
  }
};

export const redisGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as unknown as T;
  }
};

export const redisDel = async (key: string): Promise<void> => {
  await redis.del(key);
};
