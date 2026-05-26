import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth.store';

const ShopAuthPage = lazy(() => import('@/features/shop/pages/AuthPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

// Helper to redirect if already authenticated
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/shop/dashboard" replace />;
  return <>{children}</>;
};

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <AuthGuard><ShopAuthPage initial="login" /></AuthGuard>
  },
  { path: '/register', element: <AuthGuard><ShopAuthPage initial="register" /></AuthGuard> },
  { path: '/forgot-password', element: <AuthGuard><ForgotPasswordPage /></AuthGuard> },
  { path: '/reset-password', element: <AuthGuard><ResetPasswordPage /></AuthGuard> },
  { path: '/verify-email', element: <AuthGuard><VerifyEmailPage /></AuthGuard> },
];
