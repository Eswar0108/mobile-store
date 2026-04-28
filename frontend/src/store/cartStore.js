import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Guest cart persisted in localStorage; merged to DB on login
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      discountAmount: 0,

      addItem: (product, quantity = 1, colorVariant = null) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.id && i.colorVariant === colorVariant
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id && i.colorVariant === colorVariant
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                product,
                quantity,
                colorVariant,
                unitPrice: product.discountPrice || product.price,
              },
            ],
          };
        });
      },

      removeItem: (productId, colorVariant = null) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.colorVariant === colorVariant)
          ),
        }));
      },

      updateQuantity: (productId, colorVariant, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.colorVariant === colorVariant
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      setCoupon: (coupon, discountAmount) => set({ coupon, discountAmount }),
      clearCoupon: () => set({ coupon: null, discountAmount: 0 }),
      clearCart: () => set({ items: [], coupon: null, discountAmount: 0 }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discountAmount;
        const afterDiscount = Math.max(0, subtotal - discount);
        const gst = afterDiscount * 0.18;
        return { subtotal, discount, gst: parseFloat(gst.toFixed(2)), total: parseFloat((afterDiscount + gst).toFixed(2)) };
      },

      getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
