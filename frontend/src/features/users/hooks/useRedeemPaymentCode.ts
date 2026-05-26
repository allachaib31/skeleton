import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import { redeemPaymentCode } from '../api/users.api';

export const useRedeemPaymentCode = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (code: string) => redeemPaymentCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.auth.me, 'financial-movements'] });
      toast.success(t('runtime.paymentCodeRedeemSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
