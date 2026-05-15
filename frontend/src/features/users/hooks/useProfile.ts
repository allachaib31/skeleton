import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });
};
