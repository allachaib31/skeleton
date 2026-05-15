export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    sessions: ['auth', 'sessions'] as const,
  },
  users: {
    list: ['users', 'list'] as const,
    byId: (id: string) => ['users', id] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    users: ['admin', 'users'] as const,
    roles: ['admin', 'roles'] as const,
    permissions: ['admin', 'permissions'] as const,
    auditLogs: ['admin', 'audit-logs'] as const,
    sessions: ['admin', 'sessions'] as const,
    uploads: ['admin', 'uploads'] as const,
    health: ['admin', 'health'] as const,
    metrics: ['admin', 'metrics'] as const,
    languages: ['admin', 'languages'] as const,
  },
  i18n: {
    languages: ['i18n', 'languages'] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
