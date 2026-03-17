import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CouponPanel from '../components/CouponPanel'
import useCartStore from '../hooks/useCartStore'
import useAppliedCoupon from '../hooks/useAppliedCoupon'
import useCheckoutCharges from '../hooks/useCheckoutCharges'
import { formatCurrency } from '../utils/formatCurrency'
import { calculateOrderTotals, getItemLineTotal } from '../utils/pricing'
import { useAuth } from '../context/AuthContext'
import { getUserById, updateUser } from '../services/userService'
import { createOrder, updateOrder } from '../services/orderService'
import {
  createRazorpayOrder,
  loadRazorpay,
  verifyRazorpayPayment,
} from '../services/razorpayService'

const paymentOptions = [
  {
    value: 'online',
    label: 'UPI / Card / Net Banking',
    helper: 'Secure online payment via Razorpay',
    icons: [
      { id: 'upi', label: 'UPI', icon: Banknote },
      { id: 'card', label: 'Card', icon: CreditCard },
      { id: 'net-banking', label: 'NetBanking', icon: Landmark },
    ],
  },
  {
    value: 'cod',
    label: 'Cash On Delivery',
    helper: 'Pay when your order is delivered',
    icons: [{ id: 'cod', label: 'COD', icon: Wallet }],
  },
]

const emptyAddressForm = {
  label: '',
  name: '',
  line1: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
}

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, clear } = useCartStore()
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

  const [selectedAddress, setSelectedAddress] = useState('')
  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddressForm)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadAddresses = async () => {
      if (!user?.uid) return
      try {
        const profile = await getUserById(user.uid)
        if (!mounted) return

        const stored = profile?.addresses ?? []
        setAddresses(stored)

        if (stored.length) {
          setSelectedAddress(stored[0].id)
          setShowAddressForm(false)
        } else {
          setShowAddressForm(true)
        }
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load addresses')
      }
    }

    loadAddresses()

    return () => {
      mounted = false
    }
  }, [user])

  const totals = useMemo(() => {
    return calculateOrderTotals({
      items,
      charges,
      coupon,
    })
  }, [charges, coupon, items])

  const subtotal = totals.subtotal
  const total = totals.total

  const canPlaceOrder = useMemo(() => {
    return (
      Boolean(selectedAddress) &&
      Boolean(paymentMethod) &&
      items.length > 0 &&
      !chargesLoading &&
      !couponLoading
    )
  }, [chargesLoading, couponLoading, items.length, paymentMethod, selectedAddress])

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.line1 || !newAddress.phone || !newAddress.zip) {
      toast.error('Please enter name, address, phone and PIN code')
      return
    }

    const id = `addr_${Date.now()}`
    const nextAddress = {
      id,
      ...newAddress,
      label: newAddress.label || 'Address',
    }
    const updated = [...addresses, nextAddress]

    setAddresses(updated)
    setSelectedAddress(id)
    setNewAddress(emptyAddressForm)
    setShowAddressForm(false)

    if (user?.uid) {
      try {
        await updateUser(user.uid, { addresses: updated })
        toast.success('Address saved')
      } catch (error) {
        toast.error(error?.message ?? 'Failed to save address')
      }
    }
  }

  const handleConfirm = async () => {
    if (!items.length || !user || !selectedAddress) return
    setSubmitting(true)

    const address = addresses.find((item) => item.id === selectedAddress) ?? null

    try {
      const createdOrder = await createOrder({
        userId: user.uid,
        customerName: user.name ?? '',
        email: user.email ?? '',
        status: paymentMethod === 'cod' ? 'Placed COD' : 'Initiated',
        items,
        subtotal,
        total,
        charges: {
          taxPercentage: totals.taxPercentage,
          taxAmount: totals.taxAmount,
          shippingCharge: totals.shippingCharge,
          platformCharge: totals.platformCharge,
        },
        coupon: coupon && totals.coupon.isApplicable
          ? {
              id: coupon.id,
              code: coupon.code,
              appliesToAll: coupon.appliesToAll === true,
              productId: coupon.productId,
              productName: coupon.productName,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              maxDiscountAmount: coupon.maxDiscountAmount,
              appliedDiscount: totals.coupon.discount,
            }
          : null,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'COD' : 'Initiated',
        address,
        shipment: {},
      })

      const orderId = createdOrder.id

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully')
        clear()
        navigate('/orders')
        return
      }

      const razorpayLoaded = await loadRazorpay()
      if (!razorpayLoaded) {
        throw new Error('Razorpay SDK failed to load')
      }

      const amount = Number(total.toFixed(2))
      const razorpayOrder = await createRazorpayOrder({
        amount,
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
      })

      await updateOrder(orderId, {
        razorpayOrderId: razorpayOrder.orderId,
      })

      const razorpayKeyId = razorpayOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        throw new Error('Missing Razorpay key id. Please set VITE_RAZORPAY_KEY_ID')
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Illusion',
        description: 'Jewellery order payment',
        order_id: razorpayOrder.orderId,
        prefill: {
          name: user.name ?? '',
          email: user.email ?? '',
          contact: address?.phone ?? '',
        },
        theme: {
          color: '#fcc8d9',
        },
        handler: async (response) => {
          try {
            const verification = await verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
              userId: user.uid,
              amount,
              currency: razorpayOrder.currency,
            })

            await updateOrder(orderId, {
              status: verification.status ?? 'Paid',
              paymentStatus: 'Success',
              initiatedReason: '',
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            })
            clear()
            toast.success('Payment successful')
            navigate('/orders')
          } catch (verifyError) {
            await updateOrder(orderId, {
              status: 'Initiated',
              paymentStatus: 'Failed',
              initiatedReason:
                verifyError?.message ?? 'Payment verification failed',
              paymentError: verifyError?.message ?? 'Payment verification failed',
            })
            toast.error(verifyError?.message ?? 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: async () => {
            await updateOrder(orderId, {
              status: 'Initiated',
              paymentStatus: 'Cancelled',
              initiatedReason: 'Customer closed the payment window',
            })
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', async (response) => {
        await updateOrder(orderId, {
          status: 'Initiated',
          paymentStatus: 'Failed',
          initiatedReason: response.error?.description ?? 'Payment failed',
          paymentError: response.error?.description ?? 'Payment failed',
        })
        toast.error('Payment failed')
      })
      razorpay.open()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Checkout" subtitle="Select address and payment to place your order.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-illusion-black">Delivery Address</h2>
              {addresses.length ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAddressForm((prev) => !prev)}
                >
                  {showAddressForm ? 'Cancel' : 'Add New Address'}
                </Button>
              ) : null}
            </div>

            {addresses.length ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-illusion-black/10 bg-white p-4"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-illusion-black">
                        {address.label || 'Address'}
                      </p>
                      <p className="text-sm text-illusion-black/60">{address.name}</p>
                      <p className="text-sm text-illusion-black/60">
                        {address.line1}, {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-sm text-illusion-black/60">{address.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-illusion-black/20 bg-illusion-blush/20 px-4 py-3 text-sm text-illusion-black/70">
                No saved address found. Please enter your address to continue.
              </p>
            )}
          </Card>

          {(!addresses.length || showAddressForm) ? (
            <Card className="space-y-4">
              <h3 className="text-base font-semibold text-illusion-black">
                {addresses.length ? 'Add New Address' : 'Enter Address'}
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Label"
                  value={newAddress.label}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Home, Office"
                />
                <Input
                  label="Name"
                  value={newAddress.name}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  label="Address"
                  value={newAddress.line1}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, line1: event.target.value }))
                  }
                />
                <Input
                  label="City"
                  value={newAddress.city}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
                <Input
                  label="State"
                  value={newAddress.state}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, state: event.target.value }))
                  }
                />
                <Input
                  label="PIN Code"
                  value={newAddress.zip}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, zip: event.target.value }))
                  }
                />
                <Input
                  label="Phone"
                  value={newAddress.phone}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </div>

              <Button variant="secondary" onClick={handleAddAddress}>
                Save Address
              </Button>
            </Card>
          ) : null}

          <Card className="space-y-3">
            <h3 className="text-base font-semibold text-illusion-black">Order Items</h3>
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-illusion-black/10 bg-white p-3"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-illusion-blush/40">
                    {item.image ? (
                      <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-illusion-black">{item.name}</p>
                    <p className="text-xs text-illusion-black/55">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-illusion-black">
                    {formatCurrency(getItemLineTotal(item))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-illusion-black/60">Your cart is empty.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Payment Option</h2>
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-illusion-black/10 bg-white px-4 py-3"
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                    className="mt-1"
                  />
                  <div className="w-full space-y-2">
                    <p className="text-sm font-medium text-illusion-black">{option.label}</p>
                    <p className="text-xs text-illusion-black/55">{option.helper}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.icons.map((item) => {
                        const Icon = item.icon
                        return (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-illusion-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-illusion-black/70"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Order Summary</h2>
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
              <span>Items</span>
              <span>{items.length}</span>
            </div>
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
            <div className="flex items-center justify-between border-t border-illusion-black/10 pt-3 text-base font-semibold text-illusion-black">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {!selectedAddress ? (
              <p className="text-xs text-red-500">Please select or add an address first.</p>
            ) : null}

            <Button className="w-full" onClick={handleConfirm} disabled={!canPlaceOrder || submitting}>
              {submitting ? 'Processing...' : 'Place Order'}
            </Button>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

export default Checkout
