import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2, XCircle } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/StatusBadge'
import {
  deleteOrder,
  getDisplayOrderStatus,
  getOrders,
  isInitiatedOrder,
  updateOrder,
} from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const statusOptions = [
  'Placed COD',
  'Paid',
  'Shipped',
  'Delivered',
  'Cancelled',
]

const filterOptions = [
  { value: 'all', label: 'All Orders' },
  ...statusOptions.map((status) => ({
    value: status.toLowerCase(),
    label: status,
  })),
]

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const getOrderNumber = (order) => order.orderNumber ?? order.id?.slice(0, 8)

const getItemUnitAmount = (item) => {
  const hasOffer =
    typeof item.offerPrice === 'number' &&
    typeof item.price === 'number' &&
    item.offerPrice < item.price
  return hasOffer ? item.offerPrice : item.price ?? 0
}

const OrderDetails = ({ order }) => {
  if (!order) return null

  const couponDiscount = Number(order?.coupon?.appliedDiscount ?? 0)
  const taxAmount = Number(order?.charges?.taxAmount ?? 0)
  const shippingCharge = Number(order?.charges?.shippingCharge ?? 0)
  const platformCharge = Number(order?.charges?.platformCharge ?? 0)

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 md:grid-cols-2">
        <p><span className="font-semibold text-illusion-black">Order ID:</span> {getOrderNumber(order)}</p>
        <p><span className="font-semibold text-illusion-black">Doc ID:</span> {order.id}</p>
        <p><span className="font-semibold text-illusion-black">Date:</span> {formatDate(order.createdAt)}</p>
        <p><span className="font-semibold text-illusion-black">Status:</span> {getDisplayOrderStatus(order)}</p>
        <p><span className="font-semibold text-illusion-black">Payment Method:</span> {order.paymentMethod ?? '-'}</p>
        <p><span className="font-semibold text-illusion-black">Payment Status:</span> {order.paymentStatus ?? '-'}</p>
      </div>

      <div className="rounded-2xl border border-illusion-black/10 bg-white p-3">
        <p className="mb-1 font-semibold text-illusion-black">Customer</p>
        <p>{order.customerName ?? '-'}</p>
        <p>{order.email ?? '-'}</p>
        {order.address ? (
          <>
            <p>{order.address.name ?? '-'}</p>
            <p>{order.address.line1 ?? '-'}, {order.address.city ?? '-'}, {order.address.state ?? '-'} {order.address.zip ?? '-'}</p>
            <p>{order.address.phone ?? '-'}</p>
          </>
        ) : null}
      </div>

      <div className="rounded-2xl border border-illusion-black/10 bg-white p-3">
        <p className="mb-2 font-semibold text-illusion-black">Items</p>
        <div className="space-y-2">
          {(order.items ?? []).map((item) => (
            <div
              key={`${order.id}_${item.id}`}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-illusion-blush/30">
                  {item.image ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={item.image}
                      alt={item.name ?? 'Product'}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-illusion-black">{item.name ?? 'Item'}</p>
                  <p className="text-illusion-black/60">Qty: {item.quantity ?? 1}</p>
                </div>
              </div>
              <div className="text-right text-illusion-black/70">
                <p>{formatCurrency(getItemUnitAmount(item))} x {item.quantity ?? 1}</p>
                <p className="font-medium text-illusion-black">
                  {formatCurrency(getItemUnitAmount(item) * (item.quantity ?? 1))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-illusion-black/10 bg-white p-3">
        <p className="mb-2 font-semibold text-illusion-black">Summary</p>
        <div className="space-y-1 text-xs text-illusion-black/70">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal ?? 0)}</span>
          </div>
          {couponDiscount > 0 ? (
            <div className="flex items-center justify-between">
              <span>Coupon ({order.coupon?.code ?? 'Applied'})</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          ) : null}
          {taxAmount > 0 ? (
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          ) : null}
          {shippingCharge > 0 ? (
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{formatCurrency(shippingCharge)}</span>
            </div>
          ) : null}
          {platformCharge > 0 ? (
            <div className="flex items-center justify-between">
              <span>Platform</span>
              <span>{formatCurrency(platformCharge)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between border-t border-illusion-black/10 pt-1.5 text-sm font-semibold text-illusion-black">
            <span>Paid Amount</span>
            <span>{formatCurrency(order.total ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const OrderRow = ({ order, onDeleteOrder, onSaveStatus, onOpenDetails }) => {
  const [status, setStatus] = useState(getDisplayOrderStatus(order))

  useEffect(() => {
    setStatus(getDisplayOrderStatus(order))
  }, [order.paymentMethod, order.status])

  return (
    <tr
      id={`order-${order.id}`}
      className="cursor-pointer border-b border-illusion-black/10 align-top transition hover:bg-illusion-blush/20"
      onClick={() => onOpenDetails(order)}
    >
      <td className="px-3 py-3 text-xs font-semibold text-illusion-black">
        #{getOrderNumber(order)}
      </td>
      <td className="px-3 py-3 text-xs text-illusion-black">
        <p className="font-medium">{order.customerName ?? '-'}</p>
        <p className="text-[11px] text-illusion-black/60">{order.email ?? '-'}</p>
      </td>
      <td className="px-3 py-3 text-xs text-illusion-black">
        {(order.items ?? []).slice(0, 2).map((item) => item.name).join(', ') || '-'}
      </td>
      <td className="px-3 py-3 text-xs text-illusion-black">
        {formatCurrency(order.total ?? 0)}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-3 py-3 text-xs text-illusion-black/70">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
        <div className="w-[260px] space-y-2">
          <select
            className="w-full rounded-full border border-illusion-black/10 bg-white px-3 py-1.5 text-xs text-illusion-black outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-4 gap-1.5">
            <Button
              size="sm"
              className="px-0 py-1 text-[11px]"
              onClick={() => onSaveStatus(order.id, { status })}
            >
              Save
            </Button>

            <Button
              size="sm"
              variant="secondary"
              className="gap-1 px-0 py-1 text-[11px]"
              disabled={status === 'Cancelled' || status === 'Delivered'}
              onClick={() => {
                setStatus('Cancelled')
                onSaveStatus(order.id, { status: 'Cancelled' })
              }}
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="col-span-2 gap-1 border border-red-200 px-0 py-1 text-[11px] text-red-500 hover:text-red-600"
              onClick={() => onDeleteOrder(order.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}

const OrderMobileCard = ({ order, onDeleteOrder, onSaveStatus, onOpenDetails }) => {
  const [status, setStatus] = useState(getDisplayOrderStatus(order))

  useEffect(() => {
    setStatus(getDisplayOrderStatus(order))
  }, [order.paymentMethod, order.status])

  return (
    <Card className="space-y-4 p-4">
      <button
        type="button"
        onClick={() => onOpenDetails(order)}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-illusion-black/50">
              Order #{getOrderNumber(order)}
            </p>
            <p className="mt-1 text-sm font-semibold text-illusion-black">
              {order.customerName ?? '-'}
            </p>
            <p className="truncate text-xs text-illusion-black/60">
              {order.email ?? '-'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-3 space-y-1 text-xs text-illusion-black/70">
          <p>{(order.items ?? []).slice(0, 2).map((item) => item.name).join(', ') || '-'}</p>
          <p>{formatDate(order.createdAt)}</p>
          <p className="text-sm font-semibold text-illusion-black">
            {formatCurrency(order.total ?? 0)}
          </p>
        </div>
      </button>

      <div className="space-y-2 border-t border-illusion-black/10 pt-3">
        <select
          className="w-full rounded-2xl border border-illusion-black/10 bg-white px-3 py-2 text-sm text-illusion-black outline-none"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="grid gap-2 sm:grid-cols-3">
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
      </div>
    </Card>
  )
}

const AdminOrders = () => {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

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

  const nonInitiatedOrders = useMemo(
    () => orders.filter((order) => !isInitiatedOrder(order)),
    [orders]
  )

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return nonInitiatedOrders

    return nonInitiatedOrders.filter(
      (order) => getDisplayOrderStatus(order).toLowerCase() === filter
    )
  }, [filter, nonInitiatedOrders])

  return (
    <AdminLayout
      title="Manage Orders"
      subtitle="Track and update order progress. Click any order to view full details."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-illusion-black/60">
          Showing {filteredOrders.length} of {nonInitiatedOrders.length} orders
        </p>
        <label className="flex items-center gap-2 text-xs text-illusion-black/70">
          Filter
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-w-0 rounded-full border border-illusion-black/10 bg-white px-3 py-1 text-xs text-illusion-black outline-none"
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
        <>
          <div className="space-y-3 lg:hidden">
            {filteredOrders.map((order) => (
              <OrderMobileCard
                key={order.id}
                order={order}
                onDeleteOrder={handleDelete}
                onSaveStatus={handleSave}
                onOpenDetails={setSelectedOrder}
              />
            ))}
          </div>
          <Card className="hidden overflow-hidden p-0 lg:block">
            <div className="admin-scroll-mobile overflow-x-auto">
              <table className="min-w-[920px] text-left">
                <thead className="bg-illusion-blush/30">
                  <tr>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Order ID
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Product
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Status
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                      Date
                    </th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
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
                      onOpenDetails={setSelectedOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          No orders found for this filter.
        </Card>
      )}

      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${getOrderNumber(selectedOrder)}` : 'Order'}
        className="max-w-3xl"
      >
        <OrderDetails order={selectedOrder} />
      </Modal>
    </AdminLayout>
  )
}

export default AdminOrders
