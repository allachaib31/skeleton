import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUploads, deleteUpload } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';

export const useAdminUploads = (params: any) => {
  return useQuery({
    queryKey: [queryKeys.admin.uploads, params],
    queryFn: () => getUploads(params),
  });
};

export const useDeleteUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUpload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.uploads });
      toast.success('Upload deleted');
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
