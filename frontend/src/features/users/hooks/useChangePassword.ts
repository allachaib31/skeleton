import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword } from '@/features/auth/api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';
import { ChangePasswordRequest } from '@/features/auth/types/auth.types';
import { useTranslation } from 'react-i18next';

export const useChangePassword = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
    onSuccess: () => {
      toast.success(t('profile.passwordChangeSuccess'));
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
