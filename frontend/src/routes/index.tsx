import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AdminLayout from '@/layouts/AdminLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ForbiddenPage from '@/pages/public/ForbiddenPage';
import { publicRoutes } from './public.routes';
import { authRoutes } from './auth.routes';
import { adminRoutes } from './admin.routes';
import { shopRoutes } from '@/features/shop/routes';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public Routes
      {
        element: <PublicLayout />,
        children: publicRoutes,
      },
      
      // Auth Routes
      {
        element: <AuthLayout />,
        children: authRoutes,
      },
      
      // Private Routes
      {
        path: '/app/*',
        element: <Navigate to="/shop/dashboard" replace />,
      },
      
      // Admin Routes
      {
        path: '/admin',
        element: (
          <ProtectedRoute>
            <PermissionRoute permission="admin.dashboard.read">
              <AdminLayout />
            </PermissionRoute>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          ...(adminRoutes[0].children ?? []),
        ],
      },
      
      // tafa3olcard marketplace (client-facing storefront)
      ...shopRoutes,

      // 403 Forbidden
      {
        path: '/403',
        element: <ForbiddenPage />,
      },
    ],
  },
]);
