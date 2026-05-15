import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { CreateRoleRequest, UpdateRoleRequest } from '../types/admin.types';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useRoles = () => {
  return useQuery({
    queryKey: queryKeys.admin.roles,
    queryFn: getRoles,
  });
};

export const usePermissionsAdmin = () => {
  return useQuery({
    queryKey: queryKeys.admin.permissions,
    queryFn: getPermissions,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      toast.success('Role created successfully');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      toast.success('Role updated successfully');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      toast.success('Role deleted');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
