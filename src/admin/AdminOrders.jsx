import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2, XCircle } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/StatusBadge'
import { deleteOrder, getOrders, updateOrder } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const statusOptions = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
const filterOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'initial', label: 'Initial Placed' },
  ...statusOptions.map((status) => ({ value: status.toLowerCase(), label: status })),
]

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const OrderRow = ({ order, onDeleteOrder, onSaveStatus }) => {
  const [status, setStatus] = useState(order.status ?? 'Pending')

  return (
    <tr id={`order-${order.id}`} className="border-b border-illusion-black/10 align-top">
      <td className="px-2 py-2 text-xs font-semibold text-illusion-black">
        #{order.id?.slice(0, 8)}
      </td>
      <td className="px-2 py-2 text-xs text-illusion-black">
        <p className="font-medium">{order.customerName ?? '-'}</p>
        <p className="text-[11px] text-illusion-black/60">{order.email ?? '-'}</p>
      </td>
      <td className="px-2 py-2 text-xs text-illusion-black">
        {formatCurrency(order.total ?? 0)}
      </td>
      <td className="px-2 py-2">
        <StatusBadge status={status} />
      </td>
      <td className="px-2 py-2 text-xs text-illusion-black/70">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-2 py-2">
        <div className="flex min-w-[220px] flex-wrap items-center gap-1.5">
          <select
            className="rounded-full border border-illusion-black/10 bg-white px-2 py-1 text-[11px] text-illusion-black outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            className="px-2 py-1 text-[11px]"
            onClick={() => onSaveStatus(order.id, { status })}
          >
            Save
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="gap-1 px-2 py-1 text-[11px]"
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
            className="gap-1 border border-red-200 px-2 py-1 text-[11px] text-red-500 hover:text-red-600"
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
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [location.hash, orders.length])

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

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders

    if (filter === 'initial') {
      return orders.filter((order) => {
        const status = String(order.status ?? 'Pending').toLowerCase()
        const paymentStatus = String(order.paymentStatus ?? '').toLowerCase()
        return status === 'pending' || status === 'placed' || paymentStatus === 'initiated'
      })
    }

    return orders.filter(
      (order) => String(order.status ?? 'Pending').toLowerCase() === filter
    )
  }, [filter, orders])

  return (
    <AdminLayout title="Manage Orders" subtitle="Track and update order progress.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-illusion-black/60">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        <label className="flex items-center gap-2 text-xs text-illusion-black/70">
          Filter
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-full border border-illusion-black/10 bg-white px-3 py-1 text-xs text-illusion-black outline-none"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading orders...</Card>
      ) : filteredOrders.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Order ID
                  </th>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Customer
                  </th>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Amount
                  </th>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Status
                  </th>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Date
                  </th>
                  <th className="px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
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
        <Card className="text-sm text-illusion-black/60">
          No orders found for this filter.
        </Card>
      )}
    </AdminLayout>
  )
}

export default AdminOrders
