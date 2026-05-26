import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/constants/queryKeys';
import { parseApiError } from '@/shared/lib/utils/errors';
import {
  addAdminProblemReportMessage,
  addProblemReportMessage,
  assignAdminProblemReport,
  closeProblemReport,
  createProblemReport,
  getAdminProblemReport,
  getAdminProblemReports,
  getProblemReport,
  getProblemReports,
  updateAdminProblemReportPriority,
  updateAdminProblemReportStatus,
} from './problem-reports.api';
import {
  AdminProblemReportMessageRequest,
  CreateProblemReportRequest,
  ProblemReportMessageRequest,
  ProblemReportPriority,
  ProblemReportQuery,
  ProblemReportStatus,
} from './problem-reports.types';

export const useProblemReports = (params: ProblemReportQuery) =>
  useQuery({
    queryKey: [...queryKeys.problemReports.list, params],
    queryFn: () => getProblemReports(params),
  });

export const useProblemReport = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.problemReports.byId(id) : ['problem-reports', 'empty'],
    queryFn: () => getProblemReport(id as string),
    enabled: Boolean(id),
  });

export const useCreateProblemReport = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: CreateProblemReportRequest) => createProblemReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.list });
      toast.success(t('problemReports.createSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useAddProblemReportMessage = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: ProblemReportMessageRequest) => addProblemReportMessage(id, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.problemReports.byId(id), response);
      queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.list });
      toast.success(t('problemReports.messageSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useCloseProblemReport = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => closeProblemReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.problemReports.list });
      toast.success(t('problemReports.closeSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useAdminProblemReports = (params: ProblemReportQuery) =>
  useQuery({
    queryKey: [...queryKeys.admin.problemReports, params],
    queryFn: () => getAdminProblemReports(params),
  });

export const useAdminProblemReport = (id?: string) =>
  useQuery({
    queryKey: id ? [...queryKeys.admin.problemReports, id] : [...queryKeys.admin.problemReports, 'empty'],
    queryFn: () => getAdminProblemReport(id as string),
    enabled: Boolean(id),
  });

export const useAddAdminProblemReportMessage = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: AdminProblemReportMessageRequest) => addAdminProblemReportMessage(id, payload),
    onSuccess: (response) => {
      queryClient.setQueryData([...queryKeys.admin.problemReports, id], response);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.problemReports, id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.problemReports });
      toast.success(t('problemReports.messageSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useAssignAdminProblemReport = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (assignedAdminId?: string) => assignAdminProblemReport(id, assignedAdminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.problemReports, id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.problemReports });
      toast.success(t('problemReports.assignSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateAdminProblemReportStatus = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { status: ProblemReportStatus; resolutionNote?: string }) =>
      updateAdminProblemReportStatus(id, payload.status, payload.resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.problemReports, id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.problemReports });
      toast.success(t('problemReports.statusSuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};

export const useUpdateAdminProblemReportPriority = (id: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (priority: ProblemReportPriority) => updateAdminProblemReportPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.problemReports, id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.problemReports });
      toast.success(t('problemReports.prioritySuccess'));
    },
    onError: (error) => toast.error(parseApiError(error)),
  });
};
