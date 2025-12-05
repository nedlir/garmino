import { create } from 'zustand';
import { saveTokens, clearTokens, saveUser, getTokens, getUser } from '../utils/storage';
import type { User } from '../utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const tokens = getTokens();
  const user = getUser();

  return {
    user: user,
    accessToken: tokens?.accessToken || null,
    refreshToken: tokens?.refreshToken || null,
    
    setAuth: (user: User, accessToken: string, refreshToken: string) => {
      saveTokens(accessToken, refreshToken);
      saveUser(user);
      set({ user, accessToken, refreshToken });
    },
    
    clearAuth: () => {
      clearTokens();
      set({ user: null, accessToken: null, refreshToken: null });
    },
    
    get isAuthenticated() {
      return !!get().accessToken;
    },
    
    get isAdmin() {
      return get().user?.role === 'admin';
    },
  };
});
