import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        if (!product?.id) return
        const existing = get().items.find((item) => item.id === product.id)
        if (existing) {
          set({
            items: get().items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
          return
        }

        set({
          items: [
            ...get().items,
            {
              id: product.id,
              name: product.name,
              price: product.price ?? 0,
              offerPrice: product.offerPrice ?? null,
              image: product.image ?? product.images?.[0]?.url ?? product.images?.[0],
              quantity,
            },
          ],
        })
      },
      removeItem: (id) =>
        set({ items: get().items.filter((item) => item.id !== id) }),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== id) })
          return
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })
      },
      clear: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((sum, item) => {
          const price =
            typeof item.offerPrice === 'number' && item.offerPrice < item.price
              ? item.offerPrice
              : item.price
          return sum + price * item.quantity
        }, 0),
    }),
    {
      name: 'illusion_cart',
      version: 1,
    }
  )
)

export default useCartStore
