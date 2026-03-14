import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import useCartStore from '../hooks/useCartStore'
import { formatCurrency } from '../utils/formatCurrency'
import { useAuth } from '../context/AuthContext'
import { getUserById, updateUser } from '../services/userService'
import { createOrder, updateOrder } from '../services/orderService'
import { createRazorpayOrder, loadRazorpay } from '../services/razorpayService'

const steps = ['Address', 'Payment', 'Summary']

const paymentOptions = [
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'cod', label: 'Cash On Delivery' },
]

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, getTotal, clear } = useCartStore()
  const [step, setStep] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [addresses, setAddresses] = useState([])
  const [newAddress, setNewAddress] = useState({
    label: '',
    name: '',
    line1: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('upi')
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
        if (stored.length) setSelectedAddress(stored[0].id)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load addresses')
      }
    }

    loadAddresses()

    return () => {
      mounted = false
    }
  }, [user])

  const subtotal = getTotal()
  const total = subtotal

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(selectedAddress)
    if (step === 1) return Boolean(paymentMethod)
    return true
  }, [paymentMethod, selectedAddress, step])

  const handleNext = () => {
    if (!canContinue) return
    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.line1) {
      toast.error('Add at least name and address')
      return
    }
    const id = `addr_${Date.now()}`
    const next = { id, ...newAddress, label: newAddress.label || 'New' }
    const updated = [...addresses, next]
    setAddresses(updated)
    setSelectedAddress(id)
    setNewAddress({
      label: '',
      name: '',
      line1: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
    })

    if (user?.uid) {
      try {
        await updateUser(user.uid, { addresses: updated })
      } catch (error) {
        toast.error(error?.message ?? 'Failed to save address')
      }
    }
  }

  const handleConfirm = async () => {
    if (!items.length || !user) return
    setSubmitting(true)

    const address = addresses.find((item) => item.id === selectedAddress) ?? null
    const status = paymentMethod === 'cod' ? 'Pending' : 'Pending'

    try {
      const orderId = await createOrder({
        userId: user.uid,
        customerName: user.name ?? '',
        email: user.email ?? '',
        status,
        items,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'COD' : 'Initiated',
        address,
        shipment: {},
      })

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

      const amount = Math.round(total * 100)
      const razorpayOrder = await createRazorpayOrder({
        amount,
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
      })

      await updateOrder(orderId, {
        razorpayOrderId: razorpayOrder.orderId,
      })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? 'rzp_live_SQp4ME25cvdnl6',
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
          await updateOrder(orderId, {
            status: 'Paid',
            paymentStatus: 'Success',
            paymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
          })
          clear()
          toast.success('Payment successful')
          navigate('/orders')
        },
        modal: {
          ondismiss: async () => {
            await updateOrder(orderId, {
              paymentStatus: 'Cancelled',
            })
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', async (response) => {
        await updateOrder(orderId, {
          paymentStatus: 'Failed',
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
    <PageShell title="Checkout" subtitle="Complete your order in three steps.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((label, index) => (
            <div
              key={label}
              className={
                index <= step
                  ? 'rounded-full border border-illusion-black/10 bg-illusion-blush/60 px-4 py-2 text-sm font-medium text-illusion-black'
                  : 'rounded-full border border-illusion-black/10 bg-white px-4 py-2 text-sm text-illusion-black/50'
              }
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {addresses.length ? (
                addresses.map((address) => (
                  <Card key={address.id} className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="text-base font-semibold text-illusion-black">
                        {address.label}
                      </h3>
                      <p className="text-sm text-illusion-black/60">
                        {address.name}
                      </p>
                      <p className="text-sm text-illusion-black/60">
                        {address.line1}, {address.city}, {address.state}{' '}
                        {address.zip}
                      </p>
                      <p className="text-sm text-illusion-black/60">
                        {address.phone}
                      </p>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="text-sm text-illusion-black/60">
                  No saved addresses yet. Add one to continue.
                </Card>
              )}
            </div>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-illusion-black">
                Add new address
              </h3>
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
              <div className="grid gap-3 md:grid-cols-2">
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
          </div>
        ) : null}

        {step === 1 ? (
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-illusion-black">
              Payment options
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black/70"
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                  />
                  <span className="font-medium text-illusion-black">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {items.length ? (
                items.map((item) => (
                  <Card key={item.id} className="flex items-center gap-4">
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
                      <h3 className="text-base font-semibold text-illusion-black">
                        {item.name}
                      </h3>
                      <p className="text-sm text-illusion-black/60">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-illusion-black">
                      {formatCurrency(
                        (typeof item.offerPrice === 'number' &&
                        item.offerPrice < item.price
                          ? item.offerPrice
                          : item.price) * item.quantity
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="text-sm text-illusion-black/60">
                  Your cart is empty.
                </Card>
              )}
            </div>
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-illusion-black">
                Order summary
              </h3>
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-illusion-black">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </Card>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={!items.length || submitting}>
              Confirm order
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default Checkout
