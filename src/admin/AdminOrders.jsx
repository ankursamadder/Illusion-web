import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2, XCircle } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/StatusBadge'
import { deleteOrder, getOrders, updateOrder } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const statusOptions = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const OrderRow = ({ order, onDeleteOrder, onSaveStatus }) => {
  const [status, setStatus] = useState(order.status ?? 'Pending')

  return (
    <tr className="border-b border-illusion-black/10 align-top">
      <td className="px-3 py-4 text-sm font-semibold text-illusion-black">
        #{order.id?.slice(0, 8)}
      </td>
      <td className="px-3 py-4 text-sm text-illusion-black">
        <p className="font-medium">{order.customerName ?? '-'}</p>
        <p className="text-xs text-illusion-black/60">{order.email ?? '-'}</p>
      </td>
      <td className="px-3 py-4 text-sm text-illusion-black">
        {formatCurrency(order.total ?? 0)}
      </td>
      <td className="px-3 py-4">
        <StatusBadge status={status} />
      </td>
      <td className="px-3 py-4 text-sm text-illusion-black/70">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-3 py-4">
        <div className="flex min-w-[240px] flex-wrap items-center gap-2">
          <select
            className="rounded-full border border-illusion-black/10 bg-white px-3 py-1.5 text-xs text-illusion-black outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <Button size="sm" onClick={() => onSaveStatus(order.id, { status })}>
            Save
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            disabled={status === 'Cancelled' || status === 'Delivered'}
            onClick={() => {
              setStatus('Cancelled')
              onSaveStatus(order.id, { status: 'Cancelled' })
            }}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="gap-1 border border-red-200 text-red-500 hover:text-red-600"
            onClick={() => onDeleteOrder(order.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
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

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Delete this order permanently? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      await deleteOrder(id)
      toast.success('Order deleted')
      await loadOrders()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete order')
    }
  }

  return (
    <AdminLayout title="Manage Orders" subtitle="Track and update order progress.">
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading orders...</Card>
      ) : orders.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Order ID
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Status
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Date
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onDeleteOrder={handleDelete}
                    onSaveStatus={handleSave}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-sm text-illusion-black/60">No orders yet.</Card>
      )}
    </AdminLayout>
  )
}

export default AdminOrders
