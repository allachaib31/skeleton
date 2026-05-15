import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.config';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const socket: Socket = io(env.VITE_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
  auth: (cb) => {
    const token = useAuthStore.getState().accessToken;
    cb({ token });
  },
});

// For debugging
if (env.VITE_ENV === 'development') {
  socket.onAny((event, ...args) => {
    console.log(`[Socket Event] ${event}:`, args);
  });
}
