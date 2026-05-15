import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword } from '@/features/auth/api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';
import { ChangePasswordRequest } from '@/features/auth/types/auth.types';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
    onSuccess: () => {
      toast.success('Password changed. Other sessions may be logged out.');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
