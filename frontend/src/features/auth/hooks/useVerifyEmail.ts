import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { verifyEmail } from '../api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
    onSuccess: () => {
      toast.success('Email verified successfully. You can now log in.');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
