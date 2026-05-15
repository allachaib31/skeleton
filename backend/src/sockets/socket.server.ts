import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../config/redis.config';
import { env } from '../config/env.config';
import { socketAuthMiddleware } from './socket.auth';
import { logger } from '../common/utils/logger';
import { USER_ONLINE, USER_OFFLINE } from './socket.events';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URLS?.split(',') || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket'],
    adapter: createAdapter(pubClient, subClient)
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    socket.join(`user:${user.userId}`);
    socket.join('system:notifications');

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      socket.join('role:admin');
    }

    io?.to('role:admin').emit(USER_ONLINE, { userId: user.userId, connectedAt: new Date() });

    socket.on('disconnect', () => {
      io?.to('role:admin').emit(USER_OFFLINE, { userId: user.userId, disconnectedAt: new Date() });
    });
  });

  logger.info('✅ Socket.IO initialized');
};

export const getIO = (): Server => {
  if (!io) {
    if (env.NODE_ENV !== 'test') {
      logger.warn('Socket.IO is not initialized yet');
    }
  }
  return io!;
};
