import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { getUserById, updateUser } from '../services/userService'
import { getUserOrders } from '../services/orderService'
import { addReview, getUserReviews } from '../services/reviewService'
import { formatCurrency } from '../utils/formatCurrency'

const emptyAddress = {
  id: '',
  label: '',
  name: '',
  line1: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
}

const emptyReviewForm = {
  purchaseKey: '',
  rating: '5',
  comment: '',
}

const isSuccessfulOrder = (order) => {
  const status = String(order.status ?? '').toLowerCase()
  const paymentStatus = String(order.paymentStatus ?? '').toLowerCase()

  if (['paid', 'shipped', 'delivered'].includes(status)) return true
  if (paymentStatus === 'success') return true

  return false
}

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const Profile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [userReviews, setUserReviews] = useState([])
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [editingId, setEditingId] = useState(null)
  const [reviewForm, setReviewForm] = useState(emptyReviewForm)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      if (!user?.uid) return
      setLoading(true)
      try {
        const profile = await getUserById(user.uid)
        if (!mounted) return
        setProfileName(profile?.name ?? user.name ?? '')
        setAddresses(profile?.addresses ?? [])

        const [userOrders, reviews] = await Promise.all([
          getUserOrders(user.uid),
          getUserReviews(user.uid),
        ])

        if (!mounted) return
        setOrders(userOrders)
        setUserReviews(reviews)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [user])

  const handleSaveName = async () => {
    if (!user?.uid) return
    try {
      await updateUser(user.uid, { name: profileName })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update profile')
    }
  }

  const handleEditAddress = (address) => {
    setEditingId(address.id)
    setAddressForm(address)
  }

  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveAddress = async () => {
    if (!user?.uid) return
    if (!addressForm.name || !addressForm.line1) {
      toast.error('Add name and address line')
      return
    }

    const nextAddresses = editingId
      ? addresses.map((addr) =>
          addr.id === editingId ? { ...addressForm } : addr
        )
      : [
          ...addresses,
          {
            ...addressForm,
            id: `addr_${Date.now()}`,
          },
        ]

    try {
      await updateUser(user.uid, { addresses: nextAddresses })
      setAddresses(nextAddresses)
      setAddressForm(emptyAddress)
      setEditingId(null)
      toast.success(editingId ? 'Address updated' : 'Address added')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save address')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setAddressForm(emptyAddress)
  }

  const orderSummary = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total ?? 0,
      status: order.status ?? 'Placed',
      createdAt: order.createdAt,
    }))
  }, [orders])

  const successfulOrders = useMemo(
    () => orders.filter((order) => isSuccessfulOrder(order)),
    [orders]
  )

  const reviewEligiblePurchases = useMemo(() => {
    const purchaseMap = new Map()

    successfulOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : []
      items.forEach((item) => {
        const productId = item.id ?? null
        const productName = item.name ?? 'Purchased Item'
        const key = `${productId ?? 'no-id'}:${productName}`

        if (!purchaseMap.has(key)) {
          purchaseMap.set(key, {
            key,
            orderId: order.id,
            productId,
            productName,
          })
        }
      })
    })

    return Array.from(purchaseMap.values())
  }, [successfulOrders])

  useEffect(() => {
    if (!reviewEligiblePurchases.length) return
    if (reviewForm.purchaseKey) return

    setReviewForm((prev) => ({
      ...prev,
      purchaseKey: reviewEligiblePurchases[0].key,
    }))
  }, [reviewEligiblePurchases, reviewForm.purchaseKey])

  const handleSubmitReview = async (event) => {
    event.preventDefault()

    if (!user?.uid) return
    if (!reviewEligiblePurchases.length) {
      toast.error('Complete a successful order to add a review')
      return
    }

    const selectedPurchase = reviewEligiblePurchases.find(
      (item) => item.key === reviewForm.purchaseKey
    )

    if (!selectedPurchase) {
      toast.error('Please select a purchased product')
      return
    }

    const ratingValue = Number(reviewForm.rating)
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast.error('Rating must be between 1 and 5')
      return
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please write your review')
      return
    }

    setReviewSubmitting(true)
    try {
      await addReview({
        source: 'user',
        approved: false,
        userId: user.uid,
        userName: profileName || user.name || user.email || 'Customer',
        userEmail: user.email ?? '',
        orderId: selectedPurchase.orderId,
        productId: selectedPurchase.productId,
        productName: selectedPurchase.productName,
        rating: ratingValue,
        comment: reviewForm.comment.trim(),
      })

      const latestReviews = await getUserReviews(user.uid)
      setUserReviews(latestReviews)
      setReviewForm((prev) => ({ ...emptyReviewForm, purchaseKey: prev.purchaseKey }))
      toast.success('Review submitted for approval')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell title="Profile" subtitle="Loading your profile.">
        <Card className="text-sm text-illusion-black/60">Loading...</Card>
      </PageShell>
    )
  }

  return (
    <PageShell title="Profile" subtitle="Manage your account and orders.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">User info</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <Input label="Email" value={user?.email ?? ''} disabled />
            </div>
            <Button onClick={handleSaveName}>Save profile</Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Saved addresses</h2>
            <div className="space-y-3">
              {addresses.length ? (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-2xl border border-illusion-black/10 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditAddress(address)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-illusion-black/60">No saved addresses yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-illusion-black">
                {editingId ? 'Update address' : 'Add new address'}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Label"
                  value={addressForm.label}
                  onChange={(event) => handleAddressChange('label', event.target.value)}
                />
                <Input
                  label="Name"
                  value={addressForm.name}
                  onChange={(event) => handleAddressChange('name', event.target.value)}
                />
                <Input
                  label="Address"
                  value={addressForm.line1}
                  onChange={(event) => handleAddressChange('line1', event.target.value)}
                />
                <Input
                  label="City"
                  value={addressForm.city}
                  onChange={(event) => handleAddressChange('city', event.target.value)}
                />
                <Input
                  label="State"
                  value={addressForm.state}
                  onChange={(event) => handleAddressChange('state', event.target.value)}
                />
                <Input
                  label="ZIP"
                  value={addressForm.zip}
                  onChange={(event) => handleAddressChange('zip', event.target.value)}
                />
                <Input
                  label="Phone"
                  value={addressForm.phone}
                  onChange={(event) => handleAddressChange('phone', event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveAddress}>
                  {editingId ? 'Update address' : 'Add address'}
                </Button>
                {editingId ? (
                  <Button variant="secondary" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Order history</h2>
            {orderSummary.length ? (
              <div className="space-y-3">
                {orderSummary.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-illusion-black/10 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-illusion-black">
                        #{order.orderNumber ?? order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-illusion-black/50">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleString()
                          : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-illusion-black">
                        {formatCurrency(order.total)}
                      </p>
                      <Badge variant="soft">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-illusion-black/60">No orders yet.</p>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Write a review</h2>
            {reviewEligiblePurchases.length ? (
              <form className="space-y-3" onSubmit={handleSubmitReview}>
                <label className="flex w-full flex-col gap-2 text-sm">
                  <span className="font-medium text-illusion-black">Purchased product</span>
                  <select
                    className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                    value={reviewForm.purchaseKey}
                    onChange={(event) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        purchaseKey: event.target.value,
                      }))
                    }
                  >
                    {reviewEligiblePurchases.map((purchase) => (
                      <option key={purchase.key} value={purchase.key}>
                        {purchase.productName}
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  label="Rating (1-5)"
                  type="number"
                  min="1"
                  max="5"
                  value={reviewForm.rating}
                  onChange={(event) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      rating: event.target.value,
                    }))
                  }
                />

                <label className="flex w-full flex-col gap-2 text-sm">
                  <span className="font-medium text-illusion-black">Review</span>
                  <textarea
                    rows={4}
                    className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="Share your experience..."
                  />
                </label>

                <Button type="submit" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit review'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-illusion-black/60">
                Reviews unlock after at least one successful order.
              </p>
            )}

            <div className="space-y-2 border-t border-illusion-black/10 pt-3">
              <h3 className="text-sm font-semibold text-illusion-black">My reviews</h3>
              {userReviews.length ? (
                userReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-illusion-black/10 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-illusion-black">
                        {review.productName ?? 'General'}
                      </p>
                      <Badge variant={review.approved ? 'soft' : 'outline'}>
                        {review.approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-illusion-black/50">
                      {formatDate(review.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-illusion-black/70">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-illusion-black/60">No reviews submitted yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

export default Profile
