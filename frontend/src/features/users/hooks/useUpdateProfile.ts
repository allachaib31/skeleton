import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfile, UpdateProfileRequest } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setUser(response.data);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
