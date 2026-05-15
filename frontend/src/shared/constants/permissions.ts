export const PERMISSIONS = {
  ADMIN: {
    DASHBOARD_READ: 'admin.dashboard.read',
    USERS_READ: 'admin.users.read',
    USERS_WRITE: 'admin.users.write',
    ROLES_READ: 'admin.roles.read',
    ROLES_WRITE: 'admin.roles.write',
    AUDIT_READ: 'admin.audit.read',
    UPLOADS_READ: 'admin.uploads.read',
    UPLOADS_WRITE: 'admin.uploads.write',
    SETTINGS_READ: 'admin.settings.read',
    SETTINGS_WRITE: 'admin.settings.write',
  },
  USERS: {
    PROFILE_READ: 'users.profile.read',
    PROFILE_WRITE: 'users.profile.write',
    SESSIONS_READ: 'users.sessions.read',
    SESSIONS_WRITE: 'users.sessions.write',
  },
};
