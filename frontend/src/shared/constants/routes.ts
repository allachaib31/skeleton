export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },
  SHOP: {
    DASHBOARD: '/shop/dashboard',
    PROFILE: '/shop/profile',
    WALLET: '/shop/wallet',
    ORDERS: '/shop/orders',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    AUDIT_LOGS: '/admin/audit-logs',
    UPLOADS: '/admin/uploads',
    LANGUAGES: '/admin/languages',
    SETTINGS: '/admin/settings',
  },
  ERRORS: {
    FORBIDDEN: '/403',
    NOT_FOUND: '/404',
  },
};
