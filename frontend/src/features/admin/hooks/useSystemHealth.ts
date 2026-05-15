import { useQuery } from '@tanstack/react-query';
import { getSystemHealth, getSystemMetrics } from '../api/admin.api';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.admin.health,
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Every 30s
  });
};

export const useSystemMetrics = () => {
  return useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: getSystemMetrics,
    refetchInterval: 10000, // Every 10s for metrics
  });
};
