import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth.store';

interface PermissionRouteProps {
  children: ReactNode;
  permission: string;
}

export function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission =
    user?.role?.name === 'SUPER_ADMIN' ||
    user?.role?.permissions.some((item) => item.name === permission) === true;

  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
