import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAvatar } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Avatar updated successfully');
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });
};
