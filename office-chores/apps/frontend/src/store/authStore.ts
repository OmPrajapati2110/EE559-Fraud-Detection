import { create } from 'zustand';
import type { User } from '@office-chores/shared';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAdmin: boolean;
  setAuth: (accessToken: string, user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAdmin: false,

  setAuth: (accessToken, user) =>
    set({ accessToken, user, isAdmin: user.role === 'ADMIN' }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  logout: () =>
    set({ accessToken: null, user: null, isAdmin: false }),
}));
