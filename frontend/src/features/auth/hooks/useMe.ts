import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useMe = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    enabled: isAuthenticated,
    retry: false,
    staleTime: Infinity, // User info doesn't change often
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error && parseApiError(query.error)) {
      const error = query.error as any;
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [query.error, logout]);

  return query;
};
