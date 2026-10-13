import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import BlurImage from '../components/ui/BlurImage'
import useWishlistStore from '../hooks/useWishlistStore'
import useCartStore from '../hooks/useCartStore'
import { formatCurrency } from '../utils/formatCurrency'

const Wishlist = () => {
  const { items, removeProduct, clear } = useWishlistStore()
  const { addItem } = useCartStore()

  return (
    <PageShell title="Wishlist" subtitle="Saved items for later.">
      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-illusion-blush/40">
                {item.image ? (
                  <BlurImage
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    wrapperClassName="h-full w-full"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-illusion-black">
                  {item.name}
                </h3>
                <p className="text-sm text-illusion-black/60">
                  {formatCurrency(
                    typeof item.offerPrice === 'number' &&
                      item.offerPrice < item.price
                      ? item.offerPrice
                      : item.price
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => addItem(item)}>
                  Add to cart
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-illusion-black/10"
                  onClick={() => removeProduct(item.id)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
          <Button variant="secondary" onClick={clear}>
            Clear wishlist
          </Button>
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          Your wishlist is empty.
        </Card>
      )}
    </PageShell>
  )
}

export default Wishlist
