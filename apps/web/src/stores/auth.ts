import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User | null, accessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined' && accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        set({ user, accessToken });
      },
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },
    }),
    { name: 'qbms-auth' }
  )
);
