import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGarminStatus, disconnectGarmin, connectGarmin } from '../api/garmin';
import type { GarminCredentials } from '../api/garmin';

export const useGarminStatus = () => {
  return useQuery({
    queryKey: ['garmin', 'status'],
    queryFn: getGarminStatus,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000, 
  });
};

export const useConnectGarmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: GarminCredentials) => connectGarmin(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin', 'status'] });
    },
  });
};

export const useDisconnectGarmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: disconnectGarmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin', 'status'] });
    },
  });
};
