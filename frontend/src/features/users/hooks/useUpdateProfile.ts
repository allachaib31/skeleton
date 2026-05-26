import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfile, uploadAvatar, UpdateProfileRequest } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { parseApiError } from '@/shared/lib/utils/errors';
import { useTranslation } from 'react-i18next';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setUser(response.data);
      toast.success(t('profile.updateSuccess'));
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      if (user) {
        setUser({ ...user, avatar: response.data.avatarUrl });
      }
      toast.success(t('profile.avatarUpdateSuccess'));
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
