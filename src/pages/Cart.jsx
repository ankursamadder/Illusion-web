import { useNavigate } from 'react-router-dom'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import useCartStore from '../hooks/useCartStore'
import { formatCurrency } from '../utils/formatCurrency'

const Cart = () => {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, getTotal, clear } = useCartStore()
  const total = getTotal()

  return (
    <PageShell title="Cart" subtitle="Review your selected items.">
      {items.length ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-illusion-blush/40">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
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
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    label="Qty"
                    className="w-24"
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.id, Number(event.target.value))
                    }
                    min={1}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-illusion-black/10"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-illusion-black">
              Order Summary
            </h3>
            <div className="flex items-center justify-between text-sm text-illusion-black/70">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-illusion-black/70">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-illusion-black">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => navigate('/checkout')}>Checkout</Button>
              <Button variant="secondary" onClick={clear}>
                Clear cart
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          Your cart is empty.
        </Card>
      )}
    </PageShell>
  )
}

export default Cart
