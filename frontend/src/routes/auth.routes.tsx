import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth.store';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

// Helper to redirect if already authenticated
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/app/profile" replace />;
  return <>{children}</>;
};

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <AuthGuard><LoginPage /></AuthGuard>
  },
  { path: '/register', element: <AuthGuard><RegisterPage /></AuthGuard> },
  { path: '/forgot-password', element: <AuthGuard><ForgotPasswordPage /></AuthGuard> },
  { path: '/reset-password', element: <AuthGuard><ResetPasswordPage /></AuthGuard> },
  { path: '/verify-email', element: <AuthGuard><VerifyEmailPage /></AuthGuard> },
];
