import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) {}
        set({ user: null, accessToken: null });
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === 'ADMIN',
      isSalesperson: () => ['ADMIN', 'SALESPERSON'].includes(get().user?.role),
      isDeliveryAgent: () => ['ADMIN', 'DELIVERY_AGENT'].includes(get().user?.role),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
