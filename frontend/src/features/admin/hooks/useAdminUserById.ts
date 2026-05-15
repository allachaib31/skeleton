import { useQuery } from '@tanstack/react-query';
import { getUserById } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useAdminUserById = (id: string) => {
  return useQuery({
    queryKey: [queryKeys.admin.users, id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};
