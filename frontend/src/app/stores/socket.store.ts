import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SocketState {
  isConnected: boolean;
  onlineUsers: string[];
}

interface SocketActions {
  setConnected: (val: boolean) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useSocketStore = create<SocketState & SocketActions>()(
  devtools(
    (set) => ({
      isConnected: false,
      onlineUsers: [],

      setConnected: (isConnected) => set({ isConnected }),
      addOnlineUser: (userId) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.includes(userId)
            ? state.onlineUsers
            : [...state.onlineUsers, userId],
        })),
      removeOnlineUser: (userId) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((id) => id !== userId),
        })),
    }),
    { name: 'socket-store' }
  )
);
