import { create } from 'zustand';
import { saveTokens, clearTokens, saveUser, getTokens, getUser } from '../utils/storage';
import type { User } from '../utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const tokens = getTokens();
  const user = getUser();

  return {
    user: user,
    accessToken: tokens?.accessToken || null,
    refreshToken: tokens?.refreshToken || null,
    isAuthenticated: !!tokens?.accessToken,
    isAdmin: user?.role === 'admin',
    
    setAuth: (user: User, accessToken: string, refreshToken: string) => {
      saveTokens(accessToken, refreshToken);
      saveUser(user);
      set({ 
        user, 
        accessToken, 
        refreshToken,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
      });
    },
    
    clearAuth: () => {
      clearTokens();
      set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    },
  };
});
