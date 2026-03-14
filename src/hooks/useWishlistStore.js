import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      addProduct: (product) => {
        if (!product?.id) return
        const exists = get().items.some((item) => item.id === product.id)
        if (exists) return
        set({
          items: [
            ...get().items,
            {
              id: product.id,
              name: product.name,
              price: product.price ?? 0,
              offerPrice: product.offerPrice ?? null,
              image: product.image ?? product.images?.[0]?.url ?? product.images?.[0],
            },
          ],
        })
      },
      removeProduct: (id) =>
        set({ items: get().items.filter((item) => item.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'illusion_wishlist',
      version: 1,
    }
  )
)

export default useWishlistStore
