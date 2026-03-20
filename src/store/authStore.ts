import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthStore {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  isAdmin: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));
