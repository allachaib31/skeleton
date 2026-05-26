import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { useAuthStore } from '../stores/auth.store';
import { disableTwoFactor, enableTwoFactor, setupTwoFactor, verifyTwoFactorLogin } from '../api/auth.api';

export const useVerifyTwoFactorLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (data: { twoFactorToken: string; code: string }) => verifyTwoFactorLogin(data),
    onSuccess: (response) => {
      login(response.data.user, response.data.accessToken);
      toast.success(t('auth.loginSuccess'));
      navigate('/shop/dashboard');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useSetupTwoFactor = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => setupTwoFactor(),
    onSuccess: () => toast.success(t('settings.twoFactorSetupStarted')),
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useEnableTwoFactor = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (code: string) => enableTwoFactor(code),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('settings.twoFactorEnabled'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useDisableTwoFactor = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: { currentPassword: string; code: string }) => disableTwoFactor(data),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('settings.twoFactorDisabled'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
