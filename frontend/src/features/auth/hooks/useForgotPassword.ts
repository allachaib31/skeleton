import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { forgotPassword } from '../api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';
import { ForgotPasswordRequest } from '../types/auth.types';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPassword(data),
    onSuccess: () => {
      toast.success('If that email exists, you will receive a reset link shortly.');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
