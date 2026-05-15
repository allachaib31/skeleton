import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
    onSettled: () => {
      // Ensure local state is cleared even if API call fails
      clearAuth();
      queryClient.clear();
      navigate('/login');
    }
  });
};
