import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { parseApiError } from '@/shared/lib/utils/errors';
import { LoginRequest } from '../types/auth.types';

export const useLogin = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      toast.success('Successfully logged in');
      navigate('/app/profile');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
