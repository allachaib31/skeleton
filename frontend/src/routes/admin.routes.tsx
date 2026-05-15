import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';

const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
const PermissionsPage = lazy(() => import('@/pages/admin/PermissionsPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const UploadsPage = lazy(() => import('@/pages/admin/UploadsPage'));
const LanguagesPage = lazy(() => import('@/pages/admin/LanguagesPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/PermissionsPage'));

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <PermissionRoute permission="admin.dashboard.read">
          {/* Layout will be added in main index */}
          <div /> 
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'permissions', element: <PermissionsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'uploads', element: <UploadsPage /> },
      { path: 'languages', element: <LanguagesPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ]
  },
];
