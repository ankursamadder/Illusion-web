import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CouponPanel from '../components/CouponPanel'
import useCartStore from '../hooks/useCartStore'
import useAppliedCoupon from '../hooks/useAppliedCoupon'
import useCheckoutCharges from '../hooks/useCheckoutCharges'
import BlurImage from '../components/ui/BlurImage'
import { formatCurrency } from '../utils/formatCurrency'
import {
  calculateOrderTotals,
  getItemLineTotal,
  getItemUnitPrice,
} from '../utils/pricing'

const Cart = () => {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, getTotal, clear } = useCartStore()
  const { charges, chargesLoading } = useCheckoutCharges()
  const {
    coupon,
    couponInput,
    setCouponInput,
    couponLoading,
    couponBreakdown,
    applyCoupon,
    removeCoupon,
  } = useAppliedCoupon(items)

  const totals = useMemo(() => {
    return calculateOrderTotals({
      items,
      charges,
      coupon,
    })
  }, [charges, coupon, items])

  const subtotal = getTotal()

  return (
    <PageShell title="Cart" subtitle="Review your selected items.">
      {items.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="rounded-3xl border border-illusion-black/10 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-illusion-blush/40">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-illusion-black">
                      {item.name}
                    </h3>
                    <p className="text-sm text-illusion-black/60">
                      {formatCurrency(getItemUnitPrice(item))} each
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-illusion-black/60">
                        Qty
                      </span>
                      <input
                        type="number"
                        className="w-24 rounded-2xl border border-illusion-black/10 bg-white px-3 py-2 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(item.id, Number(event.target.value))
                        }
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3 md:flex-col md:items-end">
                    <p className="text-lg font-semibold text-illusion-black">
                      {formatCurrency(getItemLineTotal(item))}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-illusion-black/10"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-illusion-black">
              Order Summary
            </h3>
            <CouponPanel
              coupon={coupon}
              couponInput={couponInput}
              setCouponInput={setCouponInput}
              couponLoading={couponLoading}
              couponBreakdown={couponBreakdown}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />
            <div className="flex items-center justify-between text-sm text-illusion-black/70">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totals.coupon.discount > 0 ? (
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(totals.coupon.discount)}</span>
              </div>
            ) : null}
            {totals.taxAmount > 0 ? (
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Tax ({totals.taxPercentage}%)</span>
                <span>
                  {chargesLoading ? 'Loading...' : formatCurrency(totals.taxAmount)}
                </span>
              </div>
            ) : null}
            {totals.shippingCharge > 0 ? (
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Shipping</span>
                <span>
                  {chargesLoading ? 'Loading...' : formatCurrency(totals.shippingCharge)}
                </span>
              </div>
            ) : null}
            {totals.platformCharge > 0 ? (
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Platform</span>
                <span>
                  {chargesLoading ? 'Loading...' : formatCurrency(totals.platformCharge)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-base font-semibold text-illusion-black">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
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
