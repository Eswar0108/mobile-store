import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (!get().hasProduct(product.id)) {
          set((s) => ({ items: [...s.items, product] }));
        }
      },
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== productId) })),
      hasProduct: (productId) => get().items.some((i) => i.id === productId),
      clear: () => set({ items: [] }),
    }),
    { name: 'wishlist-store' }
  )
);
