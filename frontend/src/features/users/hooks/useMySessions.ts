import { useQuery } from '@tanstack/react-query';
import { getMyFinancialMovements, getMySessions, MyFinancialMovementsQuery } from '../api/users.api';
import { queryKeys } from '@/shared/constants/queryKeys';
import { getMyLevels } from '../api/users.api';

export const useMySessions = () => {
  return useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: getMySessions,
  });
};

export const useMyLevels = () => {
  return useQuery({
    queryKey: [...queryKeys.auth.me, 'levels'],
    queryFn: getMyLevels,
  });
};

export const useMyFinancialMovements = (params: MyFinancialMovementsQuery) => {
  return useQuery({
    queryKey: [...queryKeys.auth.me, 'financial-movements', params],
    queryFn: () => getMyFinancialMovements(params),
  });
};
