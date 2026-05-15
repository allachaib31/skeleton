import { lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const DashboardPage = lazy(() => import('@/pages/user/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/user/SettingsPage'));
const NotificationsPage = lazy(() => import('@/pages/user/NotificationsPage'));
const SessionsPage = lazy(() => import('@/pages/user/SessionsPage'));

export const privateRoutes: RouteObject[] = [
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'sessions', element: <SessionsPage /> },
    ]
  },
];
