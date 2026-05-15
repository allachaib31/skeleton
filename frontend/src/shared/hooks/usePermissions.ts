import { useAuthStore } from '@/features/auth/stores/auth.store';

export function usePermissions(permissionName: string | string[]): boolean {
  const user = useAuthStore((state) => state.user);
  
  if (!user || !user.role) return false;
  
  // Super Admin bypass
  if (user.role.name === 'SUPER_ADMIN') return true;
  
  const requiredPermissions = Array.isArray(permissionName) ? permissionName : [permissionName];
  return requiredPermissions.every((requiredPermission) =>
    user.role.permissions.some((permission) => permission.name === requiredPermission)
  );
}
