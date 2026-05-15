import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPassword } from '../api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';
import { ResetPasswordRequest } from '../types/auth.types';

export const useResetPassword = (token: string) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPassword(token, data),
    onSuccess: () => {
      toast.success('Password reset successful. You can now log in with your new password.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
