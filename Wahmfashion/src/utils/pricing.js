export const getItemUnitPrice = (item) => {
  if (typeof item?.offerPrice === 'number' && item.offerPrice < item.price) {
    return item.offerPrice
  }

  return Number(item?.price) || 0
}

export const getItemLineTotal = (item) => {
  const quantity = Number(item?.quantity) || 0
  return getItemUnitPrice(item) * quantity
}

export const getCartSubtotal = (items = []) => {
  return items.reduce((sum, item) => sum + getItemLineTotal(item), 0)
}

export const calculateCouponDiscount = ({ coupon, items = [] }) => {
  if (!coupon || coupon.active === false) {
    return {
      discount: 0,
      eligibleSubtotal: 0,
      eligibleItems: 0,
      isApplicable: false,
    }
  }

  const appliesToAll = coupon.appliesToAll === true || !coupon.productId
  const eligibleItems = appliesToAll
    ? items
    : items.filter((item) => item.id === coupon.productId)
  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + getItemLineTotal(item),
    0
  )

  if (!eligibleSubtotal) {
    return {
      discount: 0,
      eligibleSubtotal,
      eligibleItems: 0,
      isApplicable: false,
    }
  }

  const rawDiscount =
    coupon.discountType === 'percentage'
      ? (eligibleSubtotal * (Number(coupon.discountValue) || 0)) / 100
      : Number(coupon.discountValue) || 0

  const maxDiscountAmount = Number(coupon.maxDiscountAmount)
  const cappedDiscount = Number.isFinite(maxDiscountAmount) && maxDiscountAmount > 0
    ? Math.min(rawDiscount, maxDiscountAmount)
    : rawDiscount

  return {
    discount: Math.min(eligibleSubtotal, cappedDiscount),
    eligibleSubtotal,
    eligibleItems: eligibleItems.length,
    isApplicable: true,
  }
}

export const calculateOrderTotals = ({
  items = [],
  charges = {},
  coupon = null,
}) => {
  const subtotal = getCartSubtotal(items)
  const couponBreakdown = calculateCouponDiscount({ coupon, items })
  const discountedSubtotal = Math.max(0, subtotal - couponBreakdown.discount)
  const taxPercentage = Number(charges.taxPercentage) || 0
  const shippingCharge = Number(charges.shippingCharge) || 0
  const platformCharge = Number(charges.platformCharge) || 0
  const taxAmount = (discountedSubtotal * taxPercentage) / 100
  const total = discountedSubtotal + taxAmount + shippingCharge + platformCharge

  return {
    subtotal,
    discountedSubtotal,
    taxPercentage,
    taxAmount,
    shippingCharge,
    platformCharge,
    coupon: couponBreakdown,
    total,
  }
}
