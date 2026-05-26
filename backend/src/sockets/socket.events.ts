import { getIO } from './socket.server';

export const NOTIFICATION_NEW = 'notification:new';
export const USER_ONLINE = 'user:online';
export const USER_OFFLINE = 'user:offline';
export const ADMIN_AUDIT_LOG = 'admin:audit-log';
export const UPLOAD_COMPLETED = 'upload:completed';
export const ORDER_UPDATED = 'order:updated';

export const emitToUser = (userId: string, event: string, data: any) => {
  const io = getIO();
  if (io) io.to(`user:${userId}`).emit(event, data);
};

export const emitToAdmins = (event: string, data: any) => {
  const io = getIO();
  if (io) io.to('role:admin').emit(event, data);
};

export const emitToAll = (event: string, data: any) => {
  const io = getIO();
  if (io) io.to('system:notifications').emit(event, data);
};
