import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { revokeSession } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions });
      toast.success('Session revoked');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
