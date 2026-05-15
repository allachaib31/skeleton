import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { register } from '../api/auth.api';
import { parseApiError } from '@/shared/lib/utils/errors';
import { RegisterRequest } from '../types/auth.types';

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: () => {
      toast.success('Registration successful. Please check your email to verify your account.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
