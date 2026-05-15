import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { AuditLogQuery } from '../types/admin.types';

export const useAuditLogs = (params: AuditLogQuery) => {
  return useQuery({
    queryKey: [queryKeys.admin.auditLogs, params],
    queryFn: () => getAuditLogs(params),
  });
};
