import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Banknote,
  IndianRupee,
  ShoppingBag,
  XCircle,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import StatusBadge from '../components/StatusBadge'
import {
  getDisplayOrderStatus,
  isInitiatedOrder,
  subscribeOrders,
} from '../services/orderService'
import { subscribeActiveSessions } from '../services/activeSessionService'
import { formatCurrency } from '../utils/formatCurrency'

const normalizeText = (value) => String(value ?? '').trim().toLowerCase()

const getOrderAmount = (order) => {
  if (typeof order?.total === 'number' && !isNaN(order.total)) return order.total
  if (typeof order?.subtotal === 'number' && !isNaN(order.subtotal)) return order.subtotal
  if (typeof order?.productPrice === 'number' && !isNaN(order.productPrice)) return order.productPrice
  return 0
}

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleDateString()
  return new Date(value).toLocaleDateString()
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeOrders = subscribeOrders((ordersList) => {
      setOrders(ordersList)
      setLoading(false)
    })

    const unsubscribeSessions = subscribeActiveSessions((sessionsList) => {
      setActiveSessions(sessionsList)
    })

    return () => {
      unsubscribeOrders?.()
      unsubscribeSessions?.()
    }
  }, [])

  // Calculate clean metrics with zero duplication
  const metrics = useMemo(() => {
    let totalOrders = 0
    let totalRevenue = 0
    let codOrdersCount = 0
    let cancelledCount = 0

    orders.forEach((order) => {
      // Exclude abandoned checkout sessions
      if (isInitiatedOrder(order)) return

      totalOrders += 1

      const status = normalizeText(order.status)
      const paymentStatus = normalizeText(order.paymentStatus)
      const paymentMethod = normalizeText(order.paymentMethod)
      const amount = getOrderAmount(order)

      const isCancelled =
        status === 'cancelled' ||
        paymentStatus === 'cancelled' ||
        status.includes('cancel')

      if (isCancelled) {
        cancelledCount += 1
      } else {
        totalRevenue += amount

        if (paymentMethod === 'cod') {
          codOrdersCount += 1
        }
      }
    })

    return {
      totalOrders,
      totalRevenue,
      codOrdersCount,
      cancelledCount,
    }
  }, [orders])

  const recentOrders = useMemo(() => {
    return orders
      .filter((order) => !isInitiatedOrder(order))
      .slice(0, 6)
  }, [orders])

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Monitor operations and track performance."
    >
      {/* 5 Minimal Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Total Orders */}
        <Card className="p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-illusion-black/50">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-illusion-black/5 text-illusion-black/70">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-illusion-black">
            {loading ? '—' : metrics.totalOrders}
          </p>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-illusion-black/50">
              Total Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700">
            {loading ? '—' : formatCurrency(metrics.totalRevenue)}
          </p>
        </Card>

        {/* Card 3: Total COD */}
        <Card className="p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-illusion-black/50">
              Total COD
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-700">
            {loading ? '—' : metrics.codOrdersCount}
          </p>
        </Card>

        {/* Card 4: Total Cancelled */}
        <Card className="p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-illusion-black/50">
              Total Cancelled
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-700">
            {loading ? '—' : metrics.cancelledCount}
          </p>
        </Card>

        {/* Card 5: Active Users (Live) */}
        <Card className="p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-illusion-black/50">
                Active Users
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-800">
            {activeSessions.length}
          </p>
        </Card>
      </div>

      {/* Recent Orders - Minimal and Clean */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-illusion-black">
              Recent Orders
            </h3>
            <p className="text-xs text-illusion-black/50">
              Latest confirmed customer purchases.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-illusion-black/70 transition hover:text-illusion-black hover:underline"
          >
            View all orders &rarr;
          </Link>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-illusion-black/50">
            Loading orders...
          </p>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-illusion-black/10 py-10 text-center text-xs text-illusion-black/50">
            No placed orders yet. New purchases will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-illusion-black/10 text-illusion-black/50">
                  <th className="py-2.5 pl-2 font-medium">Order ID</th>
                  <th className="py-2.5 font-medium">Customer</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">Payment</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 pr-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-illusion-black/5">
                {recentOrders.map((order) => {
                  const displayId = order.orderNumber ?? order.id?.slice(0, 8)
                  const status = getDisplayOrderStatus(order)
                  const amount = getOrderAmount(order)

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate('/admin/orders')}
                      className="cursor-pointer transition hover:bg-illusion-blush/20"
                    >
                      <td className="py-3 pl-2 font-semibold text-illusion-black">
                        #{displayId}
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-illusion-black">
                          {order.customerName || 'Customer'}
                        </p>
                        <p className="text-[11px] text-illusion-black/50">
                          {order.email || '-'}
                        </p>
                      </td>
                      <td className="py-3 text-illusion-black/60">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-lg bg-illusion-black/5 px-2 py-0.5 text-[11px] font-medium uppercase text-illusion-black/80">
                          {order.paymentMethod || 'Online'}
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3 pr-2 text-right font-semibold text-illusion-black">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}

export default AdminDashboard
