import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { revokeSession } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { useTranslation } from 'react-i18next';

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions });
      toast.success(t('sessions.revokeSuccess'));
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
