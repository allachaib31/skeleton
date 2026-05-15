import { useQuery } from '@tanstack/react-query';
import { getMySessions } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useMySessions = () => {
  return useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: getMySessions,
  });
};
