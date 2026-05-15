import { ServerOptions } from 'socket.io';
import { env } from './env.config';

export const socketOptions: Partial<ServerOptions> = {
  cors: {
    origin: env.CLIENT_URLS.split(',').map((url) => url.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
};
