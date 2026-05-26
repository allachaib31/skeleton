import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { login } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { parseApiError } from '@/shared/lib/utils/errors';
import { LoginRequest } from '../types/auth.types';

export const useLogin = (options?: { onTwoFactorRequired?: (token: string) => void }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (response) => {
      if ('requiresTwoFactor' in response.data) {
        options?.onTwoFactorRequired?.(response.data.twoFactorToken);
        toast.info(t('auth.twoFactorRequired'));
        return;
      }

      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      toast.success(t('auth.loginSuccess'));
      navigate('/shop/dashboard');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
