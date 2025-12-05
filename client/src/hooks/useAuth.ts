import { useMutation, useQuery } from '@tanstack/react-query';
import { register, login, getAllUsers } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { User } from '../utils/storage';

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      const user: User = { 
        userId: data.userId, 
        email: data.email, 
        role: data.role 
      };
      setAuth(user, data.accessToken, data.refreshToken);
    },
  });
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user: User = { 
        userId: data.userId, 
        email: data.email, 
        role: data.role 
      };
      setAuth(user, data.accessToken, data.refreshToken);
    },
  });
};

export const useUsers = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers(accessToken!),
    enabled: !!accessToken,
  });
};
