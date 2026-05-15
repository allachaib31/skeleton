import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUsers, updateUserStatus, updateUserRole, deleteUser } from '../api/admin.api';
import { useAdminUserById } from './useAdminUserById';
import { queryKeys } from '@/shared/constants/queryKeys';
import { UserStatus } from '../types/admin.types';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useAdminUsers = (params: any) => {
  return useQuery({
    queryKey: [queryKeys.admin.users, params],
    queryFn: () => getUsers(params),
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User status updated');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) => updateUserRole(id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User role updated');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User deleted');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export { useAdminUserById };
