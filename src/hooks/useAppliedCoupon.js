import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useCartStore from './useCartStore'
import { getCouponByCode, normalizeCouponCode } from '../services/couponService'
import { calculateCouponDiscount } from '../utils/pricing'

const useAppliedCoupon = (items = []) => {
  const { couponCode, setCouponCode, clearCouponCode } = useCartStore()
  const [couponInput, setCouponInput] = useState(couponCode)
  const [couponLoading, setCouponLoading] = useState(false)
  const [coupon, setCoupon] = useState(null)

  useEffect(() => {
    setCouponInput(couponCode)
  }, [couponCode])

  useEffect(() => {
    let mounted = true

    const loadCoupon = async () => {
      if (!couponCode) {
        setCoupon(null)
        return
      }

      setCouponLoading(true)
      try {
        const couponItem = await getCouponByCode(couponCode)
        if (!mounted) return

        if (!couponItem || couponItem.active === false) {
          setCoupon(null)
          clearCouponCode()
          return
        }

        setCoupon(couponItem)
      } catch (error) {
        if (mounted) {
          setCoupon(null)
          toast.error(error?.message ?? 'Failed to load coupon')
        }
      } finally {
        if (mounted) setCouponLoading(false)
      }
    }

    loadCoupon()

    return () => {
      mounted = false
    }
  }, [clearCouponCode, couponCode])

  const couponBreakdown = useMemo(() => {
    return calculateCouponDiscount({ coupon, items })
  }, [coupon, items])

  const applyCoupon = async () => {
    const normalizedCode = normalizeCouponCode(couponInput)
    if (!normalizedCode) {
      toast.error('Enter a coupon code')
      return false
    }

    setCouponLoading(true)
    try {
      const couponItem = await getCouponByCode(normalizedCode)

      if (!couponItem || couponItem.active === false) {
        toast.error('Coupon code is invalid or inactive')
        return false
      }

      const nextBreakdown = calculateCouponDiscount({
        coupon: couponItem,
        items,
      })

      if (!nextBreakdown.isApplicable) {
        toast.error('This coupon does not apply to items in your cart')
        return false
      }

      setCoupon(couponItem)
      setCouponCode(normalizedCode)
      setCouponInput(normalizedCode)
      toast.success('Coupon applied')
      return true
    } catch (error) {
      toast.error(error?.message ?? 'Failed to apply coupon')
      return false
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    clearCouponCode()
    setCoupon(null)
    setCouponInput('')
    toast.success('Coupon removed')
  }

  return {
    coupon,
    couponCode,
    couponInput,
    setCouponInput,
    couponLoading,
    couponBreakdown,
    applyCoupon,
    removeCoupon,
  }
}

export default useAppliedCoupon
