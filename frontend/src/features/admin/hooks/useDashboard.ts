import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: getDashboard,
  });
};
