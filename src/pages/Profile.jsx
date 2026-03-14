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

const Profile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [editingId, setEditingId] = useState(null)

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
        const userOrders = await getUserOrders(user.uid)
        if (!mounted) return
        setOrders(userOrders)
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
      total: order.total ?? 0,
      status: order.status ?? 'Pending',
      createdAt: order.createdAt,
    }))
  }, [orders])

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
            <h2 className="text-lg font-semibold text-illusion-black">
              User info
            </h2>
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
            <h2 className="text-lg font-semibold text-illusion-black">
              Saved addresses
            </h2>
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
                <p className="text-sm text-illusion-black/60">
                  No saved addresses yet.
                </p>
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
                  onChange={(event) =>
                    handleAddressChange('label', event.target.value)
                  }
                />
                <Input
                  label="Name"
                  value={addressForm.name}
                  onChange={(event) =>
                    handleAddressChange('name', event.target.value)
                  }
                />
                <Input
                  label="Address"
                  value={addressForm.line1}
                  onChange={(event) =>
                    handleAddressChange('line1', event.target.value)
                  }
                />
                <Input
                  label="City"
                  value={addressForm.city}
                  onChange={(event) =>
                    handleAddressChange('city', event.target.value)
                  }
                />
                <Input
                  label="State"
                  value={addressForm.state}
                  onChange={(event) =>
                    handleAddressChange('state', event.target.value)
                  }
                />
                <Input
                  label="ZIP"
                  value={addressForm.zip}
                  onChange={(event) =>
                    handleAddressChange('zip', event.target.value)
                  }
                />
                <Input
                  label="Phone"
                  value={addressForm.phone}
                  onChange={(event) =>
                    handleAddressChange('phone', event.target.value)
                  }
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
            <h2 className="text-lg font-semibold text-illusion-black">
              Order history
            </h2>
            {orderSummary.length ? (
              <div className="space-y-3">
                {orderSummary.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-illusion-black/10 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-illusion-black">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-illusion-black/50">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleString()
                          : '—'}
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
              <p className="text-sm text-illusion-black/60">
                No orders yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

export default Profile
