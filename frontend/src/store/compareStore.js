import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COMPARE = 3;

export const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [], // product objects
      sessionId: crypto.randomUUID(),

      addItem: (product) => {
        const { items } = get();
        if (items.length >= MAX_COMPARE) return false;
        if (items.find((p) => p.id === product.id)) return true;
        set({ items: [...items, product] });
        return true;
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((p) => p.id !== productId) }));
      },

      clearAll: () => set({ items: [] }),

      isInCompare: (productId) => get().items.some((p) => p.id === productId),

      isFull: () => get().items.length >= MAX_COMPARE,
    }),
    { name: 'compare-storage' }
  )
);
