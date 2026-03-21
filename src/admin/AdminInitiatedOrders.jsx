import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import StatusBadge from '../components/StatusBadge'
import { getOrders, isInitiatedOrder } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const getReason = (order) => {
  if (order.initiatedReason) return order.initiatedReason
  if (order.paymentError) return order.paymentError
  if (String(order.paymentStatus ?? '').toLowerCase() === 'initiated') {
    return 'Customer reached payment page but did not complete payment'
  }
  return 'Payment not completed'
}

const AdminInitiatedOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadOrders = async () => {
      setLoading(true)
      try {
        const allOrders = await getOrders()
        if (!mounted) return
        setOrders(allOrders)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load initiated orders')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      mounted = false
    }
  }, [])

  const initiatedOrders = useMemo(
    () => orders.filter((order) => isInitiatedOrder(order)),
    [orders]
  )

  return (
    <AdminLayout
      title="Initiated Orders"
      subtitle="Orders where customer started payment but did not complete it."
    >
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading initiated orders...</Card>
      ) : initiatedOrders.length ? (
        <Card className="overflow-hidden p-0">
          <div className="admin-scroll-mobile overflow-x-auto">
            <table className="min-w-[880px] text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Order ID
                  </th>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Product
                  </th>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-illusion-black/60">
                    Customer
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
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {initiatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-illusion-black/10 align-top">
                    <td className="px-3 py-3 text-xs font-semibold text-illusion-black">
                      #{order.orderNumber ?? order.id?.slice(0, 8)}
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black">
                      {(order.items ?? []).map((item) => item.name).join(', ') || '-'}
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black">
                      <p className="font-medium">{order.customerName ?? '-'}</p>
                      <p className="text-[11px] text-illusion-black/60">{order.email ?? '-'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black">
                      {formatCurrency(order.total ?? 0)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.paymentStatus ?? order.status ?? 'Initiated'} />
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black/70">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black/70">
                      {getReason(order)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          No initiated orders currently.
        </Card>
      )}
    </AdminLayout>
  )
}

export default AdminInitiatedOrders
