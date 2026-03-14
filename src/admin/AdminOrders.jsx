import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Truck,
  XCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { getOrders, updateOrder } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const statusOptions = [
  'Pending',
  'Paid',
  'Shipped',
  'Delivered',
  'Cancelled',
]

const statusIcons = {
  Pending: Clock,
  Paid: CreditCard,
  Shipped: Truck,
  Delivered: PackageCheck,
  Cancelled: XCircle,
}

const formatDate = (value) => {
  if (!value) return '—'
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const OrderCard = ({ order, onSaveStatus }) => {
  const [status, setStatus] = useState(order.status ?? 'Pending')
  const [carrier, setCarrier] = useState(order.shipment?.carrier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(
    order.shipment?.trackingNumber ?? ''
  )
  const [eta, setEta] = useState(order.shipment?.eta ?? '')
  const StatusIcon = statusIcons[status] || CheckCircle2

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
            Order
          </p>
          <h3 className="text-lg font-semibold text-illusion-black">
            #{order.id?.slice(0, 8)}
          </h3>
          <p className="text-sm text-illusion-black/60">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={status === 'Cancelled' ? 'outline' : 'soft'}>
          <span className="inline-flex items-center gap-2">
            <StatusIcon className="h-3 w-3" />
            {status}
          </span>
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
            Customer
          </p>
          <p className="text-sm text-illusion-black">
            {order.customerName ?? order.email ?? '—'}
          </p>
          <p className="text-xs text-illusion-black/60">
            {order.email ?? 'No email provided'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
            Total
          </p>
          <p className="text-sm text-illusion-black">
            {order.total ? formatCurrency(order.total) : '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-2 block font-medium text-illusion-black">
            Status
          </span>
          <select
            className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Shipment ETA"
          placeholder="e.g. 22 Mar 2026"
          value={eta}
          onChange={(event) => setEta(event.target.value)}
        />
        <Input
          label="Carrier"
          placeholder="e.g. Blue Dart"
          value={carrier}
          onChange={(event) => setCarrier(event.target.value)}
        />
        <Input
          label="Tracking Number"
          placeholder="Tracking ID"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          onClick={() =>
            onSaveStatus(order.id, {
              status,
              shipment: {
                carrier,
                trackingNumber,
                eta,
              },
            })
          }
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onSaveStatus(order.id, {
              status: 'Cancelled',
            })
          }
          disabled={status === 'Cancelled' || status === 'Delivered'}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Cancel Order
        </Button>
      </div>
    </Card>
  )
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleSave = async (id, payload) => {
    try {
      await updateOrder(id, payload)
      toast.success('Order updated')
      await loadOrders()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update order')
    }
  }

  return (
    <AdminLayout
      title="Manage Orders"
      subtitle="Track and update order progress."
    >
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading orders...</Card>
      ) : orders.length ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onSaveStatus={handleSave}
            />
          ))}
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          No orders yet.
        </Card>
      )}
    </AdminLayout>
  )
}

export default AdminOrders
