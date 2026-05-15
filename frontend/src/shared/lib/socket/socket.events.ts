export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  ADMIN_AUDIT_LOG: 'admin:audit-log',
  UPLOAD_COMPLETED: 'upload:completed',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Event Payload Types
export interface UserPresencePayload {
  userId: string;
}

export interface NotificationPayload {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  createdAt: string;
}

export interface AuditLogPayload {
  _id: string;
  action: string;
  entity: string;
}
