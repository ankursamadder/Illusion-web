import Button from './ui/Button'
import Input from './ui/Input'
import { formatCurrency } from '../utils/formatCurrency'

const CouponPanel = ({
  coupon,
  couponInput,
  setCouponInput,
  couponLoading,
  couponBreakdown,
  onApply,
  onRemove,
}) => {
  return (
    <div className="space-y-3 rounded-2xl border border-illusion-black/10 bg-illusion-blush/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-illusion-black">Coupon Code</h3>
        </div>
        {coupon ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-illusion-black/60 transition hover:text-illusion-black"
          >
            Remove
          </button>
        ) : null}
      </div>

      {!coupon ? (
        <div className="space-y-3">
          <Input
            placeholder="e.g. RING10"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
            aria-label="Coupon code"
          />
          <Button
            type="button"
            onClick={onApply}
            disabled={couponLoading}
            className="w-full"
          >
            {couponLoading ? 'Applying...' : 'Apply Coupon'}
          </Button>
        </div>
      ) : null}

      {coupon ? (
        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-illusion-black/70 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {coupon.code} on {coupon.appliesToAll ? 'All Products' : coupon.productName}
            </span>
            <span className="font-semibold text-illusion-black">
              -{formatCurrency(couponBreakdown.discount)}
            </span>
          </div>
          {couponBreakdown.isApplicable ? (
            <p className="mt-1 text-xs text-illusion-black/55">
              Discount applied on eligible subtotal of{' '}
              {formatCurrency(couponBreakdown.eligibleSubtotal)}.
            </p>
          ) : (
            <p className="mt-1 text-xs text-red-500">
              This coupon currently does not match items in your cart.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default CouponPanel
