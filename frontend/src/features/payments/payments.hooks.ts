import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  approvePaymentRequest,
  createPaymentRequest,
  getAdminPaymentRequests,
  getMyPaymentRequests,
  getPaymentBanks,
  rejectPaymentRequest,
} from './payments.api';
import { CreatePaymentRequestRequest, PaymentRequestQuery } from './payments.types';

export const usePaymentBanks = () =>
  useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPaymentBanks,
  });

export const useMyPaymentRequests = (params: PaymentRequestQuery) =>
  useQuery({
    queryKey: ['payments', 'mine', params],
    queryFn: () => getMyPaymentRequests(params),
  });

export const useCreatePaymentRequest = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: CreatePaymentRequestRequest) => createPaymentRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useAdminPaymentRequests = (params: PaymentRequestQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.dashboard, 'payments', params],
    queryFn: () => getAdminPaymentRequests(params),
  });

export const useApprovePaymentRequest = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, adminComment }: { id: string; adminComment?: string }) => approvePaymentRequest(id, adminComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      toast.success(t('payments.approveSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useRejectPaymentRequest = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, adminComment }: { id: string; adminComment?: string }) => rejectPaymentRequest(id, adminComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      toast.success(t('payments.rejectSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
