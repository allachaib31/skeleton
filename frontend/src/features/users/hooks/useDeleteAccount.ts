import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteAccount } from '../api/users.api';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useDeleteAccount = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: (password: string) => deleteAccount(password),
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success('Your account has been deleted.');
      navigate('/');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
