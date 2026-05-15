import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import {
  downloadLanguageTemplate,
  getAdminLanguages,
  getLanguages,
  uploadLanguage,
  UploadLanguageRequest,
} from '../api/languages.api';

export const useLanguages = () => {
  return useQuery({
    queryKey: queryKeys.i18n.languages,
    queryFn: getLanguages,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminLanguages = () => {
  return useQuery({
    queryKey: queryKeys.admin.languages,
    queryFn: getAdminLanguages,
  });
};

export const useUploadLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadLanguageRequest) => uploadLanguage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.languages });
      queryClient.invalidateQueries({ queryKey: queryKeys.i18n.languages });
      toast.success('Language uploaded successfully');
    },
  });
};

export const useDownloadLanguageTemplate = () => {
  return useMutation({
    mutationFn: downloadLanguageTemplate,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'language-template.en.json';
      link.click();
      URL.revokeObjectURL(url);
    },
  });
};
